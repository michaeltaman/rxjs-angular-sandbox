from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import users, invite, auth  # Исправлено на app.routers

app = FastAPI()

# ✅ Настройки CORS (разрешаем Angular-клиенту отправлять запросы)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Разрешаем Angular
    allow_credentials=True,
    allow_methods=["*"],  # Разрешаем все методы (GET, POST, PUT, DELETE)
    allow_headers=["*"],  # Разрешаем все заголовки
)

# ✅ Подключаем маршруты
app.include_router(users.router)
app.include_router(invite.router)
app.include_router(auth.router)  # Теперь импорт корректный

@app.get("/")
def root():
    return {"message": "🚀 CRM API работает!"}


