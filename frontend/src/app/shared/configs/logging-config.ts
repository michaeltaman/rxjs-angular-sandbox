export type LogLevel = 'info' | 'warn' | 'error';

// Берём конфигурацию из window.env, если она есть
export const LOGGING_CONFIG: Record<string, LogLevel[]> =
  window?.env?.logConfig ?? {};
