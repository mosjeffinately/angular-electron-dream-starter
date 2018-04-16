import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpHeaders, HttpParams, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { Token } from '../model/model';
import { AuthService } from '../services/authentication.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {
    token: Token
    
    constructor(private auth: AuthService) {}
  
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let headers: HttpHeaders = new HttpHeaders();
        
        if( request.headers.has('Enable-Bb-Bearer-Token') ) {
            headers = headers.append('Authorization', 'Bearer ' + this.auth.getToken().access_token);
            request = request.clone({
                headers: headers
            });
        }
        else if( request.headers.has('Enable-Bb-User-Bearer-Token') ) {
            headers = headers.append('Authorization', 'Bearer ' + this.auth.getUserToken().access_token);
            request = request.clone({
                headers: headers
            });
        }
        return next.handle(request);
    }
}