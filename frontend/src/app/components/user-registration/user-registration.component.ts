import {
  Component,
  ViewEncapsulation,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  BehaviorSubject,
  timer,
  switchMap,
  tap,
  filter,
  takeUntil,
} from 'rxjs';
import { RoundSpinnerComponent } from '../../shared/round-spinner/round-spinner.component';
import { UserService } from '../../services/user.service';
import { RegisterUser } from '../../shared/models/user.model';
import { LoggingService } from '../../services/logging.service';
import { BaseComponent } from '../base.component';

@Component({
  selector: 'app-user-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RoundSpinnerComponent],
  templateUrl: './user-registration.component.html',
  styleUrls: ['./user-registration.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class UserRegistrationComponent extends BaseComponent implements OnInit {
  registrationForm: FormGroup;
  passwordMismatch: boolean = false;
  emailExists = false;
  isCheckingEmail = false;
  isCheckingInvite = false;
  inviteCodeUsed = false;
  inviteCodeEnabled = false;
  inviteCodeInvalid = false;

  private messageSubject = new BehaviorSubject<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);
  message$ = this.messageSubject.asObservable();

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    protected override loggingService: LoggingService
  ) {
    super(loggingService);

    this.registrationForm = this.fb.group({
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(15),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(15),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [Validators.required, Validators.minLength(8), this.passwordValidator],
      ],
      confirmPassword: ['', Validators.required],
      inviteCode: new FormControl({ value: '', disabled: true }),
    });

    this.registrationForm
      .get('email')
      ?.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => (this.isCheckingEmail = true)),
        switchMap((email) =>
          this.userService
            .checkEmail(email)
            .pipe(tap(() => (this.isCheckingEmail = false)))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        this.emailExists = response.exists;
      });

    this.registrationForm
      .get('confirmPassword')
      ?.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        map((value) => value !== this.registrationForm.get('password')?.value),
        takeUntil(this.destroy$)
      )
      .subscribe((isMismatch) => {
        this.passwordMismatch = isMismatch;
      });

    this.registrationForm
      .get('inviteCode')
      ?.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        filter((code) => code && code.trim() !== ''),
        tap(() => {
          this.isCheckingInvite = true;
          this.inviteCodeInvalid = false;
          this.inviteCodeUsed = false;
          this.registrationForm.get('inviteCode')?.updateValueAndValidity();
        }),
        switchMap((code) =>
          this.userService
            .checkInviteCode(code)
            .pipe(tap(() => (this.isCheckingInvite = false)))
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((response) => {
        if (!response.valid) this.inviteCodeInvalid = true;
        else if (response.used) this.inviteCodeUsed = true;
        this.registrationForm.get('inviteCode')?.updateValueAndValidity();
      });
  }

  ngOnInit() {
    this.isCheckingEmail = true;
    this.isCheckingInvite = true;
    this.message$.pipe(takeUntil(this.destroy$)).subscribe((msg) => {
      this.loggingService.info(
        'userRegistrationComponent',
        '🔄 Обновление UI:',
        msg
      );
      this.cdr.detectChanges();
    });
  }

  passwordValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const password = control.value;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*]/.test(password);
    const hasNumber = /\d/.test(password);
    return hasUpperCase && hasSpecialChar && hasNumber
      ? null
      : { passwordStrength: true };
  }

  toggleInviteCode(event: any) {
    this.inviteCodeEnabled = event.target.checked;
    const inviteCodeControl = this.registrationForm.get('inviteCode');
    if (this.inviteCodeEnabled) {
      inviteCodeControl?.enable({ emitEvent: false });
      inviteCodeControl?.setValidators([Validators.required]);
    } else {
      inviteCodeControl?.setValue('');
      inviteCodeControl?.clearValidators();
      inviteCodeControl?.disable({ emitEvent: false });
      this.inviteCodeUsed = false;
      this.inviteCodeInvalid = false;
    }
    inviteCodeControl?.updateValueAndValidity({ emitEvent: false });
  }

  onSubmit() {
    if (this.registrationForm.valid && !this.passwordMismatch) {
      const formData: RegisterUser = {
        firstName: this.registrationForm.value.firstName,
        lastName: this.registrationForm.value.lastName,
        email: this.registrationForm.value.email,
        password: this.registrationForm.value.password,
        invite_code: this.registrationForm.value.inviteCode || null,
      };

      const payload = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`,
      };

      this.userService
        .register(payload)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.loggingService.info(
              'userRegistrationComponent',
              '✅ Регистрация успешна:',
              response
            );
            this.showMessage('✅ Пользователь зарегистрирован!', 'success');
            this.registrationForm.reset();
          },
          error: (err) => {
            this.loggingService.error(
              'userRegistrationComponent',
              '❌ Ошибка регистрации:',
              err
            );
            const errorMessage = err.error?.detail
              ? Array.isArray(err.error.detail)
                ? err.error.detail.map((e: any) => e.msg).join(', ')
                : err.error.detail
              : 'Ошибка сервера';
            this.showMessage(`❌ Ошибка регистрации: ${errorMessage}`, 'error');
          },
        });
    } else {
      this.showMessage('⚠️ Проверьте форму, есть ошибки!', 'error');
    }
  }

  private showMessage(text: string, type: 'success' | 'error') {
    this.loggingService.info(
      'userRegistrationComponent',
      `🔔 showMessage() вызван с текстом: ${text}, тип: ${type}`
    );
    this.messageSubject.next({ text, type });
    this.cdr.detectChanges();

    timer(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loggingService.info(
          'userRegistrationComponent',
          '⏳ Очистка сообщения через 5 секунд'
        );
        this.messageSubject.next(null);
        this.cdr.detectChanges();
      });
  }
}
