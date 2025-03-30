export {};

declare global {
  interface Window {
    env: {
      // Конфигурация авторизации
      authConfig?: {
        logout_time?: number;
        logout_inactivity?: boolean;
        refresh_active_token_interval?: number;
      };

      // Конфигурация приложения
      appConfig?: {
        API_URL?: string;
        appTitle?: string;
        theme?: 'light' | 'dark';
      };

      // Конфигурация логов
      logConfig?: {
        [key: string]: ('info' | 'warn' | 'error')[];
      };
    };
  }
}
