import { Component, OnInit, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/Subscription';
import { UserService } from '../../services/user.service';
import { DatabaseService } from '../../services/database.service';
import { RxUserDocument } from '../../typings/RxDB';
import { NgxAlertsService } from '@ngx-plus/ngx-alerts';

const remote = window.require('electron').remote;
const app = remote.app;

const Store = window.require('electron-store');
const store = new Store();

const rimraf = require('rimraf');

@Component({
    selector: 'settings',
    templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
    userSubscription: Subscription;
    user: RxUserDocument;
    url: string;
    isOnline: boolean;
    language: string;
    languages = [{id: 'en', name: 'English'}, {id: 'es', name: 'Spanish'}];

    constructor(private router: Router, 
                private userService: UserService, 
                private databaseService: DatabaseService, 
                private translate: TranslateService,
                private ngxAlertsService: NgxAlertsService) {
    }

    ngOnInit() {
        this.userSubscription = this.userService.user.subscribe(user => this.user = user);

        let userData = store.get('bbofflineUserData');
        this.url = userData.url;
        this.isOnline = userData.isOnline;

        this.language = store.get('bbofflineLanguage');
        if( !this.language ) {
            this.language = 'en';
        }
    }

    async updateLanguage(language: string) {
        console.debug('Language update: ', language);
        this.language = language;
        store.set('bbofflineLanguage', language);
        this.translate.use(language);
        this.translate.setDefaultLang(language);

        this.translate.get(['success_title', 'saved_language_message'])
        .subscribe(messages => {
            let title = messages.success_title;
            let message = messages.saved_language_message;

            this.ngxAlertsService.alertSuccess({title: title, text: message});
        });
    }

    async deleteAllData() {
        // Remove store data.
        store.delete('bbofflineUserData');
        store.delete('bbofflineLanguage');

        // Delete files.
        let contentDir = app.getPath('appData') + '/bb/files';
        rimraf(contentDir, () => {
            console.log('Files successfully deleted.');
        });

        // Delete database.
        const db = await this.databaseService.get();
        await db.remove()
        .then(() => console.log('Database successfully removed.'))
        .catch(error => console.error('An error occurred while removing the database.', error));

       // redirect to login page.
       this.router.navigate(['./login-oauth']);
    }
}