import {
  Component,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoggingService } from '../../services/logging.service';

@Component({
  selector: 'app-mobile-profile-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mobile-profile-header.component.html',
  styleUrls: ['./mobile-profile-header.component.scss'],
})
export class MobileProfileHeaderComponent implements OnInit, OnDestroy {
  @Input() user: any = null;
  @Output() toggleTheme = new EventEmitter<void>();

  isDarkMode: boolean = false;
  currentTime: string;
  private intervalId: any;

  constructor(private loggingService: LoggingService) {
    this.currentTime = new Date().toLocaleTimeString();
  }

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString();
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  get initials(): string {
    if (!this.user?.firstName || !this.user?.lastName) return '';
    return this.user.firstName[0] + this.user.lastName[0];
  }

  get themeIcon(): string {
    return document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
  }

  toggleThemeClick() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-theme', this.isDarkMode); // ✅ Переключаем класс
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user']) {
      this.loggingService.log(
        'mobileProfileHeaderComponent',
        '📌 User received in mobile-profile-header:',
        this.user
      );
      this.loggingService.log(
        'mobileProfileHeaderComponent',
        '👀 User first name:',
        this.user?.firstName
      );
      this.loggingService.log(
        'mobileProfileHeaderComponent',
        '👀 User last name:',
        this.user?.lastName
      );
    }
  }
}
