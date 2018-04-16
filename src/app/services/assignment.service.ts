import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { RxAttachmentCreator } from 'rxdb';
import { RxCourseDocument, RxAttachmentDocument, RxUserDocument, RxAssignmentDocument, RxAssignmentSubmissionDocument, RxContentDocument } from '../typings/RxDB';
import { DatabaseService } from './database.service';
import { UserService } from './user.service';
import { CourseService } from './course.service';
import { ContentService } from './content.service';
import { Assignment } from '../model/model';
import { TranslateService } from '@ngx-translate/core';

const Store = window.require('electron-store');
const store = new Store();

const fs = require('fs');
const mime = require('mime-types');

@Injectable()
export class AssignmentService implements OnDestroy {
    assignmentSubscription: Subscription;
    assignmentSubmissionSubscription: Subscription;

    private _assignment: BehaviorSubject<RxAssignmentDocument> = new BehaviorSubject(null);
    public assignment: Observable<RxAssignmentDocument> = this._assignment.asObservable();

    private _assignmentSubmission: BehaviorSubject<RxAssignmentSubmissionDocument> = new BehaviorSubject(null);
    public assignmentSubmission: Observable<RxAssignmentSubmissionDocument> = this._assignmentSubmission.asObservable();

    private _alert: BehaviorSubject<any> = new BehaviorSubject(null);
    public alert: Observable<any> = this._alert.asObservable();

    // private _notification: BehaviorSubject<any> = new BehaviorSubject(null);
    // public notification: Observable<any> = this._notification.asObservable();

    constructor(private http: HttpClient, 
                private databaseService: DatabaseService,
                private translate: TranslateService) {}

    ngOnDestroy() {
        this.assignmentSubscription.unsubscribe();
        this.assignmentSubmissionSubscription.unsubscribe();
    }

    async getAssignmentDetails(url: string, courseId: string, contentId: string, isOnline: boolean) {
        if( isOnline ) {
            this.getRestAssignmentDetails(url, courseId, contentId);
        }
        else {
            this.readAssignment(contentId);
        }
    }

    async getRestAssignmentDetails(url, courseId: string, contentId: string) {
        url = url + '/webapps/bbgs-bboffline-BBLEARN/app/api/courses/_' + courseId + '/contents/_' + contentId + '/assignments';
        this.http.get<Assignment>(url)
        .subscribe((assignment: Assignment) => {
            console.debug('Retrieved assignment: ', assignment);
            this.writeAssignment(assignment);
        });
    }

    async readAssignment(contentId: string) {
        const db = await this.databaseService.get();
        let assignment$ = db.assignments.findOne().where('id').eq(contentId).$;
        this.assignmentSubscription = assignment$.subscribe(assignment => this._assignment.next(assignment));
    }

    async writeAssignment(assignment: Assignment) {
        const db = await this.databaseService.get();

        console.debug('AssignmentService: writing assignment:', assignment);
        assignment.id = assignment.id.substr(1);
        const doc = await db.assignments.upsert(assignment);
        console.debug('Successfully inserted assignment');
        this._assignment.next(doc);
    }

    async readAssignmentSubmission(assignmentId: string) {
        if(!assignmentId) {
            this._assignmentSubmission.next(null);
            return;
        }

        const db = await this.databaseService.get();

        console.debug('AssignmentService: reading submission:', assignmentId);
        const submission$ = await db.assignmentsubmissions
            .findOne()
            .where('id').eq(assignmentId)
            .$;

        this.assignmentSubmissionSubscription = submission$.subscribe(submission => {
            console.debug('AssignmentService: found saved submission:', submission);
            this._assignmentSubmission.next(submission)
        });
    }

