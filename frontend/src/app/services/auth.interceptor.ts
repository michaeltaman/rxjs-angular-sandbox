import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, catchError, switchMap, throwError } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(private authService: AuthService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = sessionStorage.getItem('access_token');

    if (token) {
      const clonedRequest = this.addToken(req, token);
      return next.handle(clonedRequest);
    }

    return next.handle(req).pipe(
      catchError((error) => {
        if (error.status === 401 && !this.isRefreshing) {
          this.isRefreshing = true;
          console.warn('🔄 Token expired — refreshing...');

          return this.authService.refreshToken().pipe(
            switchMap(() => {
              const newAccessToken = sessionStorage.getItem('access_token');
              if (newAccessToken) {
                console.log('✅ Token refreshed:', newAccessToken);
                const refreshedRequest = this.addToken(req, newAccessToken);
                this.isRefreshing = false;
                return next.handle(refreshedRequest);
              }
              this.isRefreshing = false;
              return throwError(() => new Error('No token after refresh'));
            }),
            catchError((refreshError) => {
              console.error('❌ Error refreshing token:', refreshError);
              this.isRefreshing = false;
              this.authService.logout();
              return throwError(() => refreshError);
            })
          );
        }

        return throwError(() => error);
      })
    );
  }

  private addToken(req: HttpRequest<any>, token: string) {
    console.log(`🛡️ Adding token to header: ${token}`);
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
