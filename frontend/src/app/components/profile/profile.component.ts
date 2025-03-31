import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { LoggingService } from '../../services/logging.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  user: any = null;

  constructor(
    private userService: UserService,
    private router: Router,
    private loggingService: LoggingService
  ) {}

  ngOnInit() {
    this.userService.user$.subscribe((data) => {
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
