import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { TokenService } from './token.service';
import { ActivityService } from './activity.service';
import { LoggingService } from './logging.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authStatusSubject = new BehaviorSubject<boolean>(false);
  authStatus$ = this.authStatusSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private logging: LoggingService,
    private tokenService: TokenService,
    private activityService: ActivityService
  ) {}

  login(email: string, password: string): Observable<string> {
    this.logging.info('authService', `🔑 Вход пользователя: ${email}`);
    return this.http
      .post<{ access_token: string; refresh_token: string }>(
        `${window.env.appConfig?.API_URL}/login`,
        { email, password }
      )
      .pipe(
        tap((tokens) => {
          this.tokenService.saveTokens(
            tokens.access_token,
            tokens.refresh_token
          );
          this.authStatusSubject.next(true);
          this.activityService.startInactivityTimer(() => this.logout());
        }),
        map((tokens) => tokens.access_token),
        catchError((error) => {
          this.logging.error('authService', '❌ Login error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    this.logging.info('authService', '🚪 Logout...');
    this.tokenService.clearTokens();
    this.authStatusSubject.next(false);
    this.activityService.clearTimer();
    this.router.navigate(['/login']);
  }

  restoreSession(): void {
    const accessToken = this.tokenService.getAccessToken();
    if (accessToken) {
      this.logging.info('authService', '🔑 Восстановление сессии');
      this.authStatusSubject.next(true);

      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      if (payload.exp) {
        const lifetime = payload.exp * 1000 - Date.now();
        this.tokenService.setTokenLifetime(lifetime);
        this.tokenService.startTokenRefresh();
      }

      this.activityService.startInactivityTimer(() => this.logout());
    }
  }

  handleUserAction(): Observable<void> {
    if (this.tokenService.isTokenExpired()) {
      this.logging.warn(
        'authService',
        '🔔 Token близок к истечению — обновляем...'
      );
      return this.tokenService.refreshToken().pipe(
        tap((tokens) =>
          this.tokenService.saveTokens(
            tokens.access_token,
            tokens.refresh_token
          )
        ),
        map(() => {})
      );
    }
    return of(void 0);
  }
}
