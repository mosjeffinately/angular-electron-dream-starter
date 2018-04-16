import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { Attachment, Version } from '../model/model';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { RxAttachmentCreator } from 'rxdb';
import { RxCourseDocument, RxAttachmentDocument, RxUserDocument } from '../typings/RxDB';
import { DatabaseService } from './database.service';
import { UserService } from './user.service';
import { LoginService } from './login.service';
import { SystemService } from './system.service';

const remote = window.require('electron').remote;
const app = remote.app;
const { shell } = require('electron');

const Store = window.require('electron-store');
const store = new Store();

const fs = window.require('fs');

@Injectable()
export class AttachmentService implements OnDestroy {
    userSubscription: Subscription;
    user: RxUserDocument;
    
    attachmentSubscription: Subscription;

    versionSubscription: Subscription;
    version: Version;

    downloadQueue: Map<String, RxAttachmentDocument> = new Map();

    private _attachmentMap: BehaviorSubject<Map<String, RxAttachmentDocument[]>> = new BehaviorSubject(new Map());
    public attachmentMap: Observable<Map<String, RxAttachmentDocument[]>> = this._attachmentMap.asObservable();

    constructor(private http: HttpClient, 
                private databaseService: DatabaseService, 
                private loginService: LoginService,
                private systemService: SystemService,
                private userService: UserService) {
        this.userSubscription = this.userService.user.subscribe(user => this.user = user);
        this.versionSubscription = this.systemService.version.subscribe(version => this.version = version);
    }

    ngOnDestroy() {
        this.userSubscription.unsubscribe();
        this.attachmentSubscription.unsubscribe();
    }

    getAttachments(url: string, courseId: string, contentId: string, isOnline: boolean) {

        if( isOnline ) {
            this.getRestAttachments(url, courseId, contentId);
        }
        else {
            this.readAttachments(contentId);
        }
    }

    getRestAttachments(url: string, courseId: string, contentId: string) {
        url = url + '/webapps/bbgs-bboffline-BBLEARN/app/api/courses/_' + courseId + '/contents/_' + contentId + '/attachments';
        
        this.http.get<Attachment[]>(url)
        .subscribe((attachments: Attachment[]) => {
            console.debug('Attachments: ', attachments);
            this.writeAttachments(contentId, attachments);
        });
    }

    async writeAttachments(contentId: string, attachments: Attachment[]) {
        const db = await this.databaseService.get();

        console.debug('AttachmentService.writeAttachments:');
        console.debug('attachments:', attachments);

        let attachmentList: RxAttachmentDocument[] = [];
        for( let i = 0 ; i < attachments.length ; i++ ) {
            if(!attachments[i].id.startsWith('scorm')) {
                attachments[i].id = attachments[i].id.substr(1);
            }
            attachments[i].contentId = attachments[i].contentId.substr(1);
            const doc = await db.attachments.upsert(attachments[i]);
            console.debug('Inserted attachment.', doc);
            attachmentList.push(doc);
        }
        // overwrite the existing attachments, if there.
        let attachmentMap = this._attachmentMap.getValue().set(contentId, attachmentList);
        this._attachmentMap.next(attachmentMap);
    }

    async readAttachments(contentId: string) {
        const db = await this.databaseService.get();

        console.debug('AttachmentService.readAttachments:');
        console.debug('contentId: ', contentId);

        const attachments$ = await db.attachments.find().where('contentId').eq(contentId).sort('filename').$;
        this.attachmentSubscription = attachments$.subscribe(attachments => {
            console.debug('Found attachments:', attachments);
            let attachmentMap = this._attachmentMap.getValue().set(contentId, attachments);
            this._attachmentMap.next(attachmentMap);
        });
    }

    async downloadFile(courseId: string, attachment: RxAttachmentDocument) {
        this.addToDownloadQueue(attachment);

        let userData: any = store.get('bbofflineUserData');
        let url: string = userData.url;
        let isOnline: boolean = userData.isOnline;

        if( !isOnline ) {
            alert('You must be online to download content.');
            this.removeFromDownloadQueue(attachment);
            return;
        }

        let percentageDownloaded = 0;
        let bytesDownloaded = 0;

        let headers: HttpHeaders = new HttpHeaders();

        if(this.version && this.version.learn.major > 3200) {
            url += '/learn/api/public/v1/courses/_' + courseId + 
                '/contents/_' + attachment.contentId + '/attachments/_' + attachment.id + '/download'
            headers = headers.append('Enable-Bb-Bearer-Token', 'true');
        }
        else {
            url += '/webapps/bbgs-bboffline-BBLEARN/app/api/courses/_' + courseId + '/contents/_' + attachment.contentId +
            '/attachments/_' + attachment.id + '/download';
            headers = headers.append('Authorization', 'Basic ' + btoa(this.user.userName + ':' + this.user.get('password')));
        }

        let request = new HttpRequest('GET', url, {
            headers: headers,
            responseType: 'blob',
            reportProgress: true
        });

        this.http.request(request).subscribe((event: HttpEvent<any>) => {
            switch(event.type) {
                case HttpEventType.DownloadProgress:
                    bytesDownloaded += event.loaded;
                    percentageDownloaded = Math.round( (bytesDownloaded/event.total) * 100 );
                    console.debug(percentageDownloaded + '% downloaded.');
                    break;
                case HttpEventType.Response:
                    console.debug(bytesDownloaded + ' bytes downloaded.');
                    this.saveAttachment(event.body, attachment);
            }
        });
    }

