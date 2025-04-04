# 📘 RxJS Auth Project Overview

## 🧠 Общее описание проекта
Это Angular-приложение, ориентированное на:

- 🔐 Безопасную аутентификацию с использованием JWT (access/refresh)
- 🛡 Активную защиту с помощью интерцепторов и таймеров
- 🔄 Реактивное программирование через RxJS
- 🧬 Интеграцию UI с потоками данных через `BehaviorSubject` и `Observable`
- 📋 Сильную логгируемость через `LoggingService`

---

## 🛡 Безопасность и токены (Authentication Flow)

### 🔐 Аутентификация и сессия
- Токены (`access_token`, `refresh_token`) сохраняются в `sessionStorage`
- После логина `access_token` декодируется и вычисляется TTL: `exp * 1000 - Date.now()`
- Используется `BehaviorSubject<boolean>` (`authStatus$`) для отслеживания статуса авторизации

### 🔁 Обновление токена
- Если до истечения токена осталось < 5 секунд, вызывается `refreshToken()` через `handleUserAction()`
- В `AuthInterceptor` реализовано автоматическое обновление токена при 401, если `!this.isRefreshing`
- Поддержка пользовательского интервала обновления токена через `window.env.authConfig.refresh_active_token_interval`

### ⏳ Неактивность
- Работает таймер неактивности (`startInactivityTimer()`), основанный на `logout_time`
- При бездействии происходит автоматический выход (`logout()`)

---

## ⚙️ RxJS — активное использование

### ✅ Повсеместное использование
- `BehaviorSubject` в `AuthService` и `UserService` для авторизации и хранения профиля
- `tokenLifetimeSubject` — для TTL access-токена
- Реактивные формы (`ReactiveFormsModule`) с `debounceTime`, `distinctUntilChanged`, `switchMap`, `tap`, `filter`
- `Observable` в логине, регистрации, проверке инвайт-кодов, обновлении токенов

### 📌 Типичные RxJS-операторы:
- `switchMap` — для отмены предыдущих запросов (например, при валидации форм)
- `tap` — для логирования и побочных эффектов
- `filter`, `debounceTime`, `map` — для оптимизации реактивных форм

---

## 🔍 Возможные зоны улучшения

### 🔸(✅ Сделано) Управление подписками
- Не везде реализован `unsubscribe()` или `takeUntil()` в `ngOnDestroy`
- Особенно в `AppComponent`, `ProfileComponent`, `ProfileAvatarComponent`
- ➕ Рекомендуется использовать `Subject<void>` + `takeUntil()`

### 🔸 Цикличность в получении профиля
- `getUserProfile()` вызывается слишком часто: после логина, восстановления сессии и при каждом действии
- ➕ Возможна оптимизация через кэш или условную проверку

### 🔸(✅ Сделано)  Сложность логики в `auth.service.ts`
- Методы `startTokenRefresh()`, `calculateRefreshInterval()`, `startInactivityTimer()` связаны между собой
- ➕ Стоит декомпозировать для тестируемости и читаемости

### 🔸 Унификация ошибок в UI
- Ошибки обрабатываются локально (`this.errorMessage = ...`)
- ➕ Лучше централизовать через `ErrorHandler` + `ToastrService` или `MatSnackBar`

---------------------------------------------------------------------------------------
---------------------------------------------------------------------------------------

# ✅ Резюме по декомпозиции auth.service.ts

## 🎯 Цель декомпозиции

Основная идея — разделить ответственность в `auth.service.ts`, который изначально включал в себя:
- Управление токенами (access/refresh)
- Обновление токенов по таймеру и через интерцептор
- Таймер неактивности пользователя
- Аутентификацию / logout / session restore
- Обработку `window.env`, sessionStorage

➡️ Всё это было в **одном файле**, усложняя поддержку и масштабирование.

---

## ✅ Что было сделано — декомпозиция

| 📁 Файл | 📌 Назначение |
|--------|----------------|
| `auth.service.ts` | 🎯 Оркестратор: login, logout, session restore. Делегирует всё остальное |
| `token.service.ts` | 🔐 Токены: хранение, извлечение, `window.env.refresh_active_token_interval`, таймер обновления |
| `activity.service.ts` | ⏱️ Таймер неактивности: logout при бездействии, `window.env.logout_time` и `logout_inactivity` |

---

## 🧩 Структурные изменения

### Был:
- Один файл `auth.service.ts`, выполняющий всё.

### Стало:

#### ✅ `auth.service.ts`
- `login()` / `logout()` / `restoreSession()`
- Делегирует в `TokenService` и `ActivityService`
- `handleUserAction()` → проверка и обновление токена

#### ✅ `token.service.ts`
- `saveTokens()`, `refreshToken()`, `getAccessToken()`, `isTokenExpired()`
- `startTokenRefresh()` с логикой из `window.env.authConfig.refresh_active_token_interval`
- Весь `sessionStorage` централизован

