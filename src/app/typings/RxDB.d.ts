/**
 * custom typings so typescript knows about the schema-fields
 * @type {[type]}
 */

import { RxDocument, RxCollection, RxDatabase } from 'rxdb';
import { Observable } from 'rxjs';

declare interface RxUserDocumentType {
    id?: string;
    externalId?: string;
    userName?: string;
    givenName?: string;
    familyName?: string;
}
export type RxUserDocument = RxDocument<RxUserDocumentType>;
declare class RxUserCollection extends RxCollection<RxUserDocumentType> {}

declare interface RxCourseDocumentType {
    id?: string;
    externalId?: string;
    courseId?: string;
    name?: string;
    description?: string;
    created?: string;
    termId?: string;
    availability?: RxCourseAvailability;
}
declare interface RxCourseAvailability {
    available?: string;
    duration?: RxCourseDuration;
}
declare interface RxCourseDuration {
    type?: string;
    start?: string;
    end?: string;
    daysOfUse: number;
}
export type RxCourseDocument = RxDocument<RxCourseDocumentType>;
declare class RxCourseCollection extends RxCollection<RxCourseDocumentType> {}

declare interface RxSystemAnnouncementDocumentType {
    id?: string;
    title?:string;
    body?:string;
    availability: RxSystemAnnouncementAvailability;
    created: string;
}
declare interface RxSystemAnnouncementAvailability {
    duration?: RxSystemAnnouncementDuration;
}
declare interface RxSystemAnnouncementDuration {
    type?: string;
    start?: string;
    end?: string;
}
export type RxSystemAnnouncementDocument = RxDocument<RxSystemAnnouncementDocumentType>;
declare class RxSystemAnnouncementCollection extends RxCollection<RxSystemAnnouncementDocumentType> {}

declare interface RxCourseAnnouncementDocumentType {
    id?: string;
    title?: string;
    body?: string;
    startDate?: string;
    endDate?: string;
    timeZone?: string;
    courseId?: string;
}
export type RxCourseAnnouncementDocument = RxDocument<RxCourseAnnouncementDocumentType>;
declare class RxCourseAnnouncementCollection extends RxCollection<RxCourseAnnouncementDocumentType> {}

declare interface RxContentDocumentType {
    id?: string;
    parentId?: string;
    title?: string;
    body?: string;
    description?: string;
    created?: string;
    position?: number;
    hasChildren?: boolean;
    availability?: RxContentAvailability;
    contentHandler?: RxContentHandler;
    courseId?: string;
}
declare interface RxContentAvailability {
    available?: string;
    allowGuests?: boolean;
    adaptiveRelease?: RxContentAdaptiveRelease;
}
declare interface RxContentAdaptiveRelease {
    start?: string;
    end?: string;
}
declare interface RxContentHandler {
    id?: string;
}
export type RxContentDocument = RxDocument<RxContentDocumentType>;
declare class RxContentCollection extends RxCollection<RxContentDocumentType> {}

declare interface RxAttachmentDocumentType {
    id?: string;
    filename?: string;
    fileId?: string;
    filesize?: number;
    contentId?: string;
}
export type RxAttachmentDocument = RxDocument<RxAttachmentDocumentType>;
declare class RxAttachmentCollection extends RxCollection<RxAttachmentDocumentType> {}

declare interface RxAssignmentDocumentType {
    id?: string;
    dueDate?: string;
    pointsPossible?: number;
}
export type RxAssignmentDocument = RxDocument<RxAssignmentDocumentType>;
declare class RxAssignmentCollection extends RxCollection<RxAssignmentDocumentType> {}

declare interface RxAssignmentSubmissionDocumentType {
    id?: string;
    textSubmission?: string;
    fileAttachment?: string;
    comments?: string;
    submissionStatus?: number;
}
export type RxAssignmentSubmissionDocument = RxDocument<RxAssignmentSubmissionDocumentType>;
declare class RxAssignmentSubmissionCollection extends RxCollection<RxAssignmentSubmissionDocumentType> {}

