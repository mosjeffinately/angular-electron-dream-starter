import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  NgModule,
  ApplicationRef
} from '@angular/core';
import {
  removeNgStyles,
  createNewHosts,
  createInputTransfer
} from '@angularclass/hmr';
import {
  RouterModule,
  PreloadAllModules
} from '@angular/router';

import { EffectsModule } from '@ngrx/effects';
import {
  RouterStateSerializer,
  StoreRouterConnectingModule
} from '@ngrx/router-store';
import { StoreModule } from '@ngrx/store';
import { Store } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxAlertsModule, NgxAlertsService } from '@ngx-plus/ngx-alerts';
/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { ROUTES } from './app.routes';

// App is our top level component
import { AppComponent } from './app.component';
import { APP_BASE_HREF } from '@angular/common';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { SIDEBAR_TOGGLE_DIRECTIVES } from './shared/sidebar.directive';
import { NAV_DROPDOWN_DIRECTIVES } from './shared/nav-dropdown.directive';

import '../styles/style.scss';

// Components:
import { AssignmentComponent } from './components/assignment/index';
import { CourseAnnouncementsComponent } from './components/course-announcements/index';
import { CourseContentsComponent } from './components/course-contents/index';
import { CourseDetailsComponent } from './components/course-details/index';
import { CourseMembershipsComponent } from './components/course-memberships/index';
import { DiscussionsComponent } from './components/discussions/index';
import { ForumsComponent } from './components/forums/index';
import { ForumLinkComponent } from './components/forum-link/index';
import { LoginComponent } from './components/login/index';
import { MainComponent } from './components/main-app/index';
import { MainMenuComponent } from './components/main-menu/index';
import { NoContentComponent } from './components/no-content/index';
import { OAuthLoginComponent } from './components/login-oauth/index';
import { PostsComponent } from './components/posts/index';
import { PostComponent } from './components/post/index';
import { SettingsComponent } from './components/settings/index';
import { SystemAnnouncementsComponent } from './components/system-announcements/index';
import { ThreadsComponent } from './components/threads/index';

// Pipes:
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { SafeUrlPipe } from './pipes/safe-url.pipe';

// Services:
import { AssignmentService } from './services/assignment.service';
import { AttachmentService } from './services/attachment.service';
import { AuthService } from './services/authentication.service';
import { ContentService } from './services/content.service';
import { CourseService } from './services/course.service';
import { CourseAnnouncementService } from './services/course-announcements.service';
import { DatabaseService } from './services/database.service';
import { DiscussionService } from './services/discussion-board.service';
import { EmbeddedContentService } from './services/embedded-content.service';
import { ForumService } from './services/discussion-forum.service';
import { ForumLinkService } from './services/forum-link.service';
import { LoginService } from './services/login.service';
import { OAuthService } from './services/oauth.service';
import { PostService } from './services/discussion-post-service';
import { SystemService } from './services/system.service';
import { SystemAnnouncementsService } from './services/system-announcements.service';
import { ThreadService } from './services/discussion-thread.service';
import { UserService } from './services/user.service';

// Interceptors:
import { TokenInterceptor } from './interceptors/token.interceptor';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

declare const ENV: string;

// Application wide providers
const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  { provide: APP_BASE_HREF, useValue : '/' }
];

interface InternalStateType {
  [key: string]: any;
}

interface StoreType {
  state: InternalStateType;
  rootState: InternalStateType;
  restoreInputValues: () => void;
  disposeOldHosts: () => void;
}

let CONDITIONAL_IMPORTS = [];

if (ENV === 'development') {
  console.log('loading react devtools');
  CONDITIONAL_IMPORTS.push(StoreDevtoolsModule.instrument());
}

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [ AppComponent ],
  declarations: [
    AppComponent,
    NoContentComponent,
    SIDEBAR_TOGGLE_DIRECTIVES,
    NAV_DROPDOWN_DIRECTIVES,
    LoginComponent,
    OAuthLoginComponent,
    MainComponent,
    MainMenuComponent,
    CourseMembershipsComponent,
    SystemAnnouncementsComponent,
    SettingsComponent,
    CourseDetailsComponent,
    CourseAnnouncementsComponent,
    CourseContentsComponent,
    AssignmentComponent,
    DiscussionsComponent,
    ForumsComponent,
    ThreadsComponent,
    PostsComponent,
    PostComponent,
    ForumLinkComponent,
    SafeHtmlPipe,
    SafeUrlPipe
  ],
  imports: [ // import Angular's modules
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
    NgxAlertsModule.forRoot(),
    // StoreModule.forRoot(reducers),
    // StoreRouterConnectingModule,
    RouterModule.forRoot(ROUTES, { useHash: true, preloadingStrategy: PreloadAllModules }),
    ...CONDITIONAL_IMPORTS
  ],
  providers: [ // expose our Services and Providers into Angular's dependency injection
    ENV_PROVIDERS,
    APP_PROVIDERS,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    AuthService,
    DatabaseService,
    OAuthService,
    UserService,
    CourseService,
    ContentService,
    AttachmentService,
    CourseAnnouncementService,
    SystemAnnouncementsService,
    AssignmentService,
    DiscussionService,
    ForumService,
    ThreadService,
    PostService,
    ForumLinkService,
    LoginService,
    EmbeddedContentService,
    SystemService,
    NgxAlertsService
  ]
})
export class AppModule {

  constructor(
    public appRef: ApplicationRef
    // private _store: Store<AppState>
  ) {}

  public hmrOnInit(store: StoreType) {
    // if (!store || !store.rootState) {
    //   return;
    // }
    // console.log('HMR store', JSON.stringify(store, null, 2));
    // set state
    // if (store.rootState) {
    //   this._store.dispatch({
    //     type: 'SET_ROOT_STATE',
    //     payload: store.rootState
    //   });
    // }
    // set input values
    // if ('restoreInputValues' in store) {
    //   let restoreInputValues = store.restoreInputValues;
    //   setTimeout(restoreInputValues);
    // }
    // this.appRef.tick();
    // Object.keys(store).forEach(prop => delete store[prop]);
  }

  public hmrOnDestroy(store: StoreType) {
    const cmpLocation = this.appRef.components.map((cmp) => cmp.location.nativeElement);
    // save state
    // this._store.take(1).subscribe(s => store.rootState = s);
    // recreate root elements
    // store.disposeOldHosts = createNewHosts(cmpLocation);
    // save input values
    // store.restoreInputValues  = createInputTransfer();
    // remove styles
    removeNgStyles();
  }

  public hmrAfterDestroy(store: StoreType) {
    // display new elements
    // store.disposeOldHosts();
    // delete store.disposeOldHosts;
  }

}
