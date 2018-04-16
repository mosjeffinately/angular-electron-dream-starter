import { Injectable, Inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpRequest, HttpHeaders} from '@angular/common/http'
import { Subscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Version, Token } from '../model/model';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';
import { parse } from 'url';
import { OAuthService } from './oauth.service';
import { __assign } from 'tslib';
// import { TranslateService } from '@ngx-translate/core';

var xml2js = require('xml2js-es6-promise')
var XMLHttpRequestPromise = require('xhr-promise');

const remote = window.require('electron').remote;
const app = remote.app;

export class LoginService implements OnDestroy {
    url: string;
    path = '/webapps/ws/services/Context.WS';
    apiPath = '/webapps/bbgs-bboffline-BBLEARN/app/api';
    username: string;
    password: string;
    proxyPwd: string;
    sessionSecret: string;
    
    http: HttpClient;
    oauthService: OAuthService;

    // versionSubscription: Subscription;
    // private _version: BehaviorSubject<Version> = new BehaviorSubject(null);
    // public version: Observable<Version> = this._version.asObservable();

    private _authorizationCode: BehaviorSubject<string> = new BehaviorSubject(null);
    public authorizationCode: Observable<string> =  this._authorizationCode.asObservable();

    constructor(@Inject(HttpClient) http: HttpClient, 
                @Inject(OAuthService) oauthService: OAuthService) {
        this.http = http;
        this.oauthService = oauthService;
    }

    ngOnDestroy() {
        // this.versionSubscription.unsubscribe();
    }

    // async getLearnVersion(url: string) {
    //     url += '/learn/api/public/v1/system/version';
    //     const httpHeaders: HttpHeaders = new HttpHeaders().append('Enable-Bb-Bearer-Token', 'true');

    //     this.versionSubscription = this.http.get<Version>(url, {headers: httpHeaders})
    //     .subscribe(version => {
    //         console.debug('Version:', version);
    //         this._version.next(version);
    //     });
    // }

    async getAuthorizationCode(url: string) {
        console.debug('LoginService: getting authorization code...');

        const authWindow = new remote.BrowserWindow({
            width: 500,
            height: 600,
            show: true
        });

        url += '/learn/api/public/v1/oauth2/authorizationcode' +
               '?response_type=code&client_id=0f498ce4-e83b-4dbf-8bb7-be3e91b34ac7' +
               '&redirect_uri=urn:ietf:wg:oauth:2.0:oob' +
               '&nonce=' + this.randomString(32);

        authWindow.on('closed', () => {
            throw new Error('Auth window was closed by user');
        });
      
        authWindow.webContents.on('will-navigate', (event, newUrl) => {
            const redirectUrl = parse( newUrl );
            if( redirectUrl.path.includes('webapps/portal') ) {
                // Make the request again.
                console.debug('URL:', url);
                authWindow.loadURL(url);
            }

            const query = parse(newUrl, true).query;
            if(query) {
                if(query.error) {
                    throw new Error('There was an error:' + query.error);
                }
                else if(query.code) {
                    console.debug('Authorization Code:', query.code);
                    if( Array.isArray(query.code) ) {
                        this._authorizationCode.next(query.code[0]);
                    }
                    else {
                        const code: string = query.code as string;
                        this._authorizationCode.next(code);
                    }
                    authWindow.removeAllListeners('closed');
                    authWindow.destroy();
                }
            }
        });

        authWindow.webContents.on('did-get-redirect-request', (event, oldUrl, newUrl) => {
            const redirectUrl = parse( newUrl );
            if( redirectUrl.path.includes('webapps/portal') ) {
                // Make the request again.
                console.debug('URL:', url);
                authWindow.loadURL(url);
            }

            const query = parse(newUrl, true).query;
            if(query) {
                if(query.error) {
                    throw new Error('There was an error:' + query.error);
                }
                else if(query.code) {
                    console.debug('Authorization Code:', query.code);
                    if( Array.isArray(query.code) ) {
                        this._authorizationCode.next(query.code[0]);
                    }
                    else {
                        const code: string = query.code as string;
                        this._authorizationCode.next(code);
                    }
                    authWindow.removeAllListeners('closed');
                    authWindow.destroy();
                }
            }
        });

        authWindow.loadURL(url);
    }

    login(url, username, password): Promise<any> {
        return new Promise((resolve, reject) => {
            this.url = url;
            this.username = username;
            this.password = password;
    
            this.getProxyPwd()
            .then((proxyPwd) => {
                this.proxyPwd = proxyPwd;
                return this.initWS();
            })
            .then((xml) => {
                return xml2js(xml);
            })
            .then((js) => {
                console.log(js['soapenv:Envelope']['soapenv:Body'][0]['ns:initializeResponse'][0]['ns:return'][0]);
                this.sessionSecret = js['soapenv:Envelope']['soapenv:Body'][0]['ns:initializeResponse'][0]['ns:return'][0];
            })
            .then(() => {
                return this.soapLogin();
            })
            .then((isLoggedIn) => {
                console.log('User successfully logged in.');
                resolve('User successfully logged in.');
            })
            .catch((error) => {
                console.error('an error occurred.');
                reject(error);
            });
        });
    }

    getProxyPwd(): Promise<any> {
        let headers = new HttpHeaders();
        return this.http.get( this.url + this.apiPath + '/getProxyPwd', { headers: headers } )
        .map( data => {
            return data['pwd'];
        })
        .toPromise();
    }

    initWS(): Promise<string> {

        var now = new Date();
        var created = now.toISOString();
        var expires = (new Date( now.getTime() + (1000*600) ) ).toISOString();

        var sr = '<?xml version="1.0" encoding="utf-8"?>' +
        '<soapenv:Envelope ' +
            'xmlns:ann="http://context.ws.blackboard" ' +
            'xmlns:xsd="http://ws.platform.blackboard/xsd" ' +
            'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">' +
        '<soapenv:Header>' +
        '<wsse:Security soapenv:mustUnderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" ' +
        'xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
        '<wsu:Timestamp wsu:Id="TS-'+created+'">' +
        '<wsu:Created>'+created+'</wsu:Created>' +
        '<wsu:Expires>'+expires+'</wsu:Expires>' +
        '</wsu:Timestamp>' +
        '<wsse:UsernameToken wsu:Id="UsernameToken-'+created+'">' +
        '<wsse:Username>session</wsse:Username>' +
        '<wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">nosession</' +
        'wsse:Password>' +
        '<wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">' +
        'uVoUTT2D3U7YqkhQG99zuw==</wsse:Nonce>' +
        '<wsu:Created>2017-03-21T23:38:09.277Z</wsu:Created>' +
        '</wsse:UsernameToken>' +
        '</wsse:Security>' +
        '</soapenv:Header>' +
            '<soapenv:Body/>' +
        '</soapenv:Envelope>';

        var xhrPromise = new XMLHttpRequestPromise();
        return xhrPromise.send({
            method: 'POST',
            url: this.url + this.path,
            data: sr,
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'initialize'
            }
        })
        .then(function(results) {
            console.log(results);
            if(results.status !== 200) {
                throw new Error('Failed to initialize SOAP WS tool.');
            }
            else {
                return results.responseText;
            }
        })
        .catch(function(e) {
            console.error('XHR Error');
            console.error(e);
        });
    }

    registerTool(): Promise<any> {
        console.log('RegisterTool proxy pwd:', this.proxyPwd);
        var now = new Date();
        var created = now.toISOString();
        var expires = (new Date( now.getTime() + (1000*600) ) ).toISOString();
        var sr =
            '<?xml version="1.0" encoding="utf-8"?>' +
            '<soapenv:Envelope ' +
                'xmlns:con="http://context.ws.blackboard" ' +
                'xmlns:xsd="http://ws.platform.blackboard/xsd" ' +
                'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">' +
            '<soapenv:Header>' +
            '<wsse:Security soapenv:mustUnderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" ' +
            'xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
            '<wsu:Timestamp wsu:Id="TS-'+created+'">' +
            '<wsu:Created>'+created+'</wsu:Created>' +
            '<wsu:Expires>'+expires+'</wsu:Expires>' +
            '</wsu:Timestamp>' +
            '<wsse:UsernameToken wsu:Id="UsernameToken-'+created+'">' +
            '<wsse:Username>session</wsse:Username>' +
            '<wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">'+ this.sessionSecret +'</' +
            'wsse:Password>' +
            '<wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">' +
            'uVoUTT2D3U7YqkhQG99zuw==</wsse:Nonce>' +
            '<wsu:Created>2017-03-21T23:38:09.277Z</wsu:Created>' +
            '</wsse:UsernameToken>' +
            '</wsse:Security>' +
            '</soapenv:Header>' +
                '<soapenv:Body>' +
                    '<con:loginTool>' +
                        '<con:password>'+ this.proxyPwd +'</con:password>' +
                        '<con:clientVendorId>bbc</con:clientVendorId>' +
                        '<con:clientProgramId>bboffline</con:clientProgramId>' +
                        '<con:loginExtraInfo>Blackboard</con:loginExtraInfo>' +
                        '<con:expectedLifeSeconds>60</con:expectedLifeSeconds>' +
                    '</con:loginTool>' +
                '</soapenv:Body>' +
            '</soapenv:Envelope>';

        var xhrPromise = new XMLHttpRequestPromise();
        return xhrPromise.send({
            method: 'POST',
            url: this.url + this.path,
            data: sr,
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'loginTool'
            }
        })
        .then(function(results) {
            console.log(results);
            if(results.status !== 200) {
                throw new Error('Failed to register SOAP WS tool.');
            }
        })
        .catch(function(e) {
            console.error('XHR Error');
            console.error(e);
        });
    }

    soapLogin(): Promise<boolean> {

        var now = new Date();
        var created = now.toISOString();
        var expires = (new Date( now.getTime() + (1000*600) ) ).toISOString();
        var sr =
        '<?xml version="1.0" encoding="utf-8"?>' +
        '<soapenv:Envelope ' +
            'xmlns:con="http://context.ws.blackboard" ' +
            //'xmlns:xsd="http://ws.platform.blackboard/xsd" ' +
            'xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">' +
        '<soapenv:Header>' +
        '<wsse:Security soapenv:mustUnderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" ' +
        'xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">' +
        '<wsu:Timestamp wsu:Id="TS-'+created+'">' +
        '<wsu:Created>'+created+'</wsu:Created>' +
        '<wsu:Expires>'+expires+'</wsu:Expires>' +
        '</wsu:Timestamp>' +
        '<wsse:UsernameToken wsu:Id="UsernameToken-'+created+'">' +
        '<wsse:Username>session</wsse:Username>' +
        '<wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordText">'+ this.sessionSecret +'</' +
        'wsse:Password>' +
        '<wsse:Nonce EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">' +
        'uVoUTT2D3U7YqkhQG99zuw==</wsse:Nonce>' +
        '<wsu:Created>2017-03-21T23:38:09.277Z</wsu:Created>' +
        '</wsse:UsernameToken>' +
        '</wsse:Security>' +
        '</soapenv:Header>' +
            '<soapenv:Body>' +
                '<con:login>' +

                    '<con:userid>'+ this.username +'</con:userid>' +

                    '<con:password>'+ this.password +'</con:password>' +

                    '<con:clientVendorId>bbc</con:clientVendorId>' +

                    '<con:clientProgramId>bboffline</con:clientProgramId>' +

                    '<con:loginExtraInfo>?</con:loginExtraInfo>' +

                    '<con:expectedLifeSeconds>60</con:expectedLifeSeconds>' +
                '</con:login>' +
            '</soapenv:Body>' +
        '</soapenv:Envelope>';

        var xhrPromise = new XMLHttpRequestPromise();
        return xhrPromise.send({
            method: 'POST',
            url: this.url + this.path,
            data: sr,
            headers: {
                'Content-Type': 'text/xml;charset=UTF-8',
                'SOAPAction': 'login'
            }
        })
        .then(function(results) {
            if(results.status !== 200) {
                throw new Error('Invalid username/password.');
            }
            else {
                return true;
            }
        });
    }

    randomString(length) {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for(var i = 0; i < length; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }
}