    async downloadSCORM(courseId: string, attachment: RxAttachmentDocument) {
        this.addToDownloadQueue(attachment);

        let userData: any = store.get('bbofflineUserData');
        let url: string = userData.url;
        let isOnline: boolean = userData.isOnline;

        if( !isOnline ) {
            alert('You must be online to download content.');
            this.removeFromDownloadQueue(attachment);
            return;
        }

        let percentageDownloaded = 0;
        let bytesDownloaded = 0;

        let headers: HttpHeaders = new HttpHeaders({'Authorization': 'Basic ' + btoa(this.user.userName + ':' + this.user.get('password'))});
        url += '/webapps/bbgs-bboffline-BBLEARN/app/api/courses/_' + courseId + '/contents/_' + attachment.contentId +
               '/scorm/download';

        let request = new HttpRequest('GET', url, {
            headers: headers,
            responseType: 'blob',
            reportProgress: true
        });

        this.http.request(request).subscribe((event: HttpEvent<any>) => {
            switch(event.type) {
                case HttpEventType.DownloadProgress:
                    bytesDownloaded += event.loaded;
                    percentageDownloaded = Math.round( (bytesDownloaded/event.total) * 100 );
                    console.debug(percentageDownloaded + '% downloaded.');
                    break;
                case HttpEventType.Response:
                    console.debug(bytesDownloaded + ' bytes downloaded.');
                    this.saveAttachment(event.body, attachment);
            }
        });
    }

    saveAttachment(blob: Blob, attachment: RxAttachmentDocument): void {

        let reader: FileReader = new FileReader();

        let contentDir = app.getPath('appData') + '/bb/files';
        if( !fs.existsSync(contentDir) ) {
            fs.mkdirSync(contentDir);
        }
        
        let xythosId = attachment.fileId.replace('/', '');

        let fileDir = contentDir + '/' + xythosId;
        if( !fs.existsSync(fileDir) ) {
            fs.mkdirSync(fileDir);
        }

        let fullPath = fileDir + '/' + attachment.filename;
        if( fs.existsSync(fullPath) ) {
            console.debug('Skipping writing', attachment.filename, '.  File already exists.');
            return;
        }

        reader.onload = () => {
            if( reader.readyState == 2 ) {
                let buffer: Buffer = new Buffer(reader.result);
                fs.writeFileSync(fullPath, buffer);
                this.removeFromDownloadQueue(attachment);
            }
        }
        reader.readAsArrayBuffer(blob);
    }

    hasAttachment(attachment: RxAttachmentDocument): boolean {
        let path = app.getPath('appData') + '/bb/files' + attachment.fileId + '/' + attachment.filename;
        if( fs.existsSync(path) ) {
            return true;
        }
        else {
            return false;
        }
    }

    openAttachment(attachment: RxAttachmentDocument) {
        let path = app.getPath('appData') + '/bb/files' + attachment.fileId + '/' + attachment.filename;
        if( fs.existsSync(path) ) {
            shell.openItem(path);
        }
        else {
            shell.beep();
            alert("File does not exist locally!");
        }
    }

    deleteAttachment(attachment: RxAttachmentDocument): void {
        let path = app.getPath('appData') + '/bb/files' + attachment.fileId + '/' + attachment.filename;
        if( fs.existsSync(path) ) {
            fs.unlinkSync(path);
        }
    }

    addToDownloadQueue(attachment: RxAttachmentDocument) {
        this.downloadQueue.set(attachment.id, attachment);
    }

    removeFromDownloadQueue(attachment: RxAttachmentDocument) {
        this.downloadQueue.delete(attachment.id);
    }

    inDownloadQueue(attachment: RxAttachmentDocument) {
        return this.downloadQueue.has(attachment.id);
    }
}