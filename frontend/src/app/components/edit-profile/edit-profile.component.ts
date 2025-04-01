import { Component, OnInit } from '@angular/core';
import { BaseComponent } from '../base.component';
import { LoggingService } from '../../services/logging.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent extends BaseComponent implements OnInit {
  profileForm: FormGroup;
  user: any = null;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute,
    protected override loggingService: LoggingService
  ) {
    super(loggingService);
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit(): void {
    this.loggingService.info(
      'editProfileComponent',
      '🧾 Инициализация компонента редактирования профиля'
    );

    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.loggingService.info(
          'editProfileComponent',
          '📦 Параметры из URL:',
          params
        );
        this.profileForm.patchValue({
          firstName: params['firstName'] || '',
          lastName: params['lastName'] || '',
          email: params['email'] || '',
        });
      });

    this.userService
      .getUserProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        if (!this.profileForm.value.firstName && user) {
          this.loggingService.info(
            'editProfileComponent',
            '👤 Профиль пользователя загружен из сервиса:',
            user
          );
          this.profileForm.patchValue(user);
        }
      });
  }

  onSubmit(): void {
    if (this.profileForm.valid) {
      this.loggingService.info(
        'editProfileComponent',
        '💾 Сохраняем профиль:',
        this.profileForm.value
      );
      this.userService
        .updateUserProfile(this.profileForm.value)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.loggingService.info(
            'editProfileComponent',
            '✅ Профиль обновлён. Переход к /profile'
          );
          this.router.navigate(['/profile']);
        });
    } else {
      this.loggingService.warn(
        'editProfileComponent',
        '⚠️ Форма недействительна — сохранение отменено'
      );
    }
  }
}
