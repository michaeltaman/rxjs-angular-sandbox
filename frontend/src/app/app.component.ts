import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { RouterOutlet, RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ActivityService } from './services/activity.service';
import { CommonModule } from '@angular/common';
import { ProfileAvatarComponent } from './components/profile-avatar/profile-avatar.component';
import { MobileProfileHeaderComponent } from './components/mobile-profile-header/mobile-profile-header.component';
import { UserService } from './services/user.service';
import { LoggingService } from './services/logging.service';
import { BaseComponent } from '../app/components/base.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    RouterOutlet,
    RouterModule,
    CommonModule,
    ProfileAvatarComponent,
    MobileProfileHeaderComponent,
  ],
})
export class AppComponent extends BaseComponent implements OnInit {
  title = 'rxjs-angular-sandbox';
  isMenuOpen = false;
  isDarkMode = false;
  user: any = null;
  isAuthenticated = false;

  constructor(
    private authService: AuthService,
    private activityService: ActivityService,
    private router: Router,
    private userService: UserService,
    protected override loggingService: LoggingService
  ) {
    super(loggingService);
  }

  ngOnInit(): void {
    this.loggingService.info('appComponent', '🚀 Приложение загружается...');
    this.authService.restoreSession();

    this.authService.authStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isAuth) => {
        this.loggingService.info(
          'appComponent',
          '🔒 Статус авторизации изменён:',
          isAuth
        );
        this.isAuthenticated = isAuth;

        if (isAuth) {
          this.loggingService.info(
            'appComponent',
            '✅ Пользователь авторизован — пробуем получить профиль...'
          );
          this.userService
            .getUserProfile()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (profile) => {
                this.loggingService.info(
                  'appComponent',
                  '✅ Профиль загружен:',
                  profile
                );
                this.user = profile;
              },
              error: (err) => {
                this.loggingService.error(
                  'appComponent',
                  '❌ Ошибка при получении профиля:',
                  err
                );
              },
            });
        } else {
          this.loggingService.warn(
            'appComponent',
            '⚠️ Пользователь не авторизован'
          );
        }
      });

    document.addEventListener('click', this.onClickBound);
  }

  private onClickBound = () => {
    if (this.isAuthenticated) {
      this.authService
        .handleUserAction()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loggingService.info(
              'appComponent',
              '✅ Token checked on user action'
            );
          },
          error: (err) => {
            this.loggingService.error(
              'appComponent',
              '❌ Error handling user action:',
              err
            );
          },
        });
    }
  };

  override ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    document.removeEventListener('click', this.onClickBound);
    this.loggingService.info('AppComponent', '🧹 Очистка событий при выходе');
    super.ngOnDestroy();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-theme', this.isDarkMode);
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  getActiveClass(route: string): string {
    return this.router.url === route ? 'active-link' : '';
  }

  onUserAction(): void {
    if (this.isAuthenticated) {
      this.loggingService.info(
        'appComponent',
        '🖱️ User action detected — checking token...'
      );
      this.authService
        .handleUserAction()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loggingService.info('appComponent', '✅ Token check complete');
            this.userService
              .getUserProfile()
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (profile) => {
                  this.loggingService.info(
                    'appComponent',
                    '✅ Профиль загружен:',
                    profile
                  );
                },
                error: (err) => {
                  this.loggingService.error(
                    'appComponent',
                    '❌ Ошибка при получении профиля:',
                    err
                  );
                },
              });
          },
          error: (err) =>
            this.loggingService.error(
              'appComponent',
              '❌ Error during token check:',
              err
            ),
        });
    }
  }

  logout(): void {
    this.loggingService.info('appComponent', '🚪 Выход из системы...');
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closeMenu();
  }
}
