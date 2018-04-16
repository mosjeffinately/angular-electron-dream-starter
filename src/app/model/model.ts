export class AdaptiveRelease {
    start: string;
    end: string;
}

export class Assignment {
    id: string;
    dueDate: string;
    pointsPossible: number;
}

export class Attachment {
    id: string;
    filename: string;
    fileId: string;
    filesize: number;
    contentId: string;
}

export class Availability {
    available: string;
    allowGuests: boolean;
    adaptiveRelease: AdaptiveRelease;
}

export class ContentHandler {
    id: string;
}

export class CourseAnnouncementResults {
    results: CourseAnnouncement[];
}

export class CourseAnnouncement {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    timeZone: string;
    body: string;
    courseId: string;
}

export class SystemAnnouncement {
    id: string;
    title: string;
    body: string;
    availability: SystemAnnouncementAvailability;
    created: string;
}

export class SystemAnnouncementAvailability {
    duration: SystemAnnouncementDuration;
}

export class SystemAnnouncementDuration {
    type: string;
    start: string;
    end: string;
}

export class SystemAnnouncementResults {
    results: SystemAnnouncement[];
}

export class CourseContent {
    id: string;
    parentId: string;
    title: string;
    body: string;
    description: string;
    position: number;
    created: string;
    hasChildren: boolean;
    availability: Availability;
    contentHandler: ContentHandler;
    courseId: string;
}

export class ContentAttachments {
    content: CourseContent;
    attachments: Attachment[];
}

export class BbContentResults {
    results: BbContent[];
}

export class BbContent {
    id: string;
    parentId: string;
    title: string;
    body: string;
    description: string;
    created: string;
    position: number;
    hasChildren: boolean;
    availability: BbContentAvailability;
    contentHandler: BbContentHandler;
}

export class BbContentAvailability {
    available: string;
    allowGuests: boolean;
    adaptiveRelease: BbContentAdaptiveRelease;
}

export class BbContentAdaptiveRelease {
    start: string;
    end: string;
}

export class BbContentHandler {
    id: string;
}

export class Content extends BbContent {
    courseId: string;   
}

export class BbCourseData {
    id: string;
    externalId: string;
    name: string;
    courseId: string;
    description: string;
    created: string;
    termId: string;
    availability: BbCourseAvailability;
}

export class BbCourseAvailabilityDuration {
    type: string;
    start: string;
    end: string;
    daysOfUse: number;
}

export class BbCourseAvailability {
    available: string;
    duration: BbCourseAvailabilityDuration;
}

export class CourseData {
    id: string;
    externalId: string;
    name: string;
    courseId: string;
    description: string;
}

export class CourseMembershipData {
    userId: string;
    courseId: string;
    availability: Availability;
}

export class CourseMembershipResults {
    results: CourseMembershipData[];
}

export class BbToken {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
    user_id: string;
}

export class Token {
    access_token: string;
    expires: Date;
}

export class UserToken extends Token {
    userId: string;
}

export class UserData {
    id: string;
    externalId: string;
    username: string;
    firstname: string;
    lastname: string;
    url: string;
    active: boolean;
}

export class BbUser {
    id: string;
    externalId: string;
    userName: string;
    name: UserName;
}

export class User {
    id: string;
    externalId: string;
    userName: string;
    password: string;
    givenName: string;
    familyName: string;
}

export class UserName {
    given: string;
    family: string;
    middle: string;
    other: string;
    suffix: string;
    title: string;
}

export class Version {
    learn: VersionInfo;
}

export class VersionInfo {
    major: number;
    minor: number;
    patch: number;
    build: string;
}

export class DiscussionBoard {
    id: string;
    title: string;
    position: number;
    forums: number;
    participants: number;
    posts: number;
    courseId: string;
}

export class DiscussionForum {
    id: string;
    title: string;
    description: string;
    position: number;
    posts: number;
    unreadPosts: number;
    participants: number;
    discussionId: string;
}

export class DiscussionThread {
    id: string;
    title: string;
    postDate: string;
    author: string;
    status: string;
    unreadPosts: number;
    totalPosts: number;
    forumId: string;
}

export class DiscussionPost {
    id: string;
    title: string;
    body: string;
    author: string;
    postedDate: string;
    editedDate: string;
    threadId: string;
    parentId: string;
}

export class ForumLink {
    id: string;
    title: string;
    contentId: string;
}

export class SystemInfo {
    id: string;
    url: string;
    version: Version;
}