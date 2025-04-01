import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '../../services/user.service';
import { LoggingService } from '../../services/logging.service';
import { BaseComponent } from '../base.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent extends BaseComponent implements OnInit {
  user: any = null;

  constructor(
    private userService: UserService,
    private router: Router,
    protected override loggingService: LoggingService
  ) {
    super(loggingService);
  }

  ngOnInit(): void {
    this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe((data) => {
      this.user = data;
      this.loggingService.info(
        'profileComponent',
        'User data loaded in profile:',
        this.user
      );
    });
  }

  editProfile() {
    if (!this.user) return;

    this.router.navigate(['/profile/edit'], {
      queryParams: {
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
      },
    });
  }
}
