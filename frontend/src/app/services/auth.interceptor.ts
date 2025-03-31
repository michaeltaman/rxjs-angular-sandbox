import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { LoggingService } from './logging.service';
import { Observable, catchError, switchMap, throwError, of } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(
    private authService: AuthService,
    private tokenService: TokenService,
    private logging: LoggingService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.tokenService.getAccessToken();

    const clonedRequest = token ? this.addToken(req, token) : req;

    return next.handle(clonedRequest).pipe(
      catchError((error) => {
        if (error.status === 401 && !this.isRefreshing) {
          this.isRefreshing = true;
          console.warn('🔄 Token expired — refreshing...');

          return this.authService
            .handleUserAction() // ⚠️ обновлённый метод — обёртка для refresh
            .pipe(
              switchMap(() => {
                const newAccessToken = this.tokenService.getAccessToken();
                if (newAccessToken) {
                  this.logging.info(
                    'authInterceptor',
                    '✅ Token refreshed:',
                    newAccessToken
                  );
                  const refreshedRequest = this.addToken(req, newAccessToken);
                  this.isRefreshing = false;
                  return next.handle(refreshedRequest);
                }
                this.isRefreshing = false;
                return throwError(() => new Error('No token after refresh'));
              }),
              catchError((refreshError) => {
                this.logging.error(
                  'authInterceptor',
                  '❌ Error refreshing token:',
                  refreshError
                );
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

  private addToken(req: HttpRequest<any>, token: string): HttpRequest<any> {
    this.logging.info('authInterceptor', `🛡️ Adding token to header`);
    return req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}
