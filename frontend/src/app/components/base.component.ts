// base.component.ts
import { Directive, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { LoggingService } from '../services/logging.service';

@Directive()
export abstract class BaseComponent implements OnDestroy {
  protected destroy$ = new Subject<void>();

  constructor(protected loggingService: LoggingService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.loggingService?.info('BaseComponent', '🔻 Component destroyed');
  }
}
