import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { RxForumLinkDocument } from '../../typings/RxDB';
import { ForumLinkService } from '../../services/forum-link.service';

const Store = window.require('electron-store');
const store = new Store();

@Component({
    selector: 'forum-link',
    template: `<div class="row justify-content-center">
                    <i class="fa fa-spinner fa-pulse fa-3x fa-fw"></i>
                    <span class="sr-only">Loading...</span>
                </div>`
              
})
export class ForumLinkComponent implements OnInit, OnDestroy {
    contentId: string;

    subscription: Subscription;
    forumLink: RxForumLinkDocument;

    constructor(private route: ActivatedRoute,
                private router: Router,
                private forumLinkService: ForumLinkService) {}

    ngOnInit() {
        this.route.params.subscribe(params => {
            let userData = store.get('bbofflineUserData');
            let url = userData.url;
            let isOnline = userData.isOnline;
    
            this.contentId = params['id'];

            this.subscription = this.forumLinkService.forumLink.subscribe(forumLink => {
                this.forumLink = forumLink;
                if( this.forumLink ) {
                    this.router.navigate(['../../threads', this.forumLink.id, this.forumLink.title], {relativeTo: this.route});
                }
            });
            this.forumLinkService.getForumLink(url, this.contentId, isOnline);
        });
    }

    ngOnDestroy() {
        this.forumLinkService.clearForumLink();
        this.subscription.unsubscribe();
    }
}