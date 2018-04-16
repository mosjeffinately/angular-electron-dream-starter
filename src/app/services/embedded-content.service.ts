import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import 'rxjs/add/operator/catch';
import { RxCourseDocument, RxSystemAnnouncementDocument, RxUserDocument, RxCourseAnnouncementDocument, RxContentDocument } from '../typings/RxDB';
import { DatabaseService } from './database.service';

const remote = window.require('electron').remote;
const app = remote.app;

const Store = window.require('electron-store');
const store = new Store();

const fs = window.require('fs');

@Injectable()
export class EmbeddedContentService {
    constructor(private http: HttpClient, private databaseService: DatabaseService) {}

    async replaceContentTemplateVars(user: RxUserDocument, course: RxCourseDocument, content: RxContentDocument) {
        content = await this.replaceContentUserTemplateVars(user, content);
        content = await this.replaceContentCourseTemplateVars(course, content);
        content = await this.replaceTitleImages(user, content);
        content = await this.replaceContentImages(user, content);
        await content.save();
        return content;
    }

    async replaceContentUserTemplateVars(user: RxUserDocument, content: RxContentDocument) {
        if( content.title && content.title.includes('@X@user') ) {
            content.title = content.title.replace('@X@user.pk_string@X@', user.id);
            content.title = content.title.replace('@X@user.id@X@', user.userName);
            content.title = content.title.replace('@X@user.batch_uid@X@', user.externalId);
            content.title = content.title.replace('@X@user.full_name@X@', user.givenName + ' ' + user.familyName);
        }

        if( content.body && content.body.includes('@X@user') ) {
            content.body = content.body.replace('@X@user.pk_string@X@', user.id);
            content.body = content.body.replace('@X@user.id@X@', user.userName);
            content.body = content.body.replace('@X@user.batch_uid@X@', user.externalId);
            content.body = content.body.replace('@X@user.full_name@X@', user.givenName + ' ' + user.familyName);
        }

        return content;
    }

    async replaceContentCourseTemplateVars(course: RxCourseDocument, content: RxContentDocument) {
        if( content.title && content.title.includes('@X@course') ) {
            content.title = content.title.replace('@X@course.pk_string@X@', course.id);
            content.title = content.title.replace('@X@course.id@X@', course.courseId);
            content.title = content.title.replace('@X@course.batch_uid@X@', course.externalId);
            content.title = content.title.replace('@X@course.course_name@X@', course.name);
        }

        if( content.body && content.body.includes('@X@course') ) {
            content.body = content.body.replace('@X@course.pk_string@X@', course.id);
            content.body = content.body.replace('@X@course.id@X@', course.courseId);
            content.body = content.body.replace('@X@course.batch_uid@X@', course.externalId);
            content.body = content.body.replace('@X@course.course_name@X@', course.name);
        }

        return content;
    }

    async replaceTitleImages(user: RxUserDocument, content: RxContentDocument) {
        let userData: any = store.get('bbofflineUserData');
        let url: string = userData.url;

        let range = document.createRange();
        let fragment = range.createContextualFragment( content.title );
        let imgs = fragment.querySelectorAll( 'img' );

        let forkJoinQueue = [];
        for( let i = 0 ; i < imgs.length ; i++ ) {
            let src = imgs[i].getAttribute( 'src' );
            // replace the template variable with the url.
            // eg. https://<hostname>/bbcswebdav/xid-167887_1
            if( src.includes('@X@EmbeddedFile.requestUrlStub@X@') ) {
                src = src.replace('@X@EmbeddedFile.requestUrlStub@X@', url + '/');
            }
            if( src.startsWith('/images')) {
                src = url + src;
            }
            else if( src.startsWith('//') ) {
                src = 'http:' + src;
            }
            else if( src.startsWith('/bbcswebdav') ) {
                src = url + src;
            }

            forkJoinQueue.push( this.downloadImage( src, url, user ) );
        }

        await forkJoin(forkJoinQueue)
        .subscribe((results: Blob[]) => {
            results.forEach((blob: Blob, index: number) => {
                let dataUrl = URL.createObjectURL(blob);
                console.debug('Data URL:', dataUrl);
                imgs[index].setAttribute('src', dataUrl);
                imgs[index].setAttribute('class', 'img-fluid');
            });

            content.title = new XMLSerializer().serializeToString(fragment);
            console.debug('serialized content title.');
        });
        return content;
    }