declare interface RxDiscussionBoardDocumentType {
    id?: string;
    title?: string;
    position?: number;
    forums?: number;
    participants?: number;
    posts?: number;
    courseId?: string;
}
export type RxDiscussionBoardDocument = RxDocument<RxDiscussionBoardDocumentType>;
declare class RxDiscussionBoardCollection extends RxCollection<RxDiscussionBoardDocumentType> {}

declare interface RxDiscussionForumDocumentType {
    id?: string;
    title?: string;
    description?: string;
    position?: number;
    participants?: number;
    posts?: number;
    unreadPosts?: number;
    discussionId?: string;
}
export type RxDiscussionForumDocument = RxDocument<RxDiscussionForumDocumentType>;
declare class RxDiscussionForumCollection extends RxCollection<RxDiscussionForumDocumentType> {}

declare interface RxDiscussionThreadDocumentType {
    id?: string;
    title?: string;
    postDate?: string;
    author?: string;
    status?: string;
    totalPosts?: number;
    unreadPosts?: number;
    forumId?: string;
}
export type RxDiscussionThreadDocument = RxDocument<RxDiscussionThreadDocumentType>;
declare class RxDiscussionThreadCollection extends RxCollection<RxDiscussionThreadDocumentType> {}

declare interface RxDiscussionPostDocumentType {
    id?: string;
    title?: string;
    body?: string;
    author?: string;
    postedDate?: string;
    editedDate?: string;
    hasAttachment?: boolean;
    threadId?: string;
    parentId?: string;
}
export type RxDiscussionPostDocument = RxDocument<RxDiscussionPostDocumentType>;
declare class RxDiscussionPostCollection extends RxCollection<RxDiscussionPostDocumentType> {}

declare interface RxForumLinkDocumentType {
    id?: string;
    title?: string;
    contentId?: string;
}
export type RxForumLinkDocument = RxDocument<RxForumLinkDocumentType>;
declare class RxForumLinkCollection extends RxCollection<RxForumLinkDocumentType> {}

declare interface RxSystemDocumentType {
    id?: string;
    url?: string;
    version?: RxVersionDocumentType
}
declare interface RxVersionDocumentType {
    learn?: RxLearnVersionDocumentType;
}
declare interface RxLearnVersionDocumentType {
    major?: number;
    minor?: number;
    patch?: number;
    build?: string;
}
export type RxSystemDocument = RxDocument<RxSystemDocumentType>;
declare class RxSystemCollection extends RxCollection<RxSystemDocumentType> {}

export class RxOfflineDatabase extends RxDatabase {
    users?: RxUserCollection;
    courses?: RxCourseCollection;
    systemannouncements?: RxSystemAnnouncementCollection;
    courseannouncements?: RxCourseAnnouncementCollection;
    contents?: RxContentCollection;
    attachments?: RxAttachmentCollection;
    assignments?: RxAssignmentCollection;
    assignmentsubmissions?: RxAssignmentSubmissionCollection;
    discussions?: RxDiscussionBoardCollection;
    forums?: RxDiscussionForumCollection;
    threads?: RxDiscussionThreadCollection;
    posts?: RxDiscussionPostCollection;
    forumlink?: RxForumLinkCollection;
    system?: RxSystemCollection;
}

declare let _default: {
    RxUserCollection,
    RxCourseCollection,
    RxSystemAnnouncementCollection,
    RxCourseAnnouncementCollection,
    RxContentCollection,
    RxAttachmentCollection,
    RxAssignmentCollection,
    RxAssignmentSubmissionCollection,
    RxDiscussionBoardCollection,
    RxDiscussionForumCollection,
    RxDiscussionThreadCollection,
    RxDiscussionPostCollection,
    RxForumLinkCollection,
    RxSystemCollection,
    RxOfflineDatabase
}
export default _default;