import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { DatabaseService } from './database.service';
import { DiscussionForum, DiscussionThread, DiscussionPost } from '../model/model';
import { RxDiscussionPostDocument } from '../typings/RxDB';

import * as RxDBTypes from '../typings/RxDB';

@Injectable()
export class PostService implements OnDestroy {
    subscription: Subscription;

    // private _posts: BehaviorSubject<RxDiscussionPostDocument[]> = new BehaviorSubject(null);
    // public posts: Observable<RxDiscussionPostDocument[]> = this._posts.asObservable();

    private _topPost: BehaviorSubject<RxDiscussionPostDocument> = new BehaviorSubject(null);
    public topPost: Observable<RxDiscussionPostDocument> = this._topPost.asObservable();

    private _postMap: BehaviorSubject<Map<String, RxDiscussionPostDocument[]>> = new BehaviorSubject(new Map<String, RxDiscussionPostDocument[]>());
    public postMap: Observable<Map<String, RxDiscussionPostDocument[]>> = this._postMap.asObservable();

    constructor(private http: HttpClient, private databaseService: DatabaseService) {}

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }

    getPosts(url: string, userId: string, threadId: string, isOnline: boolean) {
        if(isOnline) {
            this.getRestPosts(url, userId, threadId);
        }
        else {
            this.readPosts(threadId);
        }
    }

    async getRestPosts(url: string, userId: string, threadId: string) {
        url += '/webapps/bbgs-bboffline-BBLEARN/app/api/users/_' + userId + '/threads/_' + threadId + '/posts';

        this.http.get<DiscussionPost[]>(url)
        .subscribe((data: DiscussionPost[]) => this.writePosts(data));
    }

    async writePosts(data: DiscussionPost[]) {
        const db = await this.databaseService.get();
        console.debug('ThreadService: writing data:', data);

        let posts: RxDiscussionPostDocument[] = [];
        for( let i: number = 0 ; i < data.length ; i++ ) {
            data[i].id = data[i].id.substr(1);
            if( data[i].parentId ) {
                data[i].parentId = data[i].parentId.substr(1);
            }
            data[i].threadId = data[i].threadId.substr(1);
            
            const doc = await db.posts.upsert(data[i]);
            console.debug('Inserted post: ', doc);
            posts.push(doc);
        }
        // usually returns top post at end
        posts = posts.reverse();

        await this.createPostMap(posts);
        // this._posts.next(posts);
    }

    async readPosts(threadId: string) {
        const db = await this.databaseService.get();

        console.debug('ThreadService.read:');
        console.debug('ThreadId:', threadId);

        const posts$ = await db.posts.find().where('threadId').eq(threadId).sort({ 'postDate': 'desc' }).$;
        this.subscription = posts$.subscribe(posts => this.createPostMap(posts));
    }

    async createPostMap(posts: RxDiscussionPostDocument[]) {
        // get the top post
        for( let i: number = 0 ; i < posts.length ; i++ ) {
            console.debug('Post:', posts[i]);
            if(!posts[i].parentId) {
                let post: RxDiscussionPostDocument = posts.splice(i, 1)[0];
                this._topPost.next(post);
                break;
            }
        }

        // with the rest of the array, create a map of parents/children.
        let map: Map<String, RxDiscussionPostDocument[]> = new Map();
        for( let i: number = 0 ; i < posts.length ; i++ ) {
            if(!map.has( posts[i].parentId )) {
                let postArray = [ posts[i] ];
                map.set( posts[i].parentId, postArray );
            }
            else {
                let postArray = map.get( posts[i].parentId );
                postArray.push(posts[i]);
                map.set( posts[i].parentId, postArray);
            }
        }
        this._postMap.next(map);
    }

    async clearPosts() {
        this._topPost.next(null);
        this._postMap.next(new Map<String, RxDiscussionPostDocument[]>());
    }
}