    async replaceContentImages(user: RxUserDocument, content: RxContentDocument) {
        let userData: any = store.get('bbofflineUserData');
        let url: string = userData.url;

        let range = document.createRange();
        let fragment = range.createContextualFragment( content.body );
        let imgs = fragment.querySelectorAll( 'img' );

        let forkJoinQueue = [];
        for( let i = 0 ; i < imgs.length ; i++ ) {
            let src = imgs[i].getAttribute( 'src' );
            // replace the template variable with the url.
            // eg. https://<hostname>/bbcswebdav/xid-167887_1
            if( src.includes('@X@EmbeddedFile.requestUrlStub@X@') ) {
                src = src.replace('@X@EmbeddedFile.requestUrlStub@X@', url + '/');
            }
            if( src.startsWith('/images')) {
                src = url + src;
            }
            else if( src.startsWith('//') ) {
                src = 'http:' + src;
            }
            else if( src.startsWith('/bbcswebdav') ) {
                src = url + src;
            }

            forkJoinQueue.push( this.downloadImage( src, url, user ) );
        }

        await forkJoin(forkJoinQueue)
        .subscribe((results: Blob[]) => {
            results.forEach((blob: Blob, index: number) => {
                if(blob) {
                    let dataUrl = URL.createObjectURL(blob);
                    console.debug('Data URL:', dataUrl);
                    imgs[index].setAttribute('src', dataUrl);
                    imgs[index].setAttribute('class', 'img-fluid');
                }
            });

            content.body = new XMLSerializer().serializeToString(fragment);
            console.debug('serialized content body.');
        });
        return content;
    }

    removeTitleImages(content: RxContentDocument): RxContentDocument {
        let range = document.createRange();
        let fragment = range.createContextualFragment( content.title );
        let imgs = fragment.querySelectorAll( 'img' );

        for( let i = 0 ; i < imgs.length ; i++ ) {
            fragment.removeChild(imgs[i]);
        }

        content.title = new XMLSerializer().serializeToString(fragment);
        console.debug('serialized content title with removed images.');
        return content;
    }

    async replaceCourseAnnouncementTemplateVars(user: RxUserDocument, course: RxCourseDocument, announcement: RxCourseAnnouncementDocument) {
        announcement = await this.replaceCourseAnnouncementUserTemplateVars(user, announcement);
        announcement = await this.replaceCourseAnnouncementCourseTemplateVars(course, announcement);
        announcement = await this.replaceCourseAnnouncementImages(user, announcement);
        await announcement.save();
        return announcement;
    }

    async replaceCourseAnnouncementUserTemplateVars(user: RxUserDocument, announcement: RxCourseAnnouncementDocument) {
        if( announcement.body && announcement.body.includes('@X@user') ) {
            announcement.body = announcement.body.replace('@X@user.pk_string@X@', user.id);
            announcement.body = announcement.body.replace('@X@user.id@X@', user.userName);
            announcement.body = announcement.body.replace('@X@user.batch_uid@X@', user.externalId);
            announcement.body = announcement.body.replace('@X@user.full_name@X@', user.givenName + ' ' + user.familyName);
        }

        return announcement;
    }

    async replaceCourseAnnouncementCourseTemplateVars(course: RxCourseDocument, announcement: RxCourseAnnouncementDocument) {
        if( announcement.body && announcement.body.includes('@X@course') ) {
            announcement.body = announcement.body.replace('@X@course.pk_string@X@', course.id);
            announcement.body = announcement.body.replace('@X@course.id@X@', course.courseId);
            announcement.body = announcement.body.replace('@X@course.batch_uid@X@', course.externalId);
            announcement.body = announcement.body.replace('@X@course.course_name@X@', course.name);
        }

        return announcement;
    }

