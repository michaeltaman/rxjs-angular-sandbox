# 📘 Интеграционное логирование в Angular-проекте

## 📌 Цель

Обеспечить **гибкое логирование в консоль** для бизнес-логики, с возможностью:

- включать и отключать логи по компонентам;
- фильтровать уровни (`info`, `warn`, `error`);
- централизованно управлять конфигурацией через `window.env`;
- использовать отладочный режим (`DEBUG_MODE`).

---

## ✅ Как использовать

### 1. Импорт сервиса логирования

```ts
constructor(private loggingService: LoggingService) {}
```

### 2. Вызов логов

```ts
this.loggingService.info('authService', '✅ Пользователь авторизован');
this.loggingService.warn('userService', '⚠️ Отсутствует номер телефона');
this.loggingService.error('authService', '❌ Ошибка при обновлении токена', error);
```

> 📌 Третий аргумент (`data`) не обязателен, но позволяет удобно логировать объекты.

---

## ⚙️ Конфигурация логов

Файл `env.logging.js`, подключаемый в `index.html`:

```js
window.env = {
  ...window.env,
  logConfig: {
    appComponent: ['info', 'warn', 'error'],
    // authService: ['info', 'warn', 'error'], // отключено
  },
};
```

---

## 🚨 Отладочный режим

Файл: `logging.service.ts`

```ts
const DEBUG_MODE = true;
```

- Если `true`, то все логи будут отображаться вне зависимости от `logConfig`.
- Если `false`, то будет работать только логирование из разрешённых компонентов и уровней.

---

## 🔒 Прямые логи

Можно использовать `console.log(...)` вне `LoggingService` — для ручной диагностики и тестов.

---

## 🧪 Пример

```ts
this.loggingService.info(
  'authService',
  '✅ Токены сохранены в SessionStorage',
  { access_token: 'abc...', refresh_token: 'xyz...' }
);
```

---

## 📂 Файлы и структура

- `logging.service.ts` — основной сервис логирования.
- `logging-config.ts` — конфигурация логирования, подключает `window.env.logConfig`.
- `env.logging.js` — конфигурация, доступная в runtime через `window.env`.
- `global.d.ts` — декларация `window.env`.

---

## 💡 Советы

- Используй `DEBUG_MODE = true` при глубокой отладке.
- Не забывай отключать ненужные компоненты в `logConfig`, чтобы консоль не засорялась.
- Перед релизом — оставь только `error`-уровни и ключевые `info` (если нужно).