import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { DatabaseService } from './database.service';
import { EmbeddedContentService } from './embedded-content.service';
import { UserService } from './user.service';
import { SystemAnnouncement, SystemAnnouncementResults } from '../model/model';
import { RxSystemAnnouncementDocument, RxUserDocument } from '../typings/RxDB';

@Injectable()
export class SystemAnnouncementsService implements OnDestroy {
    subscription: Subscription;
    userSubscription: Subscription;
    user: RxUserDocument;

    private _announcementList: BehaviorSubject<RxSystemAnnouncementDocument[]> = new BehaviorSubject(null);
    public announcementList: Observable<RxSystemAnnouncementDocument[]> = this._announcementList.asObservable();

    constructor(private http: HttpClient, private databaseService: DatabaseService, private userService: UserService, private embeddedContentService: EmbeddedContentService) {}

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.userSubscription.unsubscribe();
    }

    getAnnouncements(url: string, isOnline: boolean) {
        this.userSubscription = this.userService.user.subscribe((user: RxUserDocument) => this.user = user);

        if( isOnline ) {
            url += '/learn/api/public/v1/announcements';
            const httpHeaders: HttpHeaders = new HttpHeaders().append('Enable-Bb-Bearer-Token', 'true');
            const httpParams: HttpParams = new HttpParams().set('fields', 'id,title,body,availability,created');
    
            this.http.get<SystemAnnouncementResults>(url, {headers: httpHeaders, params: httpParams})
            .subscribe((results: SystemAnnouncementResults) => {
                const announcements: SystemAnnouncement[] = results.results;
                this.writeSystemAnnouncements(announcements);
            });
        }
        else {
            this.readSystemAnnouncements();
        }
    }

    async writeSystemAnnouncements(announcements: SystemAnnouncement[]) {
        const db = await this.databaseService.get();
        console.debug('SystemAnnouncementsService.writeSystemAnnouncements:');
        console.debug('announcements:', announcements);

        let announcementList: RxSystemAnnouncementDocument[] = []
        for( let i = 0 ; i < announcements.length ; i++ ) {
            try {
                // Remove the '_' in front of the course ID
                // to prevent errors in RxDB.
                announcements[i].id = announcements[i].id.substr(1);
                const doc = await db.systemannouncements.upsert(announcements[i]);
                console.debug('Inserted system announcement document.', doc);
                let announcement: RxSystemAnnouncementDocument = await this.embeddedContentService.replaceSystemAnnouncementTemplateVars(this.user, doc);
                announcementList.push(announcement);
            }
            catch(err) {
                console.error('Error inserting document.');
                console.error(err);
            }
        }
        this._announcementList.next(announcementList);
    }

    async readSystemAnnouncements() {
        const db = await this.databaseService.get();
        console.debug('SystemAnnouncementsService.read');

        const announcements$ = await db.systemannouncements.find().$;
        console.debug(announcements$);
        this.subscription = announcements$.subscribe(announcements => this._announcementList.next(announcements));
    }
}