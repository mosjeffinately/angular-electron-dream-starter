import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { RxDiscussionBoardDocument, RxCourseDocument } from '../../typings/RxDB';
import { DiscussionService } from '../../services/discussion-board.service';
import { CourseService } from '../../services/course.service';

const Store = window.require('electron-store');
const store = new Store();

@Component({
    selector: 'discussions',
    templateUrl: './discussions.component.html'
})
export class DiscussionsComponent implements OnInit {
    courseSubscription: Subscription;
    course: RxCourseDocument;

    discussionSubscription: Subscription;
    discussions: RxDiscussionBoardDocument[];

    constructor(private route: ActivatedRoute, 
                private router: Router, 
                private discussionService: DiscussionService,
                private courseService: CourseService) {}

    ngOnInit() {
        this.courseSubscription = this.courseService.course.subscribe(course => {
            this.course = course;

            let userData: any = store.get('bbofflineUserData');
            let url: string = userData.url;
            let isOnline: boolean = userData.isOnline;
    
            this.discussionSubscription = this.discussionService.discussionBoards
                .subscribe(discussions => this.discussions = discussions);
            this.discussionService.getDiscussionBoards(url, this.course.id, isOnline);
        });
    }

    ngOnDestroy() {
        this.courseSubscription.unsubscribe();
        this.discussionSubscription.unsubscribe();
    }

    async loadDiscussion(id: string) {
        this.discussionService.getDiscussionBoard(id);
    }
}