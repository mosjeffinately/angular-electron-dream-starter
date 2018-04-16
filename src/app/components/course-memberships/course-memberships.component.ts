import { Component, Input, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { UserService } from '../../services/user.service';
import { CourseData, UserData } from '../../model/model';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { RxUserDocument, RxCourseDocument } from '../../typings/RxDB';
import { ContentService } from '../../services/content.service';

const Store = window.require('electron-store');
const store = new Store();

@Component({
    selector: 'course-memberships',
    templateUrl: './course-memberships.component.html'
})
export class CourseMembershipsComponent implements OnInit, OnDestroy {
    userSubscription: Subscription;
    user: RxUserDocument;
    courseListSubscription: Subscription;
    courseList: RxCourseDocument[];
    courseSubscription: Subscription;
    course: RxCourseDocument;

    constructor(private zone: NgZone,
                private route: ActivatedRoute,
                private router: Router,
                private userService: UserService,
                private courseService: CourseService,
                private contentService: ContentService) {}

    ngOnInit() {
        console.debug('Course Memberships OnInit...');
        this.userSubscription = this.userService.user.subscribe(user => this.user = user);
        this.courseListSubscription = this.courseService.courseList.subscribe(courseList => this.courseList = courseList);
        this.courseSubscription = this.courseService.course.subscribe(course => this.course = course);

        const userData: any = store.get('bbofflineUserData');
        const url: string = userData.url;
        const username: string = userData.username;
        const isOnline: boolean = userData.isOnline;
        this.courseService.getCourses(url, username, isOnline);
    }

    ngOnDestroy() {
        this.userSubscription.unsubscribe();
        this.courseListSubscription.unsubscribe();
        this.courseSubscription.unsubscribe();
    }

    async loadCourse(courseId: string) {
        let userData: any = store.get('bbofflineUserData');
        let url: string = userData.url;
        let isOnline: boolean = userData.isOnline;

        this.courseService.getCourse(url, courseId, isOnline);
        this.contentService.getContentAreas(url, courseId, isOnline);
    }
}