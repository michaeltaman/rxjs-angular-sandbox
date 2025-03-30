import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { ProfileAvatarComponent } from './components/profile-avatar/profile-avatar.component';
import { MobileProfileHeaderComponent } from './components/mobile-profile-header/mobile-profile-header.component';
import { UserService } from './services/user.service';
import { LoggingService } from './services/logging.service';

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
export class AppComponent implements OnInit {
  title = 'rxjs-angular-sandbox';
  isMenuOpen = false;
  isDarkMode = false;
  user: any = null;
  isAuthenticated = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    this.loggingService.log('appComponent', '🚀 Приложение загружается...');
    this.authService.restoreSession();

    // ✅ Подписываемся на статус авторизации
    this.authService.authStatus$.subscribe((isAuth) => {
      this.loggingService.log(
        'appComponent',
        '🔒 Статус авторизации изменён:',
        isAuth
      );
      this.isAuthenticated = isAuth;

      if (isAuth) {
        this.loggingService.log(
          'appComponent',
          '✅ Пользователь авторизован — пробуем получить профиль...'
        );
        this.userService.getUserProfile().subscribe({
          next: (profile) => {
            this.loggingService.log(
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

        // ✅ Запускаем обновление токена только после успешной авторизации
        this.authService.startInactivityTimer();
      } else {
        this.loggingService.warn(
          'appComponent',
          '⚠️ Пользователь не авторизован'
        );
      }
    });

    // ✅ Слушатель на любое действие пользователя
    document.addEventListener('click', () => {
      if (this.isAuthenticated) {
        this.authService.handleUserAction().subscribe({
          next: () => {
            this.loggingService.log(
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
    });
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
      this.loggingService.log(
        'appComponent',
        '🖱️ User action detected — checking token...'
      );
      this.authService.handleUserAction().subscribe({
        next: () => {
          this.loggingService.log('appComponent', '✅ Token check complete');
          this.userService.getUserProfile().subscribe({
            next: (profile) => {
              this.loggingService.log(
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
    this.loggingService.log('appComponent', '🚪 Выход из системы...');
    this.authService.logout();
    this.router.navigate(['/login']);
    this.closeMenu();
  }
}
