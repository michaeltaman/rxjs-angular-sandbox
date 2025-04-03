mkdir backend-fastapi
cd backend-fastapi

```bash
#нужно один раз разрешить через powershell запускать Python - скрипты,
#yстановив ExecutionPolicy навсегда
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

python -m venv venv
source venv/bin/activate  # (Linux/macOS)
venv\Scripts\activate     # (Windows)

pip install -r requirements.txt

uvicorn app.main:app --reload  #команда uvicorn main:app --reload запускает бэкенд локально (без Docker)
```


```ruby

  DROP TABLE IF EXISTS users;

  CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) CHECK (role IN ('user', 'admin', 'owner')) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      refresh_token TEXT NULL
  );

```

http://localhost:8000/crm_db

http://localhost:8000/users

http://localhost:8000/docs


## Запустить локально и проверить
## Запустите приложение локально и проверьте, что в консоли выводятся нужные переменные:

```bash
  uvicorn main:app --reload
```
## В логах вы должны увидеть:

```ruby
  INFO:__main__:🔍 Загруженные переменные окружения:
  INFO:__main__:DB_HOST: postgres_db
  INFO:__main__:DB_PORT: 5432
  INFO:__main__:DB_USER: admin
  INFO:__main__:DB_NAME: crm_db
  INFO:__main__:`DB_PASSWORD: ✅ (Загружен)
```


## Проверить в Docker
## Теперь убедимся, что .env загружается в Docker.

## Пересоберите контейнеры:

```bash
  deactivate #можно и не выходить из виртуального окружения это опционально и сразу запускать из (venv) ниже следующие # #команды
  docker-compose down
  docker-compose build --no-cache
  docker-compose up -d
```
## Посмотрите логи контейнера:
```bash
  (venv) PS D:\sources\Angular_Projects\rxjs-angular-sandbox\backend-fastapi> docker-compose up --build
```
## Посмотрите логи контейнера:

```bash
  docker logs backend-fastapi-backend-1

```
  В логах должны появиться строки, аналогичные тем, что выше.

  ## Первое подключение к базе данных в DBeaver
  ```ruby
  Kогда backend-fastapi в Docker запущен и DBeaver установлен
  сразу подсоединяйся к базе данных используя вот эти credentials for DBeaver connection:

   DB_USER=admin
   DB_PASSWORD=admin123
   DB_NAME=crm_db
```


  ## Добавляем таблицу invite_codes вручную
  ```bash
  CREATE TABLE public.invite_codes (
	id serial4 NOT NULL,
	code varchar(255) NOT NULL,
	created_at timestamp DEFAULT CURRENT_TIMESTAMP NULL,
	used bool DEFAULT false NULL,
	used_by int4 NULL,
	CONSTRAINT invite_codes_code_key UNIQUE (code),
	CONSTRAINT invite_codes_pkey PRIMARY KEY (id)
);
```




  ## Создаем таблицу users вручную в PostgreSQL

```bash
  CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) CHECK (role IN ('user', 'admin', 'owner')) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      refresh_token TEXT NULL
  );

  ALTER TABLE users ADD COLUMN last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


  CREATE OR REPLACE FUNCTION update_last_updated_column()
  RETURNS TRIGGER AS $$
  BEGIN
      NEW.last_updated = NOW();
      RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER users_last_updated_trigger
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_last_updated_column();


  UPDATE users
  SET last_updated = NOW()
  WHERE id = 3;

```



## To see DB via docker
### Таблица `users` в базе данных PostgreSQL

```sql
-- Команда для входа в PostgreSQL из контейнера Docker:
docker exec -it backend-fastapi-db-1 psql -U admin -d crm_db

-- Команда для отображения структуры таблицы:
\d users
```

```bash

| Column        | Type                       | Nullable | Default                            |
|---------------|----------------------------|----------|-------------------------------------|
| id            | integer                    | not null | nextval('users_id_seq'::regclass)  |
| name          | character varying(100)     | not null |                                     |
| email         | character varying(100)     | not null |                                     |
| password      | text                       | not null |                                     |
| role          | character varying(20)      |          | 'user'                              |
| created_at    | timestamp without time zone|          | CURRENT_TIMESTAMP                   |
| refresh_token | text                       |          |                                     |

**Indexes**
- `users_pkey`: PRIMARY KEY, btree(id)
- `users_email_key`: UNIQUE CONSTRAINT, btree(email)

**Check constraints**
- `users_role_check`: role must be one of `user`, `admin`, `owner`
```


  ## To get backend-fastapi-backend-1 log
  ```bash
  PS D:\sources\Angular_Projects\rxjs-angular-sandbox\backend-fastapi> docker logs backend-fastapi-backend-1
```

## Обновляем базу данных
```sql
ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL;
```

**Table `public.users`**

```bash
| Column        | Type                       | Collation | Nullable | Default                                |
|---------------|----------------------------|-----------|----------|----------------------------------------|
| id            | integer                    |           | not null | nextval('users_id_seq'::regclass)      |
| name          | character varying(100)     |           | not null |                                        |
| email         | character varying(100)     |           | not null |                                        |
| password      | text                       |           | not null |                                        |
| role          | character varying(20)      |           |          | 'user'::character varying              |
| created_at    | timestamp without time zone|           |          | CURRENT_TIMESTAMP                      |
| refresh_token | text                       |           |          |                                        |
| last_updated  | timestamp without time zone|           |          | CURRENT_TIMESTAMP                      |
| avatar        | character varying(255)     |           |          | NULL::character varying                |
```