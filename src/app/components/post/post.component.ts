import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { RxDiscussionPostDocument } from '../../typings/RxDB';
import { PostService } from '../../services/discussion-post-service';

@Component({
    selector: 'post',
    templateUrl: './post.component.html'
})
export class PostComponent implements OnInit, OnDestroy {
    postsSubscription: Subscription;
    postMap: Map<String, RxDiscussionPostDocument[]>;

    @Input() posts: RxDiscussionPostDocument[];
    @Input() depth: number;

    constructor(private postService: PostService) {}

    ngOnInit() {
        this.postsSubscription = this.postService.postMap.subscribe(postMap => this.postMap = postMap);
    }

    ngOnDestroy() {
        this.postsSubscription.unsubscribe();
    }
}