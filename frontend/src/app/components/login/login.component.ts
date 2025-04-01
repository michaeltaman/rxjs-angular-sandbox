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
import { UserService } from '../../services/user.service';
import { User } from '../../shared/models/user.model';
import { LoggingService } from '../../services/logging.service';
import { BaseComponent } from '../base.component';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent extends BaseComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  user: User | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    protected override loggingService: LoggingService
  ) {
    super(loggingService);

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loginForm.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.errorMessage = null;
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;

      this.authService
        .login(email, password)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loggingService.info('loginComponent', '✅ Login successful');

            this.userService
              .getUserProfile()
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (profile) => {
                  this.loggingService.info(
                    'loginComponent',
                    '✅ User profile loaded:',
                    profile
                  );
                  this.user = profile;
                  this.router.navigate(['/dashboard']);
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
