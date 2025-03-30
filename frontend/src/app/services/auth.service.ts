import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, filter, map, take, tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoggingService } from './logging.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private authStatusSubject = new BehaviorSubject<boolean>(false);
  authStatus$ = this.authStatusSubject.asObservable();
  private refreshInterval: ReturnType<typeof setInterval> | null = null;
  private INACTIVITY_ENABLED =
    window.env.authConfig?.logout_inactivity ?? false; //see README_auth.service.md
  private inactivityTimer!: ReturnType<typeof setTimeout>;
  private TOKEN_REFRESH_OFFSET_MS = 30000; //see README_auth.service.md
  private accessTokenLiveTime: number | null = null;

  private tokenLifetimeSubject = new BehaviorSubject<number | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
    private loggingService: LoggingService
  ) {}

  login(email: string, password: string): Observable<string> {
    this.loggingService.log('authService', `🔑 Вход пользователя: ${email}`);
    return this.http
      .post<{ access_token: string; refresh_token: string }>(
        `${window.env.appConfig?.API_URL}/login`,
        { email, password }
      )
      .pipe(
        map((response) => {
          sessionStorage.setItem('access_token', response.access_token);
          sessionStorage.setItem('refresh_token', response.refresh_token);
          this.authStatusSubject.next(true);

          // ✅ Извлекаем время жизни токена
          const jwtPayload = JSON.parse(
            atob(response.access_token.split('.')[1])
          );
          if (jwtPayload.exp) {
            this.accessTokenLiveTime = jwtPayload.exp * 1000 - Date.now();
            this.loggingService.log(
              'authService',
              `✅ Время жизни токена установлено на ${
                this.accessTokenLiveTime / 1000
              } секунд`
            );

            // ✅ Устанавливаем токен и запускаем обновление
            this.tokenLifetimeSubject.next(this.accessTokenLiveTime);
            this.startTokenRefresh();
          }

          this.startInactivityTimer(); // ✅ Стартуем таймер неактивности
          this.loggingService.log(
            'authService',
            '✅ Tokens saved in sessionStorage:',
            response
          );

          return response.access_token;
        }),
        catchError((error) => {
          this.loggingService.error('authService', '❌ Login error:', error);
          return throwError(() => error);
        })
      );
  }

  refreshToken(): Observable<string> {
    const refreshToken = sessionStorage.getItem('refresh_token');
    if (!refreshToken) {
      this.loggingService.warn('authService', '⚠️ Refresh token отсутствует');
      this.logout();
      return throwError(() => new Error('Refresh token отсутствует'));
    }

    this.loggingService.log(
      'authService',
      '🔄 Выполняется обновление токена...'
    );
    return this.http
      .post<{ access_token: string; refresh_token: string }>(
        `${window.env.appConfig?.API_URL}/refresh-token`,
        { refresh_token: refreshToken }
      )
      .pipe(
        tap((tokens) => {
          this.loggingService.log(
            'authService',
            '✅ Tokens saved in sessionStorage',
            tokens
          );

          sessionStorage.setItem('access_token', tokens.access_token);
          sessionStorage.setItem('refresh_token', tokens.refresh_token);

          const jwtPayload = JSON.parse(
            atob(tokens.access_token.split('.')[1])
          );
          if (jwtPayload.exp) {
            this.accessTokenLiveTime = jwtPayload.exp * 1000 - Date.now();

            this.loggingService.log(
              'authService',
              `✅ Tokens saved in sessionStorage: ${
                this.accessTokenLiveTime / 1000
              } секунд`
            );

            // ✅ Устанавливаем новое время жизни токена
            this.tokenLifetimeSubject.next(this.accessTokenLiveTime);
            this.startTokenRefresh(); // ✅ Перезапускаем таймер
          }
        }),
        map((tokens) => tokens.access_token),
        catchError((error) => {
          this.loggingService.error(
            'authService',
            '❌ Error refreshing token:',
            error
          );
          this.logout();
          return throwError(() => error);
        })
      );
  }

  private calculateRefreshInterval(): number | null {
    const tokenLifetime = this.accessTokenLiveTime;

    /*
    console.log(`XXX tokenLifetime = ${tokenLifetime}`);
    console.log(
      `XXX window.env.authConfig?.refresh_active_token_interval = ${window.env.authConfig?.refresh_active_token_interval}`
    );
    */

    if (
      window.env.authConfig?.refresh_active_token_interval === undefined ||
      tokenLifetime === null
    ) {
      this.loggingService.warn(
        'authService',
        '⚠️ Значения window.env.refresh_active_token_interval или tokenLifetime неверные'
      );
      return null;
    }

    const refreshInterval = Number(
      window.env.authConfig?.refresh_active_token_interval
    );

    this.loggingService.log(
      'authService',
      `🛡️ tokenLifetime =  ${tokenLifetime / 1000} секунд`
    );

    this.loggingService.log(
      'authService',
      `🛡️ refreshInterval =  ${refreshInterval} `
    );

    // ✅ Проверка на отрицательные значения
    if (refreshInterval <= 0) {
      this.loggingService.warn('authService', `⚠️ refreshInterval <= 0`);
      return null;
    }

    // ✅ Если интервал больше времени жизни токена — обновление через интерцептор
    if (refreshInterval > tokenLifetime / 1000) {
      this.loggingService.warn(
        'authService',
        `🛡️ ⚠️ Поскольку время жизни токена ${
          tokenLifetime / 1000
        } секунд меньше переменной refresh_active_token_interval = ${
          window.env.authConfig?.refresh_active_token_interval
        } секунд — обновление произойдёт через интерцептор при HTTP-запросе`
      );
      return null;
    }

    this.loggingService.log(
      'authService',
      `🛡️ ✅ Токен будет ратирован через интервал = ${refreshInterval} секунд`
    );
    return refreshInterval;
  }

  setTokenLifetime(tokenLifetime: number) {
    this.accessTokenLiveTime = tokenLifetime;
    this.tokenLifetimeSubject.next(tokenLifetime);
  }

  startTokenRefresh(): void {
    if (this.refreshInterval) {
      clearTimeout(this.refreshInterval);
      this.loggingService.log(
        'authService',
        '⏳ Старый таймер удалён перед установкой нового'
      );
    }

    const refreshInterval = this.calculateRefreshInterval();

    if (
      refreshInterval !== null &&
      refreshInterval > 0 &&
      this.accessTokenLiveTime !== null &&
      refreshInterval < this.accessTokenLiveTime
    ) {
      this.refreshInterval = setTimeout(() => {
        this.refreshToken().subscribe();
      }, refreshInterval * 1000);
      this.loggingService.log(
        'authService',
        `🛡️ Установлен новый таймер на ${refreshInterval} секунд`
      );
    } else if (this.accessTokenLiveTime && this.accessTokenLiveTime < 0) {
      this.loggingService.warn(
        'authService',
        `⚠️ Время жизни токена отрицательное (${
          this.accessTokenLiveTime / 1000
        } секунд) — обновление произойдёт через интерцептор`
      );
    }
  }

  public startInactivityTimer(): void {
    if (!this.authStatusSubject.value) return; // ✅ Только если пользователь авторизован

    // ✅ Проверяем, включён ли таймер неактивности
    if (!this.INACTIVITY_ENABLED) {
      this.loggingService.log(
        'authService',
        '🚫 Таймер неактивности отключён настройками'
      );
      return;
    }

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    const inactivityTimeout =
      window.env.authConfig?.logout_time != null &&
      window.env.authConfig?.logout_time !== 0
        ? window.env.authConfig?.logout_time
        : 5 * 60; // ✅ По умолчанию 5 минут

    this.loggingService.log(
      'authService',
      `⏳ Таймер неактивности установлен на ${inactivityTimeout} секунд (${(
        inactivityTimeout / 60
      ).toFixed(1)} минут)`
    );

    this.inactivityTimer = setTimeout(() => {
      this.loggingService.warn(
        'authService',
        `⚠️ Пользователь неактивен в течение ${
          inactivityTimeout / 60
        } минут — выполняем logout...`
      );
      this.logout(); // ✅ Выполняем логаут
    }, inactivityTimeout * 1000);
  }

  public handleUserAction(): Observable<void> {
    if (this.isTokenExpired()) {
      this.loggingService.warn(
        'authService',
        '🔔 Token close to expiration — refreshing...'
      );
      return this.refreshToken().pipe(map(() => {}));
    }
    return of(void 0);
  }

  public isTokenExpired(): boolean {
    const token = sessionStorage.getItem('access_token');
    if (!token) return true;

    const jwtPayload = JSON.parse(atob(token.split('.')[1]));
    const exp = jwtPayload.exp * 1000;
    const now = Date.now();

    return exp - now <= 5000; // ✅ Считаем токен истёкшим за 5 секунд до фактического истечения
  }

  public logout(): void {
    this.loggingService.log('authService', '🚪 Logging out...');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    this.authStatusSubject.next(false);

    if (this.refreshInterval !== null) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.router.navigate(['/login']);
  }

  public restoreSession(): void {
    const accessToken = sessionStorage.getItem('access_token');
    if (accessToken) {
      this.loggingService.log(
        'authService',
        '🔑 Restoring session with token:',
        accessToken
      );

      this.authStatusSubject.next(true);

      const jwtPayload = JSON.parse(atob(accessToken.split('.')[1]));
      if (jwtPayload.exp) {
        this.accessTokenLiveTime = jwtPayload.exp * 1000 - Date.now();
        this.tokenLifetimeSubject.next(this.accessTokenLiveTime);

        // ✅ Запускаем таймер обновления токена
        this.startTokenRefresh();
      }
    }
  }
}
