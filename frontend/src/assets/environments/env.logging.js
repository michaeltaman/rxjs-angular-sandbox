window.env = {
  ...window.env,
  logConfig: {
    ENABLED: ["info", "warn", "error"], // Глобальные уровни логирования
    TRACE_ENABLED: true, // включить трассировку
    components: {
      // Добавляем уровень components
      appComponent: ["info", "warn", "error"],
      //mobileProfileHeaderComponent: ["info", "warn", "error"],
      profileAvatarComponent: ["info", "warn", "error"],
      profileComponent: ["info", "warn", "error"],
      userRegistrationComponent: ["info", "warn", "error"],
      //authGuard: ["info", "warn", "error"],
      //authService: ["info", "warn", "error"],
      tokenService: ["info", "warn", "error"],
      activityService: ["info", "warn", "error"],
      authInterceptor: ["info", "warn", "error"],
      //userService: ["info", "warn", "error"],
      baseComponent: ["info", "warn", "error"],
    },
  },
};
