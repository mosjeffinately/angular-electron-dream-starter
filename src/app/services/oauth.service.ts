import { Injectable, Inject } from '@angular/core';
import { Token, BbToken, UserToken } from '../model/model';
import { HttpClient } from '@angular/common/http';
import { HttpParams } from '@angular/common/http';
import { HttpHeaders } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

const Store = window.require('electron-store');
const store = new Store();

@Injectable()
export class OAuthService {
    url: string;
    initialToken: Token = { access_token: '', expires: new Date() }

    private _token: BehaviorSubject<Token> = new BehaviorSubject(null);
    public token: Observable<Token> = this._token.asObservable();

    private _userToken: BehaviorSubject<UserToken> = new BehaviorSubject(null);
    public userToken: Observable<UserToken> = this._userToken.asObservable();

    constructor(private http: HttpClient) {}

    isUserTokenExpired() {
        let now: Date = new Date();

        if( !this._userToken.getValue() ) {
            return false;
        }
        else if(this._userToken.getValue().access_token && 
                now.getTime() < this._userToken.getValue().expires.getTime()) {
            return true;
        }
        else {
            return false;
        }
    }

    getUserToken(url: string, authorizationCode: string) {
        url += '/learn/api/public/v1/oauth2/token';
        const headers = new HttpHeaders()
        .append('Content-Type', 'application/x-www-form-urlencoded')
        .append('Authorization', 'Basic MGY0OThjZTQtZTgzYi00ZGJmLThiYjctYmUzZTkxYjM0YWM3Okhub2g3NkRQaGJxQTJuYklJQTRiOXBaMFBkZDZZZnVx');
        const params = new HttpParams()
        .set('grant_type', 'authorization_code')
        .set('code', authorizationCode)
        .set('redirect_uri', 'urn:ietf:wg:oauth:2.0:oob');
        
        this.http.post<BbToken>(url, params.toString(), {headers: headers})
        .subscribe((bbToken: BbToken) => {
            const now: Date = new Date();

            console.debug('Bb Token:', bbToken);

            const token: UserToken  = {
                access_token: bbToken.access_token,
                expires: new Date(now.getTime() + bbToken.expires_in),
                userId: bbToken.user_id
            };

            store.set('bbUserToken', token);
            this._userToken.next(token);
        });
    }

    isRestTokenExpired(): boolean {
        let now: Date = new Date();

        if( !this._token.getValue() ) {
            return false;
        }
        else if(this._token.getValue().access_token && 
                now.getTime() < this._token.getValue().expires.getTime()) {
            return true;
        }
        else {
            return false;
        }
    }

    getRestToken(url: string) {
        url += '/learn/api/public/v1/oauth2/token';
        const headers = new HttpHeaders()
        .append('Content-Type', 'application/x-www-form-urlencoded')
        .append('Authorization', 'Basic MGY0OThjZTQtZTgzYi00ZGJmLThiYjctYmUzZTkxYjM0YWM3Okhub2g3NkRQaGJxQTJuYklJQTRiOXBaMFBkZDZZZnVx');
        const params = new HttpParams()
        .set('grant_type', 'client_credentials');

        this.http.post<BbToken>(url, params.toString(), {headers: headers})
        .subscribe((bbToken: BbToken) => {
            let now: Date = new Date();

            let token: Token = {
                access_token: bbToken.access_token,
                expires: new Date(now.getTime() + bbToken.expires_in)
            };

            store.set('bbRestToken', token);
            this._token.next(token);
        });
    }
}