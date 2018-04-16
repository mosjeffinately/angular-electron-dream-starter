import { Component, EventEmitter, NgZone, OnInit, OnDestroy, Output, Renderer2 } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Params, Router } from "@angular/router";
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseData, CourseContent, ContentAttachments, Attachment } from "../../model/model";
import { RxCourseDocument, RxContentDocument, RxAttachmentDocument, RxAssignmentSubmissionDocument, RxAssignmentDocument, RxUserDocument } from '../../typings/RxDB';
import { Subscription } from 'rxjs/Subscription';
import { CourseService } from '../../services/course.service';
import { ContentService } from '../../services/content.service';
import { AttachmentService } from '../../services/attachment.service';
import { AssignmentService } from '../../services/assignment.service';
import { OpenDialogOptions } from 'electron';
import { TranslateService } from '@ngx-translate/core';
import { NgxAlertsService } from '@ngx-plus/ngx-alerts';
import { UserService } from '../../services/user.service';

const {dialog} = require('electron').remote
console.log(dialog)

const Store = window.require('electron-store');
const store = new Store();

@Component({
    selector: 'assignment',
    templateUrl: './assignment.component.html'
})
export class AssignmentComponent implements OnInit, OnDestroy {
    assignmentForm: FormGroup;
    
    userSubscription: Subscription;
    user: RxUserDocument;

    courseSubscription: Subscription;
    course: RxCourseDocument;
    
    parentContentId: string;
    parentSubscription: Subscription;
    parent: RxContentDocument;

    contentSubscription: Subscription;
    content: RxContentDocument;

    attachmentsSubscription: Subscription;
    attachments: Map<String, RxAttachmentDocument[]>;

    assignmentSubscription: Subscription;
    assignment: RxAssignmentDocument;

    submissionSubscription: Subscription;
    submission: RxAssignmentSubmissionDocument;

    breadcrumbsSubscription: Subscription;
    breadcrumbs: RxContentDocument[];

    Math: any;

    alertSubscription: Subscription;

    constructor(private zone: NgZone, 
                private route: ActivatedRoute, 
                private router: Router, 
                private renderer: Renderer2, 
                private fb: FormBuilder, 
                private translate: TranslateService,
                private ngxAlertsService: NgxAlertsService,
                private userService: UserService,
                private courseService: CourseService, 
                private contentService: ContentService, 
                private attachmentService: AttachmentService,
                private assignmentService: AssignmentService) {
        
        this.Math = Math;
    }

    ngOnInit() {
        this.userSubscription = this.userService.user.subscribe(user => this.user = user);
        this.courseSubscription = this.courseService.course.subscribe(course => this.course = course);
        this.parentSubscription = this.contentService.parent.subscribe(parent => this.parent = parent);
        this.contentSubscription = this.contentService.contentItem.subscribe(content => this.content = content);
        this.attachmentsSubscription = this.attachmentService.attachmentMap.subscribe(attachments => this.attachments = attachments);
        this.assignmentSubscription = this.assignmentService.assignment.subscribe(assignment => this.assignment = assignment);
        this.submissionSubscription = this.assignmentService.assignmentSubmission.subscribe(submission => {
            this.submission = submission
            if(this.submission) {
                this.assignmentForm = this.fb.group({
                    textSubmission: [this.submission.textSubmission],
                    fileAttachment: [this.submission.fileAttachment],
                    comments: [this.submission.comments]
                });
            }
            else {
                this.assignmentForm = this.fb.group({
                    textSubmission: [''],
                    fileAttachment: [''],
                    comments: ['']
                });
            }
        });
        this.breadcrumbsSubscription = this.contentService.breadcrumbs.subscribe(breadcrumbs => this.breadcrumbs = breadcrumbs);
        this.alertSubscription = this.assignmentService.alert.subscribe(alert => {
            if( alert ) {
                if( alert.type == 'success' ) {
                    this.ngxAlertsService.alertSuccess({title: alert.title, text: alert.message});
                }
                else if( alert.type == 'error' ) {
                    this.ngxAlertsService.alertError({title: alert.title, text: alert.message});
                }

                this.assignmentService.clearAlert();
            }
        });

        this.route.params
        .subscribe((params: Params) => {
            this.parentContentId = params['id'];
            console.log('parentContentId:', this.parentContentId);
            this.loadAssignment();
        });
    }

    ngOnDestroy() {
        this.assignmentService.clearAttemptData();
        this.userSubscription.unsubscribe();
        this.courseSubscription.unsubscribe();
        this.parentSubscription.unsubscribe();
        this.contentSubscription.unsubscribe();
        this.attachmentsSubscription.unsubscribe();
        this.assignmentSubscription.unsubscribe();
        this.submissionSubscription.unsubscribe();
        this.breadcrumbsSubscription.unsubscribe();
        this.alertSubscription.unsubscribe();
    }

    submitAssignment(assignmentForm: FormGroup) {
        let userData = store.get('bbofflineUserData');
        let url: string = userData.url;
        let isOnline: boolean = userData.isOnline;

        let fileAttachment: string = '';
        if( assignmentForm.get('fileAttachment').value ) {
            fileAttachment = assignmentForm.get('fileAttachment').value[0];
        }

        console.debug('Submitting assignment.');
        this.assignmentService.submitAssignment(url, this.user.id, this.course.id, this.assignment, assignmentForm.get('textSubmission').value, assignmentForm.get('comments').value, fileAttachment, isOnline);
    }

    async saveAssignment(assignmentForm: FormGroup) {
        let fileAttachment: string = '';
        if( assignmentForm.get('fileAttachment').value ) {
            fileAttachment = assignmentForm.get('fileAttachment').value[0];
        }
        await this.assignmentService.writeAssignmentSubmission( this.assignment, assignmentForm.get('textSubmission').value, assignmentForm.get('comments').value, fileAttachment, 0 );
    }

    cancelAssignment() {
        let parent = null;
        try {
            parent = this.breadcrumbs[this.breadcrumbs.length - 2];
        }
        catch(error) {
            parent = this.breadcrumbs[0];
        }

        console.debug('Parent:', parent);
        this.router.navigate(['../../course-contents', parent.id], {relativeTo: this.route});
    }

    fileUpload() {
        const options: OpenDialogOptions = {
            title: "Select File to Attach",
            properties: [
                'openFile'
            ]
        }
        dialog.showOpenDialog(options, (filename) => {
            console.debug('Filename: ' + filename);
            this.assignmentForm.patchValue({ fileAttachment: filename });
        });
    }

    async loadAssignment() {
        let userData = store.get('bbofflineUserData');
        let url: string = userData.url;
        let isOnline: boolean = userData.isOnline;

        await this.contentService.getContentItem(this.parentContentId);
        await this.assignmentService.getAssignmentDetails(url, this.course.id, this.parentContentId, isOnline);
        await this.contentService.getBreadcrumbs(this.content);
        await this.assignmentService.readAssignmentSubmission(this.parentContentId);
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