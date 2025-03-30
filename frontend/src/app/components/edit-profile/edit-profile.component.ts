import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-edit-profile',
  standalone: true, // ✅ Указываем, что компонент работает без модуля
  imports: [ReactiveFormsModule, CommonModule], // ✅ Добавляем модули
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.scss'],
})
export class EditProfileComponent implements OnInit {
  profileForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
    });
  }

  ngOnInit() {
    // ✅ Загружаем данные из queryParams
    this.route.queryParams.subscribe((params) => {
      this.profileForm.patchValue({
        firstName: params['firstName'] || '',
        lastName: params['lastName'] || '',
        email: params['email'] || '',
      });
    });

    // ✅ Также загружаем данные из сервиса (если их нет в queryParams)
    this.userService.getUserProfile().subscribe((user) => {
      if (!this.profileForm.value.firstName && user) {
        this.profileForm.patchValue(user);
      }
    });
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.userService
        .updateUserProfile(this.profileForm.value)
        .subscribe(() => {
          this.router.navigate(['/profile']);
        });
    }
  }
}
