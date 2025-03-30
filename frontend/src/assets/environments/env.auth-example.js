window.env = {
  ...window.env,
  authConfig: {
    logout_time: 300, //Таймер неактивности в секундах. (По умолчанию 5 минут)
    logout_inactivity: true, //Bключить таймер неактивности : true/false
    refresh_active_token_interval: 1200, // Период обновления токена в секундах (see README_env.md)
  },
};