    async writeAssignmentSubmission(assignment: RxAssignmentDocument, textSubmission: string, comments: string, fileAttachment: string, submissionStatus: number) {
        // this.translate.get(['saving_title', 'assignment_saving_lbl'])
        // .subscribe(messages => {
        //     this._notification.next({
        //         title: messages.saving_title,
        //         message: messages.assignment_saving_lbl,
        //         type: 'success'
        //     });
        // });

        const db = await this.databaseService.get();

        console.debug('AssignmentService: writing submission:', assignment);
        
        let submission = {
            id: assignment.id,
            textSubmission: textSubmission,
            fileAttachment: fileAttachment,
            comments: comments,
            submissionStatus: submissionStatus
        }
        const doc = await db.assignmentsubmissions.upsert(submission)
        .then(doc => {
            console.debug('Successfully saved submission:', doc);

            this.translate.get(['success_title', 'assignment_saved_lbl'])
            .subscribe(messages => {
                this._alert.next({
                    title: messages.success_title,
                    message: messages.assignment_saved_lbl,
                    type: 'success'
                });
            });
        })
        .catch(err => {
            this.translate.get(['error_title', 'assignment_error_save_message'])
            .subscribe(messages => {
                this._alert.next({
                    title: messages.error_title,
                    message: messages.assignment_error_save_message + ': ' + err.message,
                    type: 'error'
                });

                return;
            });
        });
        
        // if(fileAttachment) {
        //     const filename = fileAttachment.substr(fileAttachment.lastIndexOf('/') + 1);
        //     console.debug('Filename: ', filename);
            

        //     fs.readFile(fileAttachment, (err, data) => {
        //         console.debug('File data: ', data);
        //         if( err ) {
        //             this.translate.get(['error_title', 'assignment_error_file_message'])
        //             .subscribe(messages => {
        //                 this._alert.next({
        //                     title: messages.error_title,
        //                     message: messages.assignment_error_file_message + ': ' + err.message,
        //                     type: 'error'
        //                 });
        //             });
        //         }
        //         else {
        //             let type = mime.lookup(fileAttachment);
        //             console.log(type);
        //             if( !type ) {
        //                 type = 'application/octet-stream';
        //             }
        //             const attachment = {
        //                 id: filename,
        //                 body: data,
        //                 type: type
        //             }

        //             doc.putAttachment(attachment)
        //             .then(() => {                        
        //                 this.translate.get(['success_title', 'assignment_saved_lbl'])
        //                 .subscribe(messages => {
        //                     this._alert.next({
        //                         title: messages.success_title,
        //                         message: messages.assignment_saved_lbl,
        //                         type: 'success'
        //                     });
        //                 });
        //             })
        //             .catch(err => {
        //                 this.translate.get(['error_title', 'assignment_error_file_message'])
        //                 .subscribe(messages => {
        //                     this._alert.next({
        //                         title: messages.error_title,
        //                         message: messages.assignment_error_file_message + ': ' + err.message,
        //                         type: 'error'
        //                     });
        //                 });
        //             });
        //         }
        //     });
        // }
    }

    async submitAssignment(url: string, userId: string, courseId: string, assignment: RxAssignmentDocument, textSubmission: string, comments: string, fileAttachment: string, isOnline: boolean) {
        if( !isOnline ) {
            this.translate.get(['error_title', 'error_must_be_online_message'])
            .subscribe(messages => {
                this._alert.next({
                    title: messages.error_title,
                    message: messages.error_must_be_online_message,
                    type: 'error'
                });

                return;
            });
        }

        url += '/webapps/bbgs-bboffline-BBLEARN/app/api/users/_' + userId + '/courses/_' + courseId + '/assignments/_' + assignment.id + '/submit';
        let body = {
            textSubmission: textSubmission,
            comments: comments
        };
        let formData: FormData = new FormData();
        formData.append("data", JSON.stringify(body));
        
        if( fileAttachment ) {
            console.debug('FileAttachment', fileAttachment);
            fs.readFile(fileAttachment, (err, data) => {
                console.debug('File data: ', data);
                if( err ) {
                    this.translate.get(['error_title', 'assignment_error_file_message'])
                    .subscribe(messages => {
                        this._alert.next({
                            title: messages.error_title,
                            message: messages.assignment_error_file_message + ': ' + err.message,
                            type: 'error'
                        });
                    });
                }
                else {
                    formData.append("file", data);
                }
            });
        }

        this.http.post(url, formData)
        .subscribe((res: any) => {
            if( res.status == 'ok') {
                this.translate.get(['success_title', 'assignment_success_lbl'])
                .subscribe(messages => {
                    this._alert.next({
                        title: messages.success_title,
                        message: messages.assignment_success_lbl,
                        type: 'success'
                    });
                });
            }
            else {
                this.translate.get('error_title')
                .subscribe(messages => {
                    this._alert.next({
                        title: messages.error_title,
                        message: res.message,
                        type: 'error'
                    });
                });
            }
        });
    }

    async clearAttemptData() {
        this._assignmentSubmission.next(null);
        this._alert.next(null);
    }

    async clearAlert() {
        this._alert.next(null);
    }
}