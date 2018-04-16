import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BbCourseData, CourseData, CourseMembershipData, CourseMembershipResults } from '../model/model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { ReplaySubject } from 'rxjs/ReplaySubject';
import { Subscription } from 'rxjs/Subscription';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { RxCourseDocument } from '../typings/RxDB';
import { DatabaseService } from './database.service';

@Injectable()
export class CourseService implements OnDestroy {
    courseListSubscription: Subscription;
    courseSubscription: Subscription;

    private _courseList: BehaviorSubject<RxCourseDocument[]> = new BehaviorSubject(null);
    public courseList: Observable<RxCourseDocument[]> = this._courseList.asObservable();

    private _course: BehaviorSubject<RxCourseDocument> = new BehaviorSubject(null);
    public course: Observable<RxCourseDocument> = this._course.asObservable();

    constructor(private http: HttpClient, private databaseService: DatabaseService) {}

    ngOnDestroy() {
        this.courseListSubscription.unsubscribe();
        this.courseSubscription.unsubscribe();
    }

    async getCourses(url: string, username: string, isOnline: boolean) {
        if(isOnline) {
            this.getRestCourseMemberships(url, username);
        }
        else {
            this.readAllCourses();
        }
    }

    async getCourse(url: string, courseId: string, isOnline: boolean) {
        // we should always have the course saved, so we should just load from the db.
        console.debug('CourseService.getCourse:');
        console.debug('courseId:', courseId);
        await this.readCourse(courseId);
    }

    async getRestCourseMemberships(url: string, username: string) {
        console.debug('getRestCourseMemberships fired.');
        const courseMembershipUrl = url + '/learn/api/public/v1/users/userName:' + username + '/courses'; 

        const httpHeaders: HttpHeaders = new HttpHeaders().append('Enable-Bb-Bearer-Token', 'true');
        const httpParams: HttpParams = new HttpParams().set('fields', 'userId,courseId,availability');
        
        this.http.get(courseMembershipUrl, { headers: httpHeaders, params: httpParams })
        .subscribe((results: CourseMembershipResults) => {
            const memberships: CourseMembershipData[] = results.results;
            const httpHeaders: HttpHeaders = new HttpHeaders().append('Enable-Bb-Bearer-Token', 'true');
            const httpParams: HttpParams = new HttpParams().set('fields', 'id,externalId,courseId,name,description,created,termId,availability');

            const courseUrl = url + '/learn/api/public/v1/courses/';

            let forkJoinQueue = [];
            memberships.forEach(membership => {
                if( membership.availability.available == 'Yes') {
                    forkJoinQueue.push( 
                        this.http.get<BbCourseData>( courseUrl + membership.courseId, { headers: httpHeaders, params: httpParams } )
                    );
                }
            });

            forkJoin(forkJoinQueue)
            .subscribe((courses: BbCourseData[]) => {
                let availableCourses: BbCourseData[] = [];
                courses.forEach(course => {
                    let available = this.isCourseAvailable(course);

                    if( available ) {
                        availableCourses.push(course);
                    }
                });
                console.debug('Available courses:', availableCourses);
                this.writeCourseInfo(availableCourses);
            });
        });
    }

    isCourseAvailable(course: BbCourseData): boolean {
        if(course.availability.available == 'Yes') {
            if(course.availability.duration.type == 'Continuous') {
                return true;
            }
            else if(course.availability.duration.type == 'DateRange') {
                const startDate = new Date( Date.parse( course.availability.duration.start ) );
                const endDate = new Date( Date.parse( course.availability.duration.end ) );
                const now = new Date();

                if( startDate.getTime() < now.getTime() && endDate.getTime() > now.getTime() ) {
                    return true;
                }
                else {
                    return false;
                }
            }
            else if(course.availability.duration.type == 'FixedNumDays') {
                const startDate = new Date( Date.parse( course.created ) );
                let endDate = startDate;
                endDate.setDate( endDate.getDate() + course.availability.duration.daysOfUse );
                const now = new Date();
                if( startDate.getTime() < now.getTime() && endDate.getTime() > now.getTime() ) {
                    return true;
                }
                else {
                    return false;
                }
            }
        }
        else if(course.availability.available == 'Term') {
            // TODO:
            // do term stuff.
            return true;
        }
        else {
            return false;
        }
    }

    async writeCourseInfo(courseInfo: BbCourseData[]) {
        const db = await this.databaseService.get();

        console.debug('CourseListService.writeCourseInfo:');
        console.debug('courseInfo:', courseInfo);

        let courseList: RxCourseDocument[] = [];
        for( let i = 0 ; i < courseInfo.length ; i++ ) {
            try {
                // Remove the '_' in front of the course ID
                // to prevent errors in RxDB.
                courseInfo[i].id = courseInfo[i].id.substr(1);
                const doc = await db.courses.upsert(courseInfo[i]);
                console.debug('Inserted course document.', doc);
                courseList.push(doc);
            }
            catch(err) {
                console.error('Error inserting document.');
                console.error(err);
            }
        }

        this._courseList.next(courseList);
    }

    async readAllCourses() {
        const db = await this.databaseService.get();
        console.debug('CourseListService.readCourseInfo');

        const courses$ = await db.courses.find().$;
        this.courseListSubscription = courses$.subscribe(courseList => this._courseList.next(courseList));
    }

    async readCourse(courseId: string) {
        const db = await this.databaseService.get();
        console.debug('CourseService.readCourse');
        console.debug('Course ID:', courseId);

        const course$ = await db.courses.findOne().where('id').eq(courseId).$;
        this.courseSubscription = course$.subscribe(course => {
            console.debug('Found course:', course);
            this._course.next(course);
        });
   }

   async clearCourse() {
       this._course.next(null);
   }
}