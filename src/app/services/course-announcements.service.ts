import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { DatabaseService } from './database.service';
import { EmbeddedContentService } from './embedded-content.service';
import { UserService } from './user.service';
import { SystemAnnouncement, SystemAnnouncementResults, CourseAnnouncementResults, CourseAnnouncement } from '../model/model';
import { RxUserDocument, RxCourseAnnouncementDocument, RxCourseDocument } from '../typings/RxDB';
import { CourseService } from './course.service';

@Injectable()
export class CourseAnnouncementService implements OnDestroy {
    subscription: Subscription;
    userSubscription: Subscription;
    user: RxUserDocument;
    courseSubscription: Subscription;
    course: RxCourseDocument;

    private _announcementList: BehaviorSubject<RxCourseAnnouncementDocument[]> = new BehaviorSubject(null);
    public announcementList: Observable<RxCourseAnnouncementDocument[]> = this._announcementList.asObservable();

    constructor(private http: HttpClient, private databaseService: DatabaseService, private userService: UserService, private courseService: CourseService, private embeddedContentService: EmbeddedContentService) {}

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.userSubscription.unsubscribe();
        this.courseSubscription.unsubscribe();
    }

    async getCourseAnnouncements(url: string, courseId: string, isOnline: boolean) {
        this.userSubscription = this.userService.user.subscribe((user: RxUserDocument) => this.user = user);
        this.courseSubscription = this.courseService.course.subscribe((course: RxCourseDocument) => this.course = course);

        if( isOnline ) {

            url += '/webapps/bbgs-bboffline-BBLEARN/app/api/courses/_' + courseId + '/users/_' + this.user.id + '/announcements';
            const httpHeaders: HttpHeaders = new HttpHeaders().append('Enable-Bb-Bearer-Token', 'true');
            const httpParams: HttpParams = new HttpParams().set('fields', 'id,title,body,availability,created');
    
            this.http.get<CourseAnnouncement[]>(url, {headers: httpHeaders, params: httpParams})
            .subscribe((announcements: CourseAnnouncement[]) => {
                this.writeCourseAnnouncements(announcements);
            });
        }
        else {
            this.readCourseAnnouncements(courseId);
        }
    }

    async writeCourseAnnouncements(announcements: CourseAnnouncement[]) {

        const db = await this.databaseService.get();
        console.debug('CourseAnnouncementsService.writeCourseAnnouncements:');
        console.debug('announcements:', announcements);

        let announcementList: RxCourseAnnouncementDocument[] = [];
        for( let i = 0 ; i < announcements.length ; i++ ) {
            try {
                // Remove the _ from the front of the id so RxDB doesn't complain.
                announcements[i].id = announcements[i].id.substr(1);
                announcements[i].courseId = announcements[i].courseId.substr(1);

                const doc = await db.courseannouncements.upsert(announcements[i]);
                console.debug('Inserted course announcement document.', doc);
                let announcement: RxCourseAnnouncementDocument = await this.embeddedContentService.replaceCourseAnnouncementTemplateVars(this.user, this.course, doc);
                announcementList.push(announcement);
            }
            catch(err) {
                console.error('Error inserting document.');
                console.error(err);
            }
        }

        this._announcementList.next(announcementList);
    }

    async readCourseAnnouncements(courseId: string) {
        const db = await this.databaseService.get();
        console.debug('CourseAnnouncementsService.readCourseAnnouncements');

        const announcements$ = await db.courseannouncements.find().where('courseId').eq(courseId).$;
        this.subscription = announcements$.subscribe(announcements => {
            console.debug('Announcements: ', announcements);
            this._announcementList.next(announcements)
        });
    }
}