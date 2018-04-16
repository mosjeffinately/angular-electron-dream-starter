import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { RxDiscussionForumDocument, RxUserDocument, RxDiscussionBoardDocument } from '../../typings/RxDB';
import { ForumService } from '../../services/discussion-forum.service';
import { UserService } from '../../services/user.service';
import { DiscussionService } from '../../services/discussion-board.service';

const Store = window.require('electron-store');
const store = new Store();

@Component({
    selector: 'forums',
    templateUrl: './forums.component.html'
})
export class ForumsComponent implements OnInit, OnDestroy {

    userSubscription: Subscription;
    user: RxUserDocument;

    discussionSubscription: Subscription;
    discussion: RxDiscussionBoardDocument;

    forumSubscription: Subscription;
    forums: RxDiscussionForumDocument[];

    constructor(private route: ActivatedRoute,
                private userService: UserService,
                private discussionService: DiscussionService,
                private forumService: ForumService) {}

    ngOnInit() {
        this.userSubscription = this.userService.user.subscribe(user => this.user = user);
        
        this.discussionSubscription = this.discussionService.discussionBoard
        .subscribe(discussion => {
            this.discussion = discussion;

            let userData: any = store.get('bbofflineUserData');
            let url: string = userData.url;
            let isOnline: boolean = userData.isOnline;

            this.forumService.getForums(url, this.user.id, this.discussion.id, isOnline);
        });

        this.forumSubscription = this.forumService.forums.subscribe(forums => this.forums = forums);
    }

    ngOnDestroy() {
        this.forumSubscription.unsubscribe();
        this.userSubscription.unsubscribe();
    }

    loadForum(id: string) {
        this.forumService.getForum(id);
    }
}