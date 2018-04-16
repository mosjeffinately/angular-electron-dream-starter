import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/index';
import { CourseDetailsComponent } from './components/course-details/index';
import { CourseMembershipsComponent } from './components/course-memberships/index';
import { MainComponent } from './components/main-app/index';
import { NoContentComponent } from './components/no-content/index';
import { OAuthLoginComponent } from './components/login-oauth/index';
import { SettingsComponent } from './components/settings/index';
import { SystemAnnouncementsComponent } from './components/system-announcements/index';
import { CourseAnnouncementsComponent } from './components/course-announcements/index';
import { CourseContentsComponent } from './components/course-contents/index';
import { AssignmentComponent } from './components/assignment/assignment.component';
import { DiscussionsComponent } from './components/discussions/discussions.component';
import { ForumsComponent } from './components/forums/forums.component';
import { ThreadsComponent } from './components/threads/threads.component';
import { PostsComponent } from './components/posts/posts.component';
import { ForumLinkComponent } from './components/forum-link/forum-link.component';


export const ROUTES: Routes = [
  { path: '', redirectTo: 'login-oauth', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'login-oauth', component: OAuthLoginComponent },
  { path: 'main-app', 
    component: MainComponent,
    children: [
      {
        path: '',
        redirectTo: 'course-memberships',
        pathMatch: 'full'
      },
      {
        path: 'settings',
        component: SettingsComponent,
        pathMatch: 'full'
      },
      {
        path: 'announcements',
        component: SystemAnnouncementsComponent,
        pathMatch: 'full'
      },
      {
        path: 'course-memberships',
        component: CourseMembershipsComponent,
        pathMatch: 'full'
      },
      {
        path: 'course-announcements',
        component: CourseAnnouncementsComponent,
        pathMatch: 'full'
      },
      {
        path: 'course-contents/:id',
        component: CourseContentsComponent,
        pathMatch: 'full'
      },
      {
        path: 'assignment/:id',
        component: AssignmentComponent,
        pathMatch: 'full'
      },
      {
        path: 'discussions',
        component: DiscussionsComponent,
        pathMatch: 'full'
      },
      {
        path: 'forums',
        component: ForumsComponent,
        pathMatch: 'full'
      },
      {
        path: 'threads',
        component: ThreadsComponent,
        pathMatch: 'full'
      },
      {
        path: 'posts',
        component: PostsComponent,
        pathMatch: 'full'
      },
      {
        path: 'forum-link/:id',
        component: ForumLinkComponent,
        pathMatch: 'full'
      }
    ]
  },
  { path: '**',    component: NoContentComponent }
];
