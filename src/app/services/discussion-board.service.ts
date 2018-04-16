import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { DatabaseService } from './database.service';
import { UserService } from './user.service';
import { CourseService } from './course.service';
import { AttachmentService } from './attachment.service';
import { EmbeddedContentService } from './embedded-content.service';
import { BbContentResults, BbContent, Content, DiscussionBoard } from '../model/model';
import { RxContentDocument, RxCourseDocument, RxUserDocument, RxDiscussionBoardDocument } from '../typings/RxDB';

import * as RxDBTypes from '../typings/RxDB';

@Injectable()
export class DiscussionService implements OnDestroy {

    discussionBoardSubscription: Subscription;

    private _discussionBoards: BehaviorSubject<RxDiscussionBoardDocument[]> = new BehaviorSubject(null);
    public discussionBoards: Observable<RxDiscussionBoardDocument[]> = this._discussionBoards.asObservable();

    private _discussionBoard: BehaviorSubject<RxDiscussionBoardDocument> = new BehaviorSubject(null);
    public discussionBoard: Observable<RxDiscussionBoardDocument> = this._discussionBoard.asObservable();

    constructor(private http: HttpClient, private databaseService: DatabaseService) {}

    ngOnDestroy() {
        this.discussionBoardSubscription.unsubscribe();
    }

    getDiscussionBoards(url: string, courseId: string, isOnline: boolean) {
        if(isOnline) {
            this.getRestDiscussionBoards(url, courseId);
        }
        else {
            this.readDiscussionBoards(courseId);
        }
    }

    async getRestDiscussionBoards(url: string, courseId: string) {
        url += '/webapps/bbgs-bboffline-BBLEARN/app/api/courses/_' + courseId + '/discussions';

        this.http.get<DiscussionBoard[]>(url)
        .subscribe((data: DiscussionBoard[]) => this.writeDiscussionBoards(data));
    }

    async getDiscussionBoard(id: string) {
        const discussions = this._discussionBoards.getValue();
        for(let i = 0 ; i < discussions.length ; i++ ) {
            if(discussions[i].id == id) {
                this._discussionBoard.next(discussions[i]);
                break;
            }
        }
    }

    async writeDiscussionBoards(data: DiscussionBoard[]) {
        const db = await this.databaseService.get();
        console.debug('DiscussionService: writing data:', data);

        let discussions: RxDiscussionBoardDocument[] = [];
        for( let i = 0 ; i < data.length ; i++ ) {
            data[i].id = data[i].id.substr(1);
            data[i].courseId = data[i].courseId.substr(1);
            
            const doc = await db.discussions.upsert(data[i]);
            console.debug('Inserted discussion: ', doc);
            discussions.push(doc);
        }
        
        this._discussionBoards.next(discussions);
    }

    async readDiscussionBoards(courseId: string) {
        const db = await this.databaseService.get();

        console.debug('DiscussionService.readDiscussionBoards:');
        console.debug('Course Id: ', courseId);

        const discussions$ = await db.discussions.find().where('courseId').eq(courseId).sort('position').$;
        this.discussionBoardSubscription = discussions$.subscribe(discussions => this._discussionBoards.next(discussions));
    }

    async clearDiscussionBoard() {
        this._discussionBoard.next(null);
    }
}