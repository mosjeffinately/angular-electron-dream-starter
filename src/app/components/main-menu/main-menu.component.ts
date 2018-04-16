import { ChangeDetectorRef, Component, Input, NgZone, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { CourseService } from '../../services/course.service';
import { ContentService } from '../../services/content.service';
import { CourseData, CourseContent } from '../../model/model';
import { RxCourseDocument, RxContentDocument } from '../../typings/RxDB';

const Store = window.require('electron-store');
const store = new Store();

@Component({
    selector: 'main-menu',
    templateUrl: './main-menu.component.html'
})
export class MainMenuComponent implements OnInit, OnDestroy {
    isOnline: boolean;
    selectedItem: string;

    courseSubscription: Subscription;
    course: RxCourseDocument;
    contentAreaSubscription: Subscription;
    contentAreas: RxContentDocument[];

    constructor(private zone: NgZone,
                private router: Router,
                private changeDetector: ChangeDetectorRef,
                private courseService: CourseService, 
                private contentService: ContentService) {
        console.debug('menu called');
    }

    ngOnInit() {
        console.log('ngOnInit fired');
        this.activate('courses');

        let userData: any = store.get('bbofflineUserData');
        let url: string = userData.url;
        this.isOnline = userData.isOnline;

        this.courseSubscription = this.courseService.course.subscribe(course => {
            this.course = course;
            if(course) {
                const userData: any = store.get('bbofflineUserData');
                const url: string = userData.url;
                this.isOnline = userData.isOnline;
                this.contentService.getContentAreas(url, this.course.id, this.isOnline);
            }
        });
        this.contentAreaSubscription = this.contentService.contentAreas
            .subscribe(contentAreas => {
                this.contentAreas = contentAreas;
                this.changeDetector.detectChanges();
            });
    }

    ngOnDestroy() {
        this.courseSubscription.unsubscribe();
        this.contentAreaSubscription.unsubscribe();
    }

    activate(selectedItem: string) {
        if( selectedItem == 'courses' || selectedItem == 'announcements' || selectedItem == 'settings') {
            this.courseService.clearCourse();
            this.contentService.clearContentAreas();
        }

        this.selectedItem = selectedItem;
    }

    logout() {
        let userData = store.get('bbofflineUserData');
        userData.isOnline = false;
        store.set('bbofflineUserData', userData);

        this.router.navigate(['/login-oauth']);
        // should clear out tokens too.
    }

    toggleOnlineStatus() {
        this.isOnline = !this.isOnline;
        var userData = store.get('bbofflineUserData');
        userData.isOnline = this.isOnline;
        store.set('bbofflineUserData', userData);
    }
}