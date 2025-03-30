import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service'; // ✅ Добавляем UserService
import { User } from '../../shared/models/user.model';
import { LoggingService } from '../../services/logging.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  user: User | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService, // ✅ Добавляем userService
    private router: Router,
    private loggingService: LoggingService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.loginForm.valueChanges.subscribe(() => {
      this.errorMessage = null;
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      this.authService.login(email, password).subscribe({
        next: () => {
          this.loggingService.log('loginComponent', '✅ Login successful');

          // ✅ Получаем профиль после успешного логина
          this.userService.getUserProfile().subscribe({
            next: (profile) => {
              this.loggingService.log(
                'loginComponent',
                '✅ User profile loaded:',
                profile
              );
              this.user = profile;
              this.router.navigate(['/dashboard']); // ✅ Перенаправляем после успешного получения профиля
            },
            error: (err) => {
              this.loggingService.error(
                'loginComponent',
                '❌ Error loading profile:',
                err
              );
              this.errorMessage = 'Ошибка при загрузке профиля';
            },
          });
        },
        error: (err) => {
          this.loggingService.error('loginComponent', '❌ Login error:', err);
          this.errorMessage = 'Неверные учетные данные';
        },
      });
    }
  }
}
