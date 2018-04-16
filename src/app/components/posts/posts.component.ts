import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { RxDiscussionPostDocument, RxUserDocument, RxDiscussionForumDocument, RxDiscussionThreadDocument } from '../../typings/RxDB';
import { PostService } from '../../services/discussion-post-service';
import { UserService } from '../../services/user.service';
import { ForumService } from '../../services/discussion-forum.service';
import { ThreadService } from '../../services/discussion-thread.service';

const Store = window.require('electron-store');
const store = new Store();

@Component({
    selector: 'posts',
    templateUrl: './posts.component.html'
})
export class PostsComponent implements OnInit, OnDestroy {
    userSubscription: Subscription;
    user: RxUserDocument;

    forumSubscription: Subscription;
    forum: RxDiscussionForumDocument;

    threadSubscription: Subscription;
    thread: RxDiscussionThreadDocument;

    topPostSubscription: Subscription;
    topPost: RxDiscussionPostDocument;

    postsSubscription: Subscription;
    postMap: Map<String, RxDiscussionPostDocument[]>;

    constructor(private route: ActivatedRoute,
                private userService: UserService,
                private forumService: ForumService,
                private threadService: ThreadService,
                private postService: PostService) {}

    ngOnInit() {
        this.userSubscription = this.userService.user.subscribe(user => this.user = user);

        this.forumSubscription = this.forumService.forum.subscribe(forum => this.forum = forum);

        this.threadSubscription = this.threadService.thread.subscribe(thread => {
            this.thread = thread;
            console.debug('This.thread', thread);

            let userData: any = store.get('bbofflineUserData');
            let url: string = userData.url;
            let isOnline: boolean = userData.isOnline;

            this.postService.getPosts(url, this.user.id, this.thread.id, isOnline);
        });

        this.topPostSubscription = this.postService.topPost.subscribe(post => this.topPost = post);
        this.postsSubscription = this.postService.postMap.subscribe(postMap => this.postMap = postMap);
    }

    ngOnDestroy() {
        this.userSubscription.unsubscribe();
        this.topPostSubscription.unsubscribe();
        this.postsSubscription.unsubscribe();
        this.forumSubscription.unsubscribe();
        this.threadSubscription.unsubscribe();
    }
}