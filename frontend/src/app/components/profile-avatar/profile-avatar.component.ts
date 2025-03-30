import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { LoggingService } from '../../services/logging.service';

@Component({
  selector: 'app-profile-avatar',
  standalone: true,
  templateUrl: './profile-avatar.component.html',
  styleUrls: ['./profile-avatar.component.scss'],
})
export class ProfileAvatarComponent {
  user: any = null;

  constructor(
    private userService: UserService,
    private router: Router,
    private loggingService: LoggingService
  ) {}

  ngOnInit() {
    this.userService.user$.subscribe((data) => {
      this.user = data;
      this.loggingService.log(
        'profileAvatarComponent',
        'User data loaded in avatar:',
        this.user
      );
    });
  }

  goToProfile() {
    if (!this.user) return;

    this.router.navigate(['/profile'], {
      queryParams: {
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        avatar: this.user.avatar,
      },
    });
  }
}
