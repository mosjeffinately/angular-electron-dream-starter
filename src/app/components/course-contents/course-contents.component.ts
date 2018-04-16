import { Component, NgZone, OnInit, OnDestroy, Renderer2 } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Params, Router } from "@angular/router";
import { CourseData, CourseContent, ContentAttachments, Attachment } from "../../model/model";
import { RxCourseDocument, RxContentDocument, RxAttachmentDocument } from '../../typings/RxDB';
import { Subscription } from 'rxjs/Subscription';
import { CourseService } from '../../services/course.service';
import { ContentService } from '../../services/content.service';
import { AttachmentService } from '../../services/attachment.service';

const remote = window.require('electron').remote;
const app = remote.app;

const Store = window.require('electron-store');
const store = new Store();

const fs = window.require('fs');

@Component({
    selector: 'contents',
    templateUrl: './course-contents.component.html'
})
export class CourseContentsComponent implements OnInit, OnDestroy {
    id: string;
    
    courseSubscription: Subscription;
    course: RxCourseDocument;
    
    parentContentId: string;
    parentSubscription: Subscription;
    parent: RxContentDocument;

    contentSubscription: Subscription;
    content: RxContentDocument[];

    attachmentsSubscription: Subscription;
    attachments: Map<String, RxAttachmentDocument[]>;

    breadcrumbsSubscription: Subscription;
    breadcrumbs: RxContentDocument[];

    Math: any;

    constructor(private zone: NgZone, 
                private route: ActivatedRoute, 
                private router: Router, 
                private renderer: Renderer2, 
                private courseService: CourseService, 
                private contentService: ContentService, 
                private attachmentService: AttachmentService) {
        window['angularComponentRef'] = {component: this, zone: zone};
        this.Math = Math;
    }

    ngOnInit() {
        this.courseSubscription = this.courseService.course.subscribe(course => this.course = course);
        this.parentSubscription = this.contentService.parent.subscribe(parent => this.parent = parent);
        this.contentSubscription = this.contentService.content.subscribe(content => this.content = content);
        this.attachmentsSubscription = this.attachmentService.attachmentMap.subscribe(attachments => this.attachments = attachments);
        this.breadcrumbsSubscription = this.contentService.breadcrumbs.subscribe(breadcrumbs => this.breadcrumbs = breadcrumbs);

        this.route.params
        .subscribe((params: Params) => {
            this.parentContentId = params['id'];
            console.log('parentContentId:', this.parentContentId);
            this.loadChildren();
        });
    }

    ngOnDestroy() {
        // this.contentService.clearContents();
        this.courseSubscription.unsubscribe();
        this.parentSubscription.unsubscribe();
        this.contentSubscription.unsubscribe();
        this.attachmentsSubscription.unsubscribe();
        this.breadcrumbsSubscription.unsubscribe();
    }

    async loadChildren() {
        let userData: any = store.get('bbofflineUserData');
        let url: string = userData.url;
        let isOnline: boolean = userData.isOnline;

        await this.contentService.getParentContent(this.parentContentId);
        await this.contentService.clearContents();
        console.debug('Parent Content Id:', this.parentContentId);
        // await this.contentService.getContentArea(url, this.parentContentId);
        console.debug('Parent Content:', this.parent);
        await this.contentService.getContent(url, this.course, this.parent, isOnline);
    }

    hasAttachment(attachment: RxAttachmentDocument): boolean {
        return this.attachmentService.hasAttachment(attachment);
    }

    async downloadAttachment(attachment: RxAttachmentDocument) {
        if( attachment.id.startsWith( 'scorm' ) ) {
            await this.attachmentService.downloadSCORM(this.course.id, attachment);
        }
        else {
            await this.attachmentService.downloadFile(this.course.id, attachment);
        }
        this.zone.run(() => this.hasAttachment(attachment));
    }

    isDownloading(attachment: RxAttachmentDocument): boolean {
        return this.attachmentService.inDownloadQueue(attachment);
    }

    openAttachment(attachment: RxAttachmentDocument) {
        this.attachmentService.openAttachment(attachment);
    }

    deleteAttachment(attachment: RxAttachmentDocument) {
        this.attachmentService.deleteAttachment(attachment);
    }

    showLink(contentHandlerId: string) {
        if( contentHandlerId == 'resource/x-bb-folder' ||
            contentHandlerId == 'resource/x-bb-assignment' ||
            contentHandlerId == 'resource/x-bb-forumlink') {
            
            return true;
        }
        else {
            return false;
        }
    }

    getIconClass(contentHandlerId: string) {

        if( contentHandlerId == 'resource/x-bb-asmt-test-link' ) {
            return 'fa fa-lg fa-fw fa-file-text mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-assignment' ) {
            return 'fa fa-lg fa-fw fa-edit mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-document' ) {
            return 'fa fa-lg fa-fw fa-file-text mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-folder' ) {
            return 'fa fa-lg fa-fw fa-folder-o mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-forumlink' ) {
            return 'fa fa-lg fa-fw fa-commenting-o mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-lesson' ) {
            return 'fa fa-lg fa-fw fa-pencil-square mt-4';
        }
        else if( contentHandlerId == 'resource/x-plugin-scormengine' ) {
            return 'fa fa-lg fa-fw fa-file-archive-o mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-file' ) {
            return 'fa fa-lg fa-fw fa-file-o mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-audio' ) {
            return 'fa fa-lg fa-fw fa-file-audio-o mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-image' ) {
            return 'fa fa-lg fa-fw fa-file-image-o mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-externallink' ) {
            return 'fa fa-lg fa-fw fa-external-link mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-lessonplan' ) {
            return 'fa fa-lg fa-fw fa-table mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-grouplink' ) {
            return 'fa fa-lg fa-fw fa-group mt-4';
        }
        else if( contentHandlerId == 'resource/x-bbpi-selfpeer-type1' ) {
            return 'fa fa-lg fa-fw fa-th mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-asmt-survey-link' ) {
            return 'fa fa-lg fa-fw fa-pencil-square mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-toollink' ) {
            return 'fa fa-lg fa-fw fa-wrench mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-module-page' ) {
            return 'fa fa-lg fa-fw fa-book mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-courselink' ) {
            return 'fa fa-lg fa-fw fa-clone mt-4';
        }
        else if( contentHandlerId == 'resource/x-bb-syllabus' ) {
            return 'fa fa-lg fa-fw fa-columns mt-4';
        }
        else {
            return 'fa fa-lg fa-fw fa-file-text-o mt-4';
        }

    }
    
    bytesToSize(bytes: number): string {
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        if (bytes == 0) return 'n/a';
        var i = parseInt(this.Math.floor(this.Math.log(bytes) / this.Math.log(1024)));
        if (i == 0) return bytes + ' ' + sizes[i];
        return (bytes / Math.pow(1024, i)).toFixed(1) + ' ' + sizes[i];
    }
}