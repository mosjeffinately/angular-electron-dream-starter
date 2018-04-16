import { ChangeDetectorRef, Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { CourseAnnouncement } from '../../model/model';
import { CourseAnnouncementService } from '../../services/course-announcements.service';
import { Subscription } from 'rxjs/Subscription';
import { RxCourseAnnouncementDocument, RxCourseDocument } from '../../typings/RxDB';
import { CourseService } from '../../services/course.service';

const Store = window.require('electron-store');
const store = new Store();

@Component({
    selector: 'course-announcements',
    templateUrl: './course-announcements.component.html'
})
export class CourseAnnouncementsComponent implements OnInit {
    
    announcementSubscription: Subscription;
    announcements: RxCourseAnnouncementDocument[];

    courseSubscription: Subscription;
    course: RxCourseDocument;

    constructor(private route: ActivatedRoute,
                private changeDetector: ChangeDetectorRef,
                private courseService: CourseService,
                private courseAnnouncementsService: CourseAnnouncementService) {}

    ngOnInit() {
        this.courseSubscription = this.courseService.course.subscribe(course => {
            if( course != null ) {
                this.course = course;

                let userData: any = store.get('bbofflineUserData');
                let url: string = userData.url;
                let isOnline: boolean = userData.isOnline;
    
                this.courseAnnouncementsService.getCourseAnnouncements(url, this.course.id, isOnline);
            }
        });

        this.announcementSubscription = this.courseAnnouncementsService.announcementList.subscribe(announcements => {
            this.announcements = announcements;
            this.changeDetector.detectChanges();
        });
    }

    ngOnDestroy() {
        this.announcementSubscription.unsubscribe();
    }
}