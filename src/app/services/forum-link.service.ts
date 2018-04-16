import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { DatabaseService } from './database.service';
import { DiscussionForum, ForumLink } from '../model/model';

import * as RxDBTypes from '../typings/RxDB';
import { RxForumLinkDocument } from '../typings/RxDB';

@Injectable()
export class ForumLinkService implements OnDestroy {
    subscription: Subscription;

    private _forumLink: BehaviorSubject<RxForumLinkDocument> = new BehaviorSubject(null);
    public forumLink: Observable<RxForumLinkDocument> = this._forumLink.asObservable();

    constructor(private http: HttpClient, private databaseService: DatabaseService) {}

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    getForumLink(url: string, contentId: string, isOnline: boolean) {
        if(isOnline) {
            this.getRestForumLink(url, contentId);
        }
        else {
            this.readForumLink(contentId);
        }
    }

    getRestForumLink(url: string, contentId: string) {
        url += '/webapps/bbgs-bboffline-BBLEARN/app/api/contents/_' + contentId + '/forumlink';

        this.http.get<ForumLink>(url)
        .subscribe((data: ForumLink) => this.writeForumLink(data));
    }

    async writeForumLink(forumLink: ForumLink) {
        const db = await this.databaseService.get();

        forumLink.id = forumLink.id.substr(1);
        forumLink.contentId = forumLink.contentId.substr(1);
        const doc = await db.forumlink.upsert(forumLink);
        this._forumLink.next(doc);
    }

    async readForumLink(contentId: string) {
        const db = await this.databaseService.get();
        
        let forumlink$ = await db.forumlink.findOne().where('contentId').eq(contentId).$;
        this.subscription = forumlink$.subscribe(forumLink => this._forumLink.next(forumLink));
    }

    async clearForumLink() {
        this._forumLink.next(null);
    }
}