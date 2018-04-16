import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { forkJoin } from 'rxjs/observable/forkJoin';
import 'rxjs/add/operator/catch';
import { DatabaseService } from './database.service';
import { UserService } from './user.service';
import { CourseService } from './course.service';
import { AttachmentService } from './attachment.service';
import { EmbeddedContentService } from './embedded-content.service';
import { BbContentResults, BbContent, Content } from '../model/model';
import { RxContentDocument, RxCourseDocument, RxUserDocument } from '../typings/RxDB';
import * as RxDBTypes from '../typings/RxDB';

@Injectable()
export class ContentService implements OnDestroy {
    url: string;
    isOnline: boolean;
    contentAreasSubscription: Subscription;
    parentSubscription: Subscription;
    contentSubscription: Subscription;
    userSubscription: Subscription;
    user: RxUserDocument;
    courseSubscription: Subscription;
    course: RxCourseDocument;

    private _contentAreas: BehaviorSubject<RxContentDocument[]> = new BehaviorSubject(null);
    public contentAreas: Observable<RxContentDocument[]> = this._contentAreas.asObservable();

    private _contentArea: BehaviorSubject<RxContentDocument> = new BehaviorSubject(null);
    public contentArea: Observable<RxContentDocument> = this._contentArea.asObservable();

    private _parent: BehaviorSubject<RxContentDocument> = new BehaviorSubject(null);
    public parent: Observable<RxContentDocument> = this._parent.asObservable();

    private _content: BehaviorSubject<RxContentDocument[]> = new BehaviorSubject(null);
    public content: Observable<RxContentDocument[]> = this._content.asObservable();

    private _contentItem: BehaviorSubject<RxContentDocument> = new BehaviorSubject(null);
    public contentItem: Observable<RxContentDocument> = this._contentItem.asObservable();

    private _breadcrumbs: BehaviorSubject<RxContentDocument[]> = new BehaviorSubject(null);
    public breadcrumbs: Observable<RxContentDocument[]> = this._breadcrumbs.asObservable();

    constructor(private http: HttpClient, 
                private databaseService: DatabaseService,
                private userService: UserService,
                private courseService: CourseService,
                private attachmentService: AttachmentService,
                private embeddedContentService: EmbeddedContentService) {
        this.courseSubscription = this.courseService.course.subscribe(course => this.course = course);
        this.userSubscription = this.userService.user.subscribe(user => this.user = user);
    }

    ngOnDestroy() {
        this.contentAreasSubscription.unsubscribe();
        this.parentSubscription.unsubscribe();
        this.contentSubscription.unsubscribe();
        this.userSubscription.unsubscribe();
        this.courseSubscription.unsubscribe();
    }

    async getContentArea(url: string, contentId: string) {
        this._contentAreas.getValue().forEach((contentArea: RxContentDocument) => {
            if( contentId == contentArea.id ) {
                this._contentArea.next(contentArea);
                return;
            }
        });
    }

    async getContentAreas(url: string, courseId: string, isOnline: boolean) {
        this.url = url;
        this.isOnline = isOnline;
        if( isOnline ) {
            this.getRestContentAreas(url, courseId);
        }
        else {
            this.readContentAreas(courseId);
        }
    }

    async getRestContentAreas(url: string, courseId: string) {
        console.debug('ContentService.getRestContentAreas:');
        url += '/learn/api/public/v1/courses/_' + courseId + '/contents'; 

        const httpHeaders: HttpHeaders = new HttpHeaders().append('Enable-Bb-Bearer-Token', 'true');
        const httpParams: HttpParams = new HttpParams().set('fields', 'id,parentId,title,body,description,created,position,hasChildren,availability,contentHandler');

        this.http.get<BbContentResults>(url, {headers: httpHeaders, params: httpParams})
        .subscribe((results: BbContentResults) => {
            let forkJoinQueue = [];
            let contentAreas: BbContent[] = results.results;

            const httpHeaders: HttpHeaders = new HttpHeaders().append('Enable-Bb-Bearer-Token', 'true');
            const httpParams: HttpParams = new HttpParams().set('fields', 'id');

            contentAreas.forEach((contentArea: BbContent) => {
                let childUrl = url + "/" + contentArea.id + '/children';
                forkJoinQueue.push(this.http.get<BbContentResults>(url, { headers: httpHeaders, params: httpParams }));
            });

            let availableContentAreas: BbContent[] = [];
            forkJoin(forkJoinQueue)
            .subscribe((values: BbContentResults[]) => {
                console.debug('Values:', values);
                for( let i = 0 ; i < values.length ; i++ ) {
                    console.debug('Values[' + i + ']:', values[i]);
                    if( values[i].results && values[i].results.length > 0 ) {
                        availableContentAreas.push(contentAreas[i]);
                    }
                }

                this.writeContentAreas(availableContentAreas, courseId);
            });
        });
    }
  
    async readContentAreas(courseId: string) {
        const db = await this.databaseService.get();
        console.debug('ContentService.readContentAreas');
        console.debug('Course:', courseId);

        const contentAreas$ = await db.contents.find()
            .where('courseId').eq(courseId)
            .and('parentId').eq(null)
            .sort('position')
            .$;
        this.contentAreasSubscription = contentAreas$.subscribe(contentAreas => this._contentAreas.next(contentAreas));
    }

    async writeContentAreas(content: BbContent[], courseId: string) {
        console.debug('Content: ', content);

        const db = await this.databaseService.get();

        console.debug('ContentService.writeContentAreas:');
        console.debug('content:', content);
        console.debug('course:', courseId);

        let contentAreas: RxContentDocument[] = [];
        for( let i = 0 ; i < content.length ; i++ ) {
            try {
                // add the course ID before storing.
                let itemWithCourseId: Content = <Content> content[i];
                itemWithCourseId.id = itemWithCourseId.id.substr(1);
                itemWithCourseId.courseId = courseId;
                const doc = await db.contents.upsert(itemWithCourseId);
                console.debug('Inserted content area document.', doc);
                contentAreas.push(doc);
            }
            catch(err) {
                console.error('Error inserting document.');
                console.error(err);
            }
        }

        this._contentAreas.next(contentAreas);
    }

    async getContent(url: string, course: RxCourseDocument, parent: RxContentDocument, isOnline: boolean) {

        this.getBreadcrumbs(parent);
        if( isOnline ) {
            await this.getRestContent(url, course, parent);
        }
        else {
            await this.readContent(course, parent);
        }
    }

    async getRestContent(url: string, course: RxCourseDocument, parent: RxContentDocument) {
        url += '/learn/api/public/v1/courses/externalId:' + course.externalId + '/contents/_' + parent.id + '/children'; 

        const httpHeaders: HttpHeaders = new HttpHeaders().append('Enable-Bb-Bearer-Token', 'true');
        const httpParams: HttpParams = new HttpParams().set('fields', 'id,parentId,title,body,description,created,position,hasChildren,availability,contentHandler');

        this.http.get<BbContentResults>(url, {headers: httpHeaders, params: httpParams})
        .subscribe((results: BbContentResults) => this.writeContent(results.results, this.user, course));
    }

    async readContentById(course: RxCourseDocument, parentId: string) {
        const db = await this.databaseService.get();
        console.debug('ContentService.readContentById');
        console.debug('Course:', course);
        console.debug('ParentId:', parentId);

        const content$ = await db.contents.findOne()
            .where('id').eq(parentId)
            .and('courseId').eq(course.id)
            .$;
        this.parentSubscription = content$.subscribe(content => {
            console.debug('Found parent:', content);
            this._parent.next(content)
        });
    }

    async readContent(course: RxCourseDocument, parent: RxCourseDocument) {
        const db = await this.databaseService.get();
        console.debug('ContentService.readContent');
        console.debug('Course:', course);
        console.debug('Parent:', parent);

        const content$ = await db.contents.find()
            .where('courseId').eq(course.id)
            .and('parentId').eq(parent.id)
            .sort('position')
            .$;
        this.contentSubscription = content$.subscribe(content => this._content.next(content));
    }

    async writeContent(content: BbContent[], user: RxUserDocument, course: RxCourseDocument) {
        const db = await this.databaseService.get();

        console.debug('ContentService.writeContent:');
        console.debug('content:', content);

        let contentList: RxContentDocument[] = [];
        let forkJoinQueue = [];
        for( let i = 0 ; i < content.length ; i++ ) {
            try {
                // add the course ID before storing.
                let itemWithCourseId: Content = <Content> content[i];
                itemWithCourseId.id = itemWithCourseId.id.substr(1);
                itemWithCourseId.parentId = itemWithCourseId.parentId.substr(1);
                itemWithCourseId.courseId = course.id;

                const doc = await db.contents.upsert(itemWithCourseId);
                console.debug('Inserted content document.', doc);
                let item: RxContentDocument = await this.embeddedContentService.replaceContentTemplateVars(user, course, doc);
                contentList.push(item);
                this.attachmentService.getAttachments(this.url, course.id, item.id, this.isOnline);
            }
            catch(err) {
                console.error('Error inserting document.');
                console.error(err);
            }
        }

        this._content.next(contentList);
    }

    async getParentContent(contentId: string) {
        // Check content areas.
        this._contentAreas.getValue().forEach((contentArea: RxContentDocument) => {
            if( contentId == contentArea.id ) {
                this._parent.next(contentArea);
                return;
            }
        });
        // Check the content.
        if( this._content.getValue() != null ) {
            this._content.getValue().forEach((content: RxContentDocument) => {
                if( contentId == content.id ) {
                    this._parent.next(content);
                    return;
                }
            })
        }
        // Check the breadcrumbs.
        if( this._breadcrumbs.getValue() != null ) {
            this._breadcrumbs.getValue().forEach((content: RxContentDocument) => {
                if( contentId == content.id ) {
                    this._parent.next(content);
                    return;
                }
            });
        }
    }

    async getContentItem(contentId: string) {
        // Check the content.
        if( this._content.getValue() != null ) {
            this._content.getValue().forEach((content: RxContentDocument) => {
                if( contentId == content.id ) {
                    this._contentItem.next(content);
                    return;
                }
            })
        }
    }
    
    async getBreadcrumbs(content: RxContentDocument) {
        const db = await this.databaseService.get();

        console.debug('Getting breadcrumbs for content:', content);

        let breadcrumbs: RxContentDocument[] = [];
        if( content.parentId == null ) {
            breadcrumbs.push(content);
            this._breadcrumbs.next(breadcrumbs);
        }
        else {
            // find the parent index and set breadcrumbs from there.
            let index = -1;
            breadcrumbs = this._breadcrumbs.getValue();
            for( let i = 0 ; i < breadcrumbs.length ; i++ ) {
                if(breadcrumbs[i].id == content.parentId ) {
                    index = i;
                    break;
                }
            }

            if(index >= 0) {
                breadcrumbs = breadcrumbs.slice(0, index+1);
            }
            // remove any images from the breadcrumb title
            content = this.embeddedContentService.removeTitleImages(content);
            breadcrumbs.push(content);
            this._breadcrumbs.next(breadcrumbs);
        }
        
    }

    async clearContents() {
        this._content.next(null);
    }

    async clearContentAreas() {
        this._contentAreas.next(null);
    }
}