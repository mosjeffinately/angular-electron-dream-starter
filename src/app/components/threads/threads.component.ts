import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { SystemAnnouncement, CourseAnnouncement } from '../../model/model';
import { CourseAnnouncementService } from '../../services/course-announcements.service';
import { Subscription } from 'rxjs/Subscription';
import { RxUserDocument, RxDiscussionThreadDocument, RxDiscussionForumDocument } from '../../typings/RxDB';
import { UserService } from '../../services/user.service';
import { ThreadService } from '../../services/discussion-thread.service';
import { ForumService } from '../../services/discussion-forum.service';

const Store = window.require('electron-store');
const store = new Store();

@Component({
    selector: 'threads',
    templateUrl: './threads.component.html'
})
export class ThreadsComponent implements OnInit {
    userSubscription: Subscription;
    user: RxUserDocument;

    forumSubscription: Subscription;
    forum: RxDiscussionForumDocument;

    threadsSubscription: Subscription;
    threads: RxDiscussionThreadDocument[];

    constructor(private route: ActivatedRoute,
                private userService: UserService,
                private forumService: ForumService,
                private threadService: ThreadService) {}

    ngOnInit() {
        this.userSubscription = this.userService.user.subscribe(user => this.user = user);

        this.forumSubscription = this.forumService.forum.subscribe(forum => {
            this.forum = forum;

            let userData: any = store.get('bbofflineUserData');
            let url: string = userData.url;
            let isOnline: boolean = userData.isOnline;

            this.threadService.getThreads(url, this.user.id, this.forum.id, isOnline);
        });

        this.threadsSubscription = this.threadService.threads.subscribe(threads => this.threads = threads);
    }

    ngOnDestroy() {
        this.threadsSubscription.unsubscribe();
        this.userSubscription.unsubscribe();
        this.forumSubscription.unsubscribe();
    }

    loadThread(id: string) {
        console.debug('Getting thread: ', id);
        this.threadService.getThread(id);
    }
}