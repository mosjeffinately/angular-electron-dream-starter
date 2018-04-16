import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { DatabaseService } from './database.service';
import { DiscussionForum, DiscussionThread } from '../model/model';
import { RxDiscussionThreadDocument } from '../typings/RxDB';

import * as RxDBTypes from '../typings/RxDB';

@Injectable()
export class ThreadService implements OnDestroy {
    subscription: Subscription;

    private _threads: BehaviorSubject<RxDiscussionThreadDocument[]> = new BehaviorSubject(null);
    public threads: Observable<RxDiscussionThreadDocument[]> = this._threads.asObservable();

    private _thread: BehaviorSubject<RxDiscussionThreadDocument> = new BehaviorSubject(null);
    public thread: Observable<RxDiscussionThreadDocument> = this._thread.asObservable();

    constructor(private http: HttpClient, private databaseService: DatabaseService) {}

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    getThreads(url: string, userId: string, forumId: string, isOnline: boolean) {
        if(isOnline) {
            this.getRestThreads(url, userId, forumId);
        }
        else {
            this.readThreads(forumId);
        }
    }

    async getRestThreads(url: string, userId: string, forumId: string) {
        url += '/webapps/bbgs-bboffline-BBLEARN/app/api/users/_' + userId + '/forums/_' + forumId + '/threads';

        this.http.get<DiscussionThread[]>(url)
        .subscribe((data: DiscussionThread[]) => this.writeThreads(data));
    }

    async getThread(id: string) {
        const threads = this._threads.getValue();
        for( let i = 0 ; i < threads.length ; i++ ) {
            console.debug('thread: ', threads[i]);
            if( threads[i].id == id ) {
                console.debug('found thread:', threads[i]);
                this._thread.next(threads[i]);
                break;
            }
        }
    }

    async writeThreads(data: DiscussionThread[]) {
        const db = await this.databaseService.get();
        console.debug('ThreadService: writing data:', data);

        let threads: RxDiscussionThreadDocument[] = [];
        for( let i = 0 ; i < data.length ; i++ ) {
            data[i].id = data[i].id.substr(1);
            data[i].forumId = data[i].forumId.substr(1);
            data[i].status = data[i].status.charAt(0).toUpperCase() + data[i].status.slice(1).toLowerCase();
            
            const doc = await db.threads.upsert(data[i]);
            console.debug('Inserted thread: ', doc);
            threads.push(doc);
        }

        threads.sort((a, b) => {
            let x = new Date(Date.parse(a.postDate));
            let y = new Date(Date.parse(b.postDate));

            if( x <= y ) { return 1 }
            if( x > y ) { return -1 }
            return 0;
        });
        
        this._threads.next(threads);
    }

    async readThreads(forumId: string) {
        const db = await this.databaseService.get();

        console.debug('ThreadService.read:');
        console.debug('ForumId:', forumId);

        const threads$ = await db.threads.find().where('forumId').eq(forumId).sort('postDate').$;
        this.subscription = threads$.subscribe(threads => this._threads.next(threads));
    }
}