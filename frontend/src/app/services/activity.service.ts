import { Injectable } from '@angular/core';
import { LoggingService } from './logging.service';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class ActivityService {
  private inactivityTimer!: ReturnType<typeof setTimeout>;

  constructor(private logging: LoggingService, private router: Router) {}

  startInactivityTimer(logoutCallback: () => void): void {
    const INACTIVITY_ENABLED =
      window.env.authConfig?.logout_inactivity ?? false;
    if (!INACTIVITY_ENABLED) {
      this.logging.info(
        'activityService',
        '🚫 Таймер неактивности отключён настройками'
      );
      return;
    }

    const inactivityTimeout =
      window.env.authConfig?.logout_time != null &&
      window.env.authConfig?.logout_time !== 0
        ? window.env.authConfig?.logout_time
        : 5 * 60;

    this.clearTimer();

    this.logging.info(
      'activityService',
      `⏳ Таймер неактивности установлен на ${inactivityTimeout} секунд (${(
        inactivityTimeout / 60
      ).toFixed(1)} минут)`
    );

    this.inactivityTimer = setTimeout(() => {
      this.logging.warn(
        'activityService',
        `⚠️ Пользователь неактивен ${inactivityTimeout / 60} мин — logout`
      );
      logoutCallback();
    }, inactivityTimeout * 1000);
  }

  clearTimer(): void {
    if (this.inactivityTimer) clearTimeout(this.inactivityTimer);
  }
}