    async replaceCourseAnnouncementImages(user: RxUserDocument, announcement: RxCourseAnnouncementDocument) {
        let userData: any = store.get('bbofflineUserData');
        let url: string = userData.url;

        let range = document.createRange();
        let fragment = range.createContextualFragment( announcement.body );
        let imgs = fragment.querySelectorAll( 'img' );

        let forkJoinQueue = [];
        for( let i = 0 ; i < imgs.length ; i++ ) {
            let src = imgs[i].getAttribute( 'src' );
            // replace the template variable with the url.
            // eg. https://<hostname>/bbcswebdav/xid-167887_1
            if( src.includes('@X@EmbeddedFile.requestUrlStub@X@') ) {
                src = src.replace('@X@EmbeddedFile.requestUrlStub@X@', url + '/');
            }
            if( src.startsWith('/images')) {
                src = url + src;
            }
            else if( src.startsWith('//') ) {
                src = 'http:' + src;
            }

            forkJoinQueue.push( this.downloadImage( src, url, user ) );
        }

        await forkJoin(forkJoinQueue)
        .subscribe((results: Blob[]) => {
            results.forEach((blob: Blob, index: number) => {
                if(blob) {
                    let dataUrl = URL.createObjectURL(blob);
                    console.debug('Data URL:', dataUrl);
                    imgs[index].setAttribute('src', dataUrl);
                    imgs[index].setAttribute('class', 'img-fluid');
                }
                else {
                    console.error('Image blob is null.');
                }
            });

            announcement.body = new XMLSerializer().serializeToString(fragment);
            console.debug('serialized announcement body.');
        });
        return announcement;
    }

    async replaceSystemAnnouncementTemplateVars(user: RxUserDocument, announcement: RxSystemAnnouncementDocument) {
        announcement = await this.replaceSystemAnnouncementUserTemplateVars(user, announcement);
        announcement = await this.replaceSystemAnnouncementImages(user, announcement);
        await announcement.save();
        return announcement;
    }

    async replaceSystemAnnouncementUserTemplateVars(user: RxUserDocument, announcement: RxSystemAnnouncementDocument) {

        if( announcement.body && announcement.body.includes('@X@user') ) {
            announcement.body = announcement.body.replace('@X@user.pk_string@X@', user.id);
            announcement.body = announcement.body.replace('@X@user.id@X@', user.userName);
            announcement.body = announcement.body.replace('@X@user.batch_uid@X@', user.externalId);
            announcement.body = announcement.body.replace('@X@user.full_name@X@', user.givenName + ' ' + user.familyName);
        }

        return announcement;
    }

    async replaceSystemAnnouncementImages(user: RxUserDocument, announcement: RxSystemAnnouncementDocument) {
        let userData: any = store.get('bbofflineUserData');
        let url: string = userData.url;

        let range = document.createRange();
        let fragment = range.createContextualFragment( announcement.body );
        let imgs = fragment.querySelectorAll( 'img' );

        let forkJoinQueue = [];
        for( let i = 0 ; i < imgs.length ; i++ ) {
            let src = imgs[i].getAttribute( 'src' );
            // replace the template variable with the url.
            // eg. https://<hostname>/bbcswebdav/xid-167887_1
            if( src.includes('@X@EmbeddedFile.requestUrlStub@X@') ) {
                src = src.replace('@X@EmbeddedFile.requestUrlStub@X@', url + '/');
            }
            if( src.startsWith('/images')) {
                src = url + src;
            }
            else if( src.startsWith('//') ) {
                src = 'http:' + src;
            }

            forkJoinQueue.push( this.downloadImage( src, url, user ) );
        }

        await forkJoin(forkJoinQueue)
        .subscribe((results: Blob[]) => {
            results.forEach((blob: Blob, index: number) => {
                if(blob) {
                    let dataUrl = URL.createObjectURL(blob);
                    console.debug('Data URL:', dataUrl);
                    imgs[index].setAttribute('src', dataUrl);
                    imgs[index].setAttribute('class', 'img-fluid');
                }
            });

            announcement.body = new XMLSerializer().serializeToString(fragment);
            console.debug('serialized announcement body.');
        });
        return announcement;
    }

    downloadImage(src: string, url: string, user: RxUserDocument): Observable<Blob> {

        if( src.startsWith(url) ) {
            // Set the Basic Auth header.
            let credentials = btoa(user.userName + ':' + user.get('password') );
            let headers: HttpHeaders = new HttpHeaders().append('Authorization', 'Basic ' + credentials);
            
            return this.http.get( src, { headers: headers, responseType: 'blob' } )
            .catch(err => {
                console.error('Error downloading image:', err);
                return Observable.of(null)
            });
            
        }
        else {
            return this.http.get( src, { responseType: 'blob' } )
            .catch(err => Observable.of(null));
        }

        
    }
}