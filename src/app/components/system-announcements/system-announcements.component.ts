import { ChangeDetectorRef, Component, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { RxSystemAnnouncementDocument } from '../../typings/RxDB';
import { SystemAnnouncementsService } from '../../services/system-announcements.service';

const Store = window.require('electron-store');
const store = new Store();

@Component({
    selector: 'system-announcements',
    templateUrl: './system-announcements.component.html'
})
export class SystemAnnouncementsComponent implements OnInit {
    announcementSubscription: Subscription
    announcementList: RxSystemAnnouncementDocument[];

    constructor(private systemAnnouncementsService: SystemAnnouncementsService,
                private changeDetector: ChangeDetectorRef) {}

    ngOnInit() {
        let userData = store.get('bbofflineUserData');
        let url = userData.url;
        let isOnline = userData.isOnline;

        this.announcementSubscription = this.systemAnnouncementsService.announcementList.subscribe(announcementList => {
            this.announcementList = announcementList;
            this.changeDetector.detectChanges();
        });
        this.systemAnnouncementsService.getAnnouncements(url, isOnline);
    }

    ngOnDestroy() {
        this.announcementSubscription.unsubscribe();
    }
}