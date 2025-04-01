import { Component, OnInit } from '@angular/core';
import { takeUntil } from 'rxjs/operators';
import { LoggingService } from '../../services/logging.service';
import { BaseComponent } from '../base.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent extends BaseComponent implements OnInit {
  constructor(protected override loggingService: LoggingService) {
    super(loggingService);
  }

  ngOnInit(): void {
    this.loggingService.info('homeComponent', '🏠 Домашняя страница загружена');
  }
}
