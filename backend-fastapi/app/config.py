import os
from dotenv import load_dotenv

# Загрузка переменных окружения
load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:4200")
JWT_SECRET_KEY = os.getenv("TOKEN_SECRET", "default_fallback_secret")
JWT_ALGORITHM = os.getenv("TOKEN_ALGO", "HS256")
