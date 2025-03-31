import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { RegisterUser, User } from '../shared/models/user.model';
import { LoggingService } from './logging.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:8000';

  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {}

  register(userData: RegisterUser) {
    return this.http.post(`${this.apiUrl}/register/`, userData);
  }

  checkEmail(email: string): Observable<{ exists: boolean }> {
    return this.http
      .get<{ exists: boolean }>(`${this.apiUrl}/check-email/?email=${email}`)
      .pipe(
        catchError((error) => {
          this.loggingService.error(
            'userService',
            '❌ Ошибка проверки email:',
            error
          );
          return of({ exists: false });
        })
      );
  }

  checkInviteCode(code: string): Observable<{ valid: boolean; used: boolean }> {
    return this.http.get<{ valid: boolean; used: boolean }>(
      `${this.apiUrl}/check-invite/?code=${code}`
    );
  }

  /** ✅ Добавляем токен в заголовок */
  private addToken(headers: HttpHeaders): HttpHeaders {
    const token = sessionStorage.getItem('access_token');
    if (token) {
      this.loggingService.info(
        'userService',
        `🛡️ Adding token to header: ${token}`
      );
      return headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  /** ✅ Получаем профиль пользователя и кэшируем его */
  getUserProfile(): Observable<User | null> {
    let headers = new HttpHeaders();
    headers = this.addToken(headers);

    return this.http
      .get<{
        id: number;
        name: string;
        email: string;
        phoneNumber: string;
        avatar?: string;
      }>(`${this.apiUrl}/profile`, { headers })
      .pipe(
        map((data) => {
          const nameParts = data.name.split(' ');
          const user: User = {
            id: data.id,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: data.email,
            phoneNumber: data.phoneNumber,
            avatar: data.avatar || '',
          };
          return user;
        }),
        tap((user) => {
          this.loggingService.info(
            'userService',
            '🔍 API вернул пользователя:',
            user
          );
          this.userSubject.next(user);
        }),
        catchError((error) => {
          this.loggingService.error(
            'userService',
            '❌ Ошибка загрузки профиля:',
            error
          );
          this.userSubject.next(null);
          return of(null);
        })
      );
  }

  /** ✅ Обновляем профиль и сразу сохраняем изменения */
  updateUserProfile(user: User): Observable<User> {
    let headers = new HttpHeaders();
    headers = this.addToken(headers);

    return this.http
      .put<User>(`${this.apiUrl}/profile`, user, { headers })
      .pipe(
        tap((updatedUser) => this.userSubject.next(updatedUser)),
        catchError((error) => {
          this.loggingService.error(
            'userService',
            'Ошибка обновления профиля:',
            error
          );
          return of(user);
        })
      );
  }

  /** ✅ Очищаем данные пользователя при разлогине */
  clearUserData() {
    this.userSubject.next(null);
  }
}
