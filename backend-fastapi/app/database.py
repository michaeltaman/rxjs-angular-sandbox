from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from app.config import DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME

# ✅ Формируем строку подключения
DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# ✅ Создаем движок SQLAlchemy
engine = create_engine(DATABASE_URL)

# ✅ Создаем фабрику сессий
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ Создаем базовый класс для моделей
Base = declarative_base()

# ✅ Функция получения сессии БД
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