#### ✅ `activity.service.ts`
- `startInactivityTimer(callback)`
- `clearTimer()`
- `window.env.authConfig.logout_time` и `logout_inactivity`
- Ранее добавлялся `isTimerActive`, но он удалён

---

## ✅ Результаты

| Преимущество | Описание |
|--------------|----------|
| ♻️ Повторное использование | `TokenService` и `ActivityService` можно использовать независимо |
| 🧪 Тестируемость | Каждый сервис можно отдельно покрыть unit-тестами |
| 🔍 Удобство отладки | Логика и логирование разделены по зонам ответственности |
| 🔐 Безопасность | Централизованное хранение токенов |
| 👁️ Читаемость | Код стал легче для понимания и сопровождения |

-------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------

# ✅ Резюме: Управление подписками: oсвобождение ресурсов в Angular-сервисах и компонентах

## Сводная таблица: Сервисы

| Сервис                | Ресурсы для очистки      | Метод очистки              | Статус |
|-------------------------|----------------------------|------------------------------|---------|
| `LoggingService`        | Нет                      | Не требуется                 | ✅       |
| `TokenService`          | `setTimeout`              | `clearTimeout()`             | ✅       |
| `UserService`           | `BehaviorSubject`         | Управляется сверху       | ✅       |
| `ActivityService`       | `setTimeout`              | `clearTimeout()`             | ✅       |
| `AuthService`           | Координация            | `logout()` вызывает очистку | ✅       |
| `AuthInterceptor`       | Нет                      | Не требуется                 | ✅       |
| `AuthGuard`             | Нет                      | Не требуется                 | ✅       |

---

## Сводная таблица: Компоненты

| Компонент                       | `ngOnDestroy()` | `takeUntil(this.destroy$)` | Особенности                       |
|-------------------------------------|------------------|------------------------------|----------------------------------|
| `AppComponent`                      | ✅                | ✅                            | Живёт всю жизнь приложения  |
| `MobileProfileHeaderComponent`     | ✅                | ✅                            | Есть таймер `setInterval`            |
| `LoginComponent`                   | ❌                | ✅                            | Всё по `takeUntil()`              |
| `UserRegistrationComponent`        | ❌                | ✅                            | `BehaviorSubject`, `timer()`    |
| `ProfileComponent`                 | ❌                | ✅                            | Чистый стрим `user$`           |
| `ProfileAvatarComponent`           | ❌                | ✅                            | Похоже на profile             |
| `EditProfileComponent`             | ❌                | ✅                            | Чистая форма, без таймеров       |

---

## Текстовое резюме

- Все сервисы в проекте спроектированы правильно: если есть таймеры (`setTimeout` / `setInterval`) — они очищаются.
- `TokenService` и `ActivityService` имеют прямой контроль над очисткой таймеров.
- `AuthService` воплощает очистку при `logout()`.
- Компоненты, в которых нет `ngOnDestroy()`, имеют `takeUntil(this.destroy$)` и наследуют `BaseComponent`, так что очистка происходит по-настоящему.

---

Текущее состояние хорошее. Проект готов для долгосрочной работы без утечек памяти и скрытых таймеров.

-------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------

# 🧩 Улучшенное логирование в Angular

Добавлена система управляемого логирования с возможностью:

- 🔎 **Включать/отключать логирование** глобально и по компонентам
- 🛠️ **Включать трассировку (Trace)** для отладки
- 🧼 **Удалять лишние сообщения типа `Error:`**, оставляя только полезную информацию
- 📂 **Конфигурировать всё через `env.logging.js`**, без правок в коде

---

## 🔧 Основные изменения

| Изменение                        | Описание                                                                 |
|----------------------------------|--------------------------------------------------------------------------|
| ✅ `TRACE_ENABLED`               | Добавлен флаг в `env.logging.js`, включает отображение stack trace       |
| ✅ Использование `new Error("🛠️ Trace")` | Позволяет DevTools отобразить путь вызова логов (stack trace)         |
| ✅ `shouldLog()`                 | Обновлена логика: компонент логируется только если явно разрешён         |
| ✅ `components + ENABLED` в `env.logging.js` | Настройка логирования по компонентам и уровням (`info`, `warn`, `error`) |
| ✅ Удалена зависимость от `angular.json` | Trace работает без каких-либо правок в конфигурации сборки            |

---

## 📁 Пример настройки `env.logging.js`

```js
window.env = {
  logConfig: {
    TRACE_ENABLED: true,
    ENABLED: ['info', 'warn', 'error'],
    components: {
      authService: ['info', 'error'],
      loginComponent: ['info'],
      // profileComponent: ['info'], // отключено
    },
  },
};
```

-------------------------------------------------------------------------------------------------

## 📦 Заключение
Проект демонстрирует продвинутую реализацию безопасности, сессионного контроля и реактивного интерфейса с Angular и RxJS. Есть потенциал для улучшения читаемости и масштабируемости кода, особенно в части подписок и повторной логики.

