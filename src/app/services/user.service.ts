import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { DatabaseService } from './database.service';
import { User, BbUser } from '../model/model';
import { RxUserDocument } from '../typings/RxDB';

import * as RxDBTypes from '../typings/RxDB';


@Injectable()
export class UserService implements OnDestroy {
    subscription: Subscription;

    private _user: BehaviorSubject<RxUserDocument> = new BehaviorSubject(null);
    public user: Observable<RxUserDocument> = this._user.asObservable();

    constructor(private http: HttpClient, private databaseService: DatabaseService) {}

    ngOnDestroy() {
        if( this.subscription ) {
            this.subscription.unsubscribe();
        }
    }

    getUserDetails(url: string, username: string, password: string, isOnline: boolean): void {
        if( isOnline ) {
            this.getRestUserDetails(url, username, password);
        }
        else {
            this.readUserInfo(username);
        }
    }

    getRestUserDetails(url: string, username: string, password: string): void {
        let userUrl = url + '/learn/api/public/v1/users/userName:' + username;

        const httpHeaders: HttpHeaders = new HttpHeaders().append('Enable-Bb-Bearer-Token', 'true');
        const httpParams: HttpParams = new HttpParams().set('fields', 'id,externalId,userName,name');

        this.http.get<BbUser>(userUrl, {headers: httpHeaders, params: httpParams})
        .subscribe((user: BbUser) => {
            let userInfo: User = {
                id: user.id.substr(1),
                externalId: user.externalId,
                userName: user.userName,
                password: password,
                givenName: user.name.given,
                familyName: user.name.family
            }

            this.writeUserInfo(userInfo);
        });
    }

    getRestUserDetailsByUuid(url: string, uuid: string): void {
        let userUrl = url + '/learn/api/public/v1/users/uuid:' + uuid;

        const httpHeaders: HttpHeaders = new HttpHeaders().append('Enable-Bb-User-Bearer-Token', 'true');
        const httpParams: HttpParams = new HttpParams().set('fields', 'id,externalId,userName,name');

        this.http.get<BbUser>(userUrl, {headers: httpHeaders, params: httpParams})
        .subscribe((user: BbUser) => {
            let userInfo: User = {
                id: user.id.substr(1),
                externalId: user.externalId,
                userName: user.userName,
                password: '',
                givenName: user.name.given,
                familyName: user.name.family
            }

            this.writeUserInfo(userInfo);
        });
    }

    async writeUserInfo(userInfo: any) {
        const db = await this.databaseService.get();

        console.debug('UserService.writeUserInfo:');
        console.debug('userName:', userInfo.userName);
        console.debug('userInfo:', userInfo);

        try {
            const doc = await db.users.upsert(userInfo);
            console.debug('Inserted document:', doc);
            this._user.next(doc);
        }
        catch(err) {
            console.error('UserService.writeUserInfo: error');
            throw err;
        }
    }

    async readUserInfo(userName: string) {
        const db = await this.databaseService.get();

        const user$ = db.users.findOne().where('userName').eq(userName).$;
        this.subscription = user$.subscribe(user => {
            console.debug('User:', user);
            this._user.next(user)
        });
    }
}