import { Component, Input, NgZone, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { CourseService } from '../../services/course.service';
import { ContentService } from '../../services/content.service';
import { CourseData, CourseContent } from '../../model/model';
import { RxCourseDocument, RxContentDocument } from '../../typings/RxDB';
import { Subscription } from 'rxjs/Subscription';

const Store = window.require('electron-store');
const store = new Store();

@Component({
    selector: 'course-menu',
    templateUrl: './course-menu.component.html'
})
export class CourseMenuComponent implements OnInit, OnDestroy {
    isOnline: boolean;
    selectedItem: string = '';
    @Input() courseId: string = '';
    courseSubscription: Subscription;
    course: RxCourseDocument;
    contentAreaSubscription: Subscription;
    contentAreas: RxContentDocument[];

    constructor(private zone: NgZone, private route: ActivatedRoute, private router: Router, private courseService: CourseService, private contentService: ContentService) {
        window['angularComponentRef'] = {component: this, zone: zone};
    }

    ngOnInit() {
        this.courseSubscription = this.courseService.course.subscribe(course => this.course = course);
        this.contentAreaSubscription = this.contentService.contentAreas.subscribe(contentAreas => this.contentAreas = contentAreas);

        let userData: any = store.get('bbofflineUserData');
        let url: string = userData.url;
        this.isOnline = userData.isOnline;

        this.contentService.getContentAreas(url, this.courseId, this.isOnline);
    }

    ngOnDestroy() {
        this.courseSubscription.unsubscribe();
        this.contentAreaSubscription.unsubscribe();
    }

    activate(selectedItem: string) {
        this.selectedItem = selectedItem;
    }

    toggleOnlineStatus() {
        this.isOnline = !this.isOnline;
        var userData = store.get('bbofflineUserData');
        userData.isOnline = this.isOnline;
        store.set('bbofflineUserData', userData);
    }
}