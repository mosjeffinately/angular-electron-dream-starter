import { Component, OnInit, Input, NgZone } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';

import { LoginService } from '../../services/login.service';
import { OAuthService } from '../../services/oauth.service';
import { UserService } from '../../services/user.service';
import { CourseService } from '../../services/course.service';
import { UserData, Version, Token, UserToken, SystemInfo } from '../../model/model';
import { RxUserDocument, RxSystemDocument } from '../../typings/RxDB';
import { SystemService } from '../../services/system.service';


declare var myExtObject: any
declare global {
    interface Window {
      require: any;
    }
}

const remote = window.require('electron').remote;
const app = remote.app;

const Store = window.require('electron-store');
const store = new Store();

@Component({
    templateUrl: 'login-oauth.component.html'
})
export class OAuthLoginComponent {
    loginForm: FormGroup;

    url: string;
    isOnline: boolean;

    userSubscription: Subscription;
    user: RxUserDocument;

    systemSubscription: Subscription;
    systemInfo: RxSystemDocument;

    versionSubscription: Subscription;
    version: Version;

    tokenSubscription: Subscription;
    token: Token;

    authCodeSubscription: Subscription;
    authCode: string;

    userTokenSubscription: Subscription;
    userToken: UserToken;

    constructor(private zone: NgZone,
                private router: Router, 
                private route: ActivatedRoute, 
                private fb: FormBuilder, 
                private loginService: LoginService, 
                private oauthService: OAuthService,
                private systemService: SystemService,
                private userService: UserService, 
                private courseService: CourseService) {
    }

    ngOnInit(){
        const userData = store.get('bbofflineUserData');
        
        if( !userData ) {
            this.loginForm = this.fb.group({
                url: [ '', Validators.compose([Validators.required, Validators.pattern(/((?:https?\:\/\/|www\.)(?:[-a-z0-9]+\.)*[-a-z0-9]+.*)/i)]) ]
            });
        }
        else {
            this.url = userData.url;
            if( userData.username ) {
                this.userService.readUserInfo(userData.username);
            }

            this.loginForm = this.fb.group({
                url: [ userData.url ? userData.url : '', Validators.compose([Validators.required, Validators.pattern(/((?:https?\:\/\/|www\.)(?:[-a-z0-9]+\.)*[-a-z0-9]+.*)/i)]) ]
            });
        }

        this.versionSubscription = this.systemService.version.subscribe(version => {
            if( version ) {
                const systemInfo: SystemInfo = this.systemService.createSystemInfo(this.url, version);
                this.systemService.writeSystemInfo(systemInfo);

                this.version = version;
                console.debug('Version:', version);
                if( this.version.learn.major > 3200) {
                    this.loginService.getAuthorizationCode(this.url);
                    // this.loginService.getRestToken(this.loginForm.get('url').value);
                }
                else {
                    if( userData ) {
                        const username: string = userData.username;
                        console.debug('Username:', username);
                        if( username ) {
                            this.userService.readUserInfo(username);
                        }
                    }

                    this.router.navigate(['./login']);
                }
            }
        });

        this.systemSubscription = this.systemService.system.subscribe(systemInfo => this.systemInfo = systemInfo);

        this.authCodeSubscription = this.loginService.authorizationCode.subscribe(code => {
            if( code ) {
                this.authCode = code;
                this.oauthService.getUserToken(this.url, this.authCode);
            }
        });

        this.userTokenSubscription = this.oauthService.userToken.subscribe(userToken => {
            if( userToken ) {
                console.debug('retrieved user token: ', userToken);
                this.userToken = userToken;
                console.debug('Loading user information...');
                this.userService.getRestUserDetailsByUuid(this.url, userToken.userId);
            }
        });

        this.userSubscription = this.userService.user.subscribe(user => {
            if( user ) {
                this.user = user;
                let userData = store.get('bbofflineUserData');
                userData.url = this.url;
                userData.username = user.userName;
                userData.isOnline = true;
                store.set('bbofflineUserData', userData);
            }
            if( user && this.version && this.version.learn.major > 3200 ) {
                this.redirectToMainComponent();
            }
        });

        this.tokenSubscription = this.oauthService.token.subscribe(token => {
            if( token ) {
                this.token = token;
            }
        });
    }
        
    ngOnDestroy() {
        this.userSubscription.unsubscribe();
        this.tokenSubscription.unsubscribe();
        this.versionSubscription.unsubscribe();
        this.authCodeSubscription.unsubscribe();
        this.userTokenSubscription.unsubscribe();
    }        
    
    submitUrl(loginFormValue: FormGroup) {
        // store the credentials
        this.loginForm = loginFormValue;
        this.url = this.loginForm.get('url').value;
        this.isOnline = true;

        let userData = store.get('bbofflineUserData');
        userData.url = this.url;
        userData.isOnline = true;

        store.set('bbofflineUserData', userData);

        this.oauthService.getRestToken(this.url);
        this.systemService.getLearnVersion(this.url);
    }

    redirectToMainComponent() {
        console.debug('Navigating to Courses Component...');
        this.zone.run(() => this.router.navigate(['main-app']));
    }
}