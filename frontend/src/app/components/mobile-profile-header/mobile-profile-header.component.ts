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
import { BaseComponent } from '../base.component';

@Component({
  selector: 'app-mobile-profile-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mobile-profile-header.component.html',
  styleUrls: ['./mobile-profile-header.component.scss'],
})
export class MobileProfileHeaderComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  @Input() user: any = null;
  @Output() toggleTheme = new EventEmitter<void>();

  isDarkMode: boolean = false;
  currentTime: string;
  private intervalId: any;

  constructor(protected override loggingService: LoggingService) {
    super(loggingService);
    this.currentTime = new Date().toLocaleTimeString();
  }

  ngOnInit() {
    this.intervalId = setInterval(() => {
      this.currentTime = new Date().toLocaleTimeString();
    }, 1000);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.loggingService.info(
        'mobileProfileHeaderComponent',
        '🛑 Таймер текущего времени очищен в ngOnDestroy()'
      );
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
    document.body.classList.toggle('dark-theme', this.isDarkMode);
    this.toggleTheme.emit();
    this.loggingService.info(
      'mobileProfileHeaderComponent',
      `🎨 Theme toggled: ${this.isDarkMode ? 'dark' : 'light'}`
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user']) {
      this.loggingService.info(
        'mobileProfileHeaderComponent',
        '📌 User received in mobile-profile-header:',
        this.user
      );
      this.loggingService.info(
        'mobileProfileHeaderComponent',
        '👀 User first name:',
        this.user?.firstName
      );
      this.loggingService.info(
        'mobileProfileHeaderComponent',
        '👀 User last name:',
        this.user?.lastName
      );
    }
  }
}
