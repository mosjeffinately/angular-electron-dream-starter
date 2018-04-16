import { Component, NgZone, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Subscription } from 'rxjs/Subscription';
import { RxCourseDocument } from '../../typings/RxDB';
import { ContentService } from '../../services/content.service';
import { CourseService } from '../../services/course.service';

const Store = window.require('electron-store');
const store = new Store();

@Component({
    selector: 'course-details',
    templateUrl: './course-details.component.html'
})
export class CourseDetailsComponent implements OnInit, OnDestroy {
    id: string;
    subscription: Subscription;
    courseSubscription: Subscription;
    course: RxCourseDocument;

    constructor(private zone: NgZone,
                private router: Router,
                private route: ActivatedRoute,
                private courseService: CourseService,
                private contentService: ContentService) {
    }

    ngOnInit() {
        console.debug('CourseDetailsComponent initialized...');
        this.subscription = this.route.params.subscribe(params => this.id = params['id']);
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}