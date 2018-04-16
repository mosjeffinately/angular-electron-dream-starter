/*
 * Angular 2 decorators and services
 */
import {
  Component,
  OnInit,
  ViewEncapsulation,
  ViewContainerRef
} from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/take';
import { shell } from 'electron';
import { TranslateService } from '@ngx-translate/core';

const Store = window.require('electron-store');
const store = new Store();
/*
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  public bbLogo = 'assets/img/logo.png';

  constructor(private translate: TranslateService) {

    let language = store.get('bbofflineLanguage');
    console.debug('Loaded language:', language);
    if( language ) {
      translate.setDefaultLang(language);
      translate.use(language);
    }
    else {
      translate.setDefaultLang('en');
      translate.use('en')
    }
  }

  public ngOnInit() {
  }

  public openURL(url) {
    shell.openExternal(url);
  }

}

/*
 * Please review the https://github.com/AngularClass/angular2-examples/ repo for
 * more angular app examples that you may copy/paste
 * (The examples may not be updated as quickly. Please open an issue on github for us to update it)
 * For help or questions please contact us at @AngularClass on twitter
 * or our chat on Slack at https://AngularClass.com/slack-join
 */
