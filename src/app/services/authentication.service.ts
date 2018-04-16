import { Injectable } from '@angular/core';
import { Token, UserToken } from '../model/model';

const Store = window.require('electron-store');
const store = new Store();

@Injectable()
export class AuthService {

    public getToken(): Token {
        let token: Token = store.get('bbRestToken');
        return token;
    }

    public getUserToken(): UserToken {
        let token: UserToken = store.get('bbUserToken');
        return token;
    }

    public isAuthenticated(): boolean {
        // get the token
        const token: Token = this.getToken();
        // return a boolean reflecting 
        // whether or not the token is expired
        return this.tokenNotExpired(token);
    }

    public isUserAuthenticated(): boolean {
        // get the token
        const token: Token = this.getUserToken();
        // return a boolean reflecting 
        // whether or not the token is expired
        return this.tokenNotExpired(token);
    }

    tokenNotExpired(token: Token) {
        const now: Date = new Date();
        if( token && token.access_token && now.getTime() < token.expires.getTime() ) {
            return true;
        }
        else {
            return false;
        }
    }
}