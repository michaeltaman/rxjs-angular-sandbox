import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { LoggingService } from './logging.service';

@Injectable({ providedIn: 'root' })
export class TokenService {
  private accessTokenLiveTime: number | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private http: HttpClient, private logging: LoggingService) {}

  getAccessToken(): string | null {
    return sessionStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return sessionStorage.getItem('refresh_token');
  }

  saveTokens(access: string, refresh: string): void {
    sessionStorage.setItem('access_token', access);
    sessionStorage.setItem('refresh_token', refresh);
    this.logging.info('tokenService', '✅ Tokens saved in sessionStorage', {
      access,
      refresh,
    });

    const payload = JSON.parse(atob(access.split('.')[1]));
    if (payload.exp) {
      this.accessTokenLiveTime = payload.exp * 1000 - Date.now();
      this.logging.info(
        'tokenService',
        `⏳ Время жизни токена: ${this.accessTokenLiveTime / 1000} сек`
      );
      this.startTokenRefresh();
    }
  }

  clearTokens(): void {
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    this.logging.info('tokenService', '🧹 Токены удалены из sessionStorage');

    if (this.refreshTimer !== null) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
      this.logging.info(
        'tokenService',
        '⏹️ Остановлен таймер обновления токена'
      );
    }
  }

  isTokenExpired(): boolean {
    const token = this.getAccessToken();
    if (!token) return true;
    const jwtPayload = JSON.parse(atob(token.split('.')[1]));
    const exp = jwtPayload.exp * 1000;
    const now = Date.now();
    return exp - now <= 5000;
  }

  getTokenLifetime(): number | null {
    return this.accessTokenLiveTime;
  }

  setTokenLifetime(lifetime: number): void {
    this.accessTokenLiveTime = lifetime;
    this.logging.info(
      'tokenService',
      `🕐 Установлено время жизни токена вручную: ${lifetime / 1000} сек`
    );
  }

  refreshToken(): Observable<{ access_token: string; refresh_token: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      this.logging.warn('tokenService', '⚠️ Refresh token отсутствует');
      return throwError(() => new Error('Refresh token отсутствует'));
    }

    this.logging.info('tokenService', '🔄 Обновление токена...');
    return this.http.post<{ access_token: string; refresh_token: string }>(
      `${window.env.appConfig?.API_URL}/refresh-token`,
      { refresh_token: refreshToken }
    );
  }

  private calculateRefreshInterval(): number | null {
    const tokenLifetime = this.accessTokenLiveTime;

    if (
      window.env.authConfig?.refresh_active_token_interval === undefined ||
      tokenLifetime === null
    ) {
      this.logging.warn(
        'tokenService',
        '⚠️ Значения window.env.refresh_active_token_interval или tokenLifetime неверные'
      );
      return null;
    }

    const refreshInterval = Number(
      window.env.authConfig?.refresh_active_token_interval
    );

    this.logging.info(
      'tokenService',
      `🛡️ tokenLifetime = ${tokenLifetime / 1000} сек`
    );
    this.logging.info(
      'tokenService',
      `🛡️ refreshInterval = ${refreshInterval} сек`
    );

    if (refreshInterval <= 0) {
      this.logging.warn('tokenService', `⚠️ refreshInterval <= 0`);
      return null;
    }

    if (refreshInterval > tokenLifetime / 1000) {
      this.logging.warn(
        'tokenService',
        `🛡️ ⚠️ refreshInterval (${refreshInterval}) > tokenLifetime (${
          tokenLifetime / 1000
        }) — обновление будет через интерцептор`
      );
      return null;
    }

    this.logging.info(
      'tokenService',
      `🛡️ ✅ Токен будет обновлён через ${refreshInterval} секунд`
    );
    return refreshInterval;
  }

  startTokenRefresh(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.logging.info(
        'tokenService',
        '⏳ Старый таймер обновления удалён перед установкой нового'
      );
    }

    const refreshInterval = this.calculateRefreshInterval();

    if (
      refreshInterval !== null &&
      refreshInterval > 0 &&
      this.accessTokenLiveTime !== null &&
      refreshInterval < this.accessTokenLiveTime
    ) {
      this.refreshTimer = setTimeout(() => {
        // 💡 Вот сюда добавляем лог перед subscribe()
        this.logging.info(
          'tokenService',
          '🔁 ⏰ Таймер сработал — пробуем обновить токен...'
        );

        this.refreshToken().subscribe({
          next: (tokens) => {
            this.logging.info(
              'tokenService',
              '✅ Токен успешно обновлён по таймеру'
            );
            this.saveTokens(tokens.access_token, tokens.refresh_token);
          },
          error: (err) => {
            this.logging.error(
              'tokenService',
              '❌ Ошибка обновления токена по таймеру:',
              err
            );
          },
        });
      }, refreshInterval * 1000);

      this.logging.info(
        'tokenService',
        `🛡️ Установлен новый таймер обновления токена на ${refreshInterval} секунд`
      );
    } else if (this.accessTokenLiveTime && this.accessTokenLiveTime < 0) {
      this.logging.warn(
        'tokenService',
        `⚠️ Отрицательное время жизни токена (${
          this.accessTokenLiveTime / 1000
        }) — обновление будет выполнено через интерцептор`
      );
    }
  }
}
