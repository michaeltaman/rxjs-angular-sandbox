import { Injectable } from '@angular/core';

type LogLevel = 'info' | 'warn' | 'error';

@Injectable({
  providedIn: 'root',
})
export class LoggingService {
  private readonly iconMap: Record<LogLevel, string> = {
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  };

  private readonly enabledLevels: LogLevel[] = (window as any)?.env
    ?.logConfig?.['ENABLED'] ?? ['info', 'warn', 'error'];
  private readonly componentLevels: Record<string, LogLevel[]> =
    (window as any)?.env?.logConfig?.['components'] ?? {};
  private readonly traceEnabled: boolean =
    (window as any)?.env?.logConfig?.['TRACE_ENABLED'] === true;

  private shouldLog(component: string, level: LogLevel): boolean {
    // Если компонент явно указан — использовать его настройки
    if (Object.prototype.hasOwnProperty.call(this.componentLevels, component)) {
      return this.componentLevels[component].includes(level);
    }

    // Если не указан — НЕ логировать
    return false;
  }

  private log(
    level: LogLevel,
    component: string,
    message: string,
    data?: any
  ): void {
    if (!this.shouldLog(component, level)) return;

    const icon = this.iconMap[level] || '';
    const prefix = `[${component}] ${icon}`;

    if (this.traceEnabled) {
      const trace = new Error('logging mode 🛠️ Trace');
      console[level](`${prefix} ${message}`, data, trace);
    } else {
      console[level](`${prefix} ${message}`, data);
    }
  }

  info(component: string, message: string, data?: any): void {
    this.log('info', component, message, data);
  }

  warn(component: string, message: string, data?: any): void {
    this.log('warn', component, message, data);
  }

  error(component: string, message: string, data?: any): void {
    this.log('error', component, message, data);
  }
}
