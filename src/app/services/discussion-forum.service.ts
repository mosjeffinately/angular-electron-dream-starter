import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { DatabaseService } from './database.service';
import { DiscussionForum } from '../model/model';
import { RxDiscussionForumDocument } from '../typings/RxDB';

import * as RxDBTypes from '../typings/RxDB';

@Injectable()
export class ForumService implements OnDestroy {
    forumSubscription: Subscription;

    private _forums: BehaviorSubject<RxDiscussionForumDocument[]> = new BehaviorSubject(null);
    public forums: Observable<RxDiscussionForumDocument[]> = this._forums.asObservable();

    private _forum: BehaviorSubject<RxDiscussionForumDocument> = new BehaviorSubject(null);
    public forum: Observable<RxDiscussionForumDocument> = this._forum.asObservable();

    constructor(private http: HttpClient, private databaseService: DatabaseService) {}

    ngOnDestroy() {
        this.forumSubscription.unsubscribe();
    }

    getForums(url: string, userId: string, discussionId: string, isOnline: boolean) {
        if(isOnline) {
            this.getRestForums(url, userId, discussionId);
        }
        else {
            this.readForums(discussionId);
        }
    }

    async getRestForums(url: string, userId: string, discussionId: string) {
        url += '/webapps/bbgs-bboffline-BBLEARN/app/api/users/_' + userId + '/discussions/_' + discussionId + '/forums';

        this.http.get<DiscussionForum[]>(url)
        .subscribe((data: DiscussionForum[]) => this.writeForums(data));
    }

    async getForum(id: string) {
        const forums = this._forums.getValue();
        for( let i = 0 ; i < forums.length ; i++ ) {
            if( forums[i].id == id ) {
                this._forum.next(forums[i]);
                break;
            }
        }
    }

    async writeForums(data: DiscussionForum[]) {
        const db = await this.databaseService.get();
        console.debug('DiscussionService: writing data:', data);

        let forums: RxDiscussionForumDocument[] = [];
        for( let i = 0 ; i < data.length ; i++ ) {
            data[i].id = data[i].id.substr(1);
            data[i].discussionId = data[i].discussionId.substr(1);
            
            const doc = await db.forums.upsert(data[i]);
            console.debug('Inserted forum: ', doc);
            forums.push(doc);
        }
        
        this._forums.next(forums);
    }

    async readForums(discussionId: string) {
        const db = await this.databaseService.get();

        console.debug('DiscussionService.readDiscussionBoards:');
        console.debug('DiscussionId: ', discussionId);

        const forums$ = await db.forums.find().where('discussionId').eq(discussionId).sort('position').$;
        this.forumSubscription = forums$.subscribe(forums => this._forums.next(forums));
    }
}