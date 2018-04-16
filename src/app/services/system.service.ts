import { Injectable, Inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpRequest, HttpHeaders} from '@angular/common/http'
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Version, SystemInfo } from '../model/model';
import { RxSystemDocument } from '../typings/RxDB';
import { DatabaseService } from './database.service';

export class SystemService implements OnDestroy {
    private http: HttpClient;
    private databaseService: DatabaseService;

    private versionSubscription: Subscription;
    private systemSubscription: Subscription;

    private _version: BehaviorSubject<Version> = new BehaviorSubject(null);
    public version: Observable<Version> = this._version.asObservable();

    private _system: BehaviorSubject<RxSystemDocument> = new BehaviorSubject(null);
    public system: Observable<RxSystemDocument> = this._system.asObservable();

    constructor(@Inject(HttpClient) http: HttpClient,
                @Inject(DatabaseService) databaseService: DatabaseService) {
        this.http = http;
        this.databaseService = databaseService;
    }

    ngOnDestroy() {
        this.systemSubscription.unsubscribe();
        this.versionSubscription.unsubscribe();
    }

    async getLearnVersion(url: string) {
        url += '/learn/api/public/v1/system/version';
        const httpHeaders: HttpHeaders = new HttpHeaders().append('Enable-Bb-Bearer-Token', 'true');
    
        this.versionSubscription = this.http.get<Version>(url, {headers: httpHeaders})
        .subscribe(version => this._version.next(version));
    }

    createSystemInfo(url: string, version: Version): SystemInfo {
        let systemInfo: SystemInfo = {
            id: btoa(url),
            url: url,
            version: version
        };

        return systemInfo;
    }

    async readSystemInfo(url: string) {
        const db = await this.databaseService.get();
        const system$ = db.system.findOne().where('id').eq(btoa(url)).$;
        this.systemSubscription = system$.subscribe(system => this._system.next(system));
    }

    async writeSystemInfo(systemInfo: SystemInfo) {
        const db = await this.databaseService.get();

        console.debug('SystemService writing systemInfo...', systemInfo);

        const doc = await db.system.upsert(systemInfo);
        console.debug('Inserted systemInfo...', doc);

        this._system.next(doc);
    }
}