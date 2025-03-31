import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { map, of } from 'rxjs';
import { LoggingService } from './logging.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const loggingService = inject(LoggingService);
  const router = inject(Router);

  return authService.authStatus$.pipe(
    map((isAuthenticated) => {
      if (isAuthenticated) {
        loggingService.info('authGuard', '✅ User is authenticated');
        return true;
      } else {
        loggingService.warn('authGuard', '⚠️ User is NOT authenticated');
        router.navigate(['/login']); // ✅ Перенаправление на логин
        return false;
      }
    })
  );
};
