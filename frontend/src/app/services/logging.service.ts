import { Injectable } from '@angular/core';
import { LOGGING_CONFIG } from '../shared/configs/logging-config';

const DEBUG_MODE = false; // Установи в true, чтобы принудительно включить ВСЕ логи

@Injectable({ providedIn: 'root' })
export class LoggingService {
  info(component: string, message: string, data?: any): void {
    if (DEBUG_MODE || LOGGING_CONFIG[component]?.includes('info')) {
      console.log(`[${component}] ${message}`);
      if (data !== undefined) {
        console.log(data);
      }
    }
  }

  warn(component: string, message: string, data?: any): void {
    if (DEBUG_MODE || LOGGING_CONFIG[component]?.includes('warn')) {
      console.warn(`[${component}] ${message}`);
      if (data !== undefined) {
        console.warn(data);
      }
    }
  }

  error(component: string, message: string, data?: any): void {
    if (DEBUG_MODE || LOGGING_CONFIG[component]?.includes('error')) {
      console.error(`[${component}] ${message}`);
      if (data !== undefined) {
        console.error(data);
      }
    }
  }
}
