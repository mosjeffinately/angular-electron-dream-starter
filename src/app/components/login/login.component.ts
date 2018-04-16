import { Component, OnInit, Input, NgZone } from '@angular/core';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/Subscription';

import { LoginService } from '../../services/login.service';
import { OAuthService } from '../../services/oauth.service';
import { UserService } from '../../services/user.service';
import { CourseService } from '../../services/course.service';
import { UserData, Token } from '../../model/model';
import { RxUserDocument } from '../../typings/RxDB';

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
    templateUrl: 'login.component.html'
})
export class LoginComponent {
    loginForm: FormGroup;
    loaderFlag=false;

    oauthSubscription: Subscription;
    token: Token;

    userSubscription: Subscription;
    user: RxUserDocument;

    constructor(private zone: NgZone,
                private router: Router, 
                private fb: FormBuilder, 
                private loginService: LoginService, 
                private oauthService: OAuthService, 
                private userService: UserService, 
                private courseService: CourseService,
                private translateService: TranslateService) {
    }

    ngOnInit() {
        const userData: any = store.get('bbofflineUserData');
        console.debug('OfflineUserData: ', userData);
        const url: string = userData.url;
        const username: string = userData.username;
        const savePassword: boolean = userData.savePassword;

        this.userSubscription = this.userService.user.subscribe(user => {
            this.user = user;
            console.debug('Save password: ', savePassword);
            
            if( this.user ) {
                console.debug('Password: ', user.get('password'));
                this.loginForm = this.fb.group({
                    url: [ userData.url ? userData.url : '', Validators.compose([Validators.required, Validators.pattern(/((?:https?\:\/\/|www\.)(?:[-a-z0-9]+\.)*[-a-z0-9]+.*)/i)]) ],
                    username: [ user.userName ? this.user.userName : '', Validators.required ],
                    password: [ savePassword && user.get('password') ? user.get('password') : '', Validators.required ],
                    savePasswordCheck: [ savePassword ]
                });
            }
            else {
                this.loginForm = this.fb.group({
                    url: [ url ? url : '', Validators.compose([Validators.required, Validators.pattern(/((?:https?\:\/\/|www\.)(?:[-a-z0-9]+\.)*[-a-z0-9]+.*)/i)]) ],
                    username: [ '', Validators.required ],
                    password: [ '', Validators.required ],
                    savePasswordCheck: [ false ]
                });                
            }
        });

        this.loaderFlag=false;
    }
        
    ngOnDestroy() {
        this.oauthSubscription.unsubscribe();
        this.userSubscription.unsubscribe();
    }        
    
    submitLogin(loginFormValue: FormGroup) {
        // Load the form value.
        console.log('Login Form: ', loginFormValue);
        this.loginForm = loginFormValue;

        const url = this.loginForm.get('url').value;
        const username = this.loginForm.get('username').value;
        const password = this.loginForm.get('password').value;
        const savePasswordCheck = this.loginForm.get('savePasswordCheck').value;
        console.debug('Save password value:', savePasswordCheck);


        // Get the rest token.
        this.oauthSubscription = this.oauthService.token.subscribe(token => this.token = token);
        this.oauthService.getRestToken(url);

        // SOAP Login.
        this.loginService.login(url, username, password)
        .then(() => {
            // store the credentials
            console.debug('Save password:', savePasswordCheck);
            store.set('bbofflineUserData', { 
                url: url, 
                username: username, 
                savePassword: savePasswordCheck,
                isOnline: true
            });

            console.debug('UserData: ', store.get('bbofflineUserData'));

            // Get the user details asynchronously.
            this.userService.getUserDetails(url, username, password, true );
            // Get the list of available courses
            this.courseService.getCourses(url, username, true );
            this.zone.run(() => this.router.navigate(['main-app']));
            
        })
        .catch((error) => {
            console.error(error);
            this.translateService.get('login_error_msg').subscribe((msg: string) => {
                alert(msg + '\n' + error);
            })
        });
    }


    workOffline() {

        store.set('bbofflineUserData', {
            url: this.loginForm.get('url').value,
            username: this.loginForm.get('username').value,
            isOnline: false
        });

        this.userService.getUserDetails( this.loginForm.get('url').value, this.loginForm.get('username').value, '', false );
        this.courseService.getCourses( this.loginForm.get('url').value, this.loginForm.get('username').value, false );

        this.router.navigate(['../main']);
    }
}