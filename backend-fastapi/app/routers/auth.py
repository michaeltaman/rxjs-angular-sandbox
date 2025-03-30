from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.crud import authenticate_user, save_refresh_token, revoke_refresh_token
from app.security import create_access_token, create_refresh_token, verify_token
from app.schemas import LoginRequest, TokenResponse, RefreshTokenRequest
from app.models import User  # ✅ Добавляем импорт модели пользователя
from datetime import datetime, timezone

router = APIRouter()

# ✅ Вход пользователя (логин)
@router.post("/login/", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, request.email, request.password)
    if not user:
        raise HTTPException(status_code=401, detail="Неверные учетные данные")

    access_token = create_access_token({"sub": user.email})
    refresh_token = create_refresh_token({"sub": user.email})
    save_refresh_token(db, user, refresh_token)

    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

# ✅ Обновление Access-токена
@router.post("/refresh-token/", response_model=TokenResponse)
def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    print(f"📥 Получен запрос на обновление токена: {request.refresh_token}")

    # Декодируем refresh_token
    payload = verify_token(request.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Невалидный Refresh-токен")

    print(f"✅ Декодирован payload: {payload}")

    # ✅ Добавлена проверка корректности user_id
    try:
        user_id = int(payload["sub"])  # Преобразуем sub в int
    except ValueError:
        print(f"🚨 Ошибка: Некорректный user_id в токене: {payload['sub']}")
        raise HTTPException(status_code=400, detail="Некорректный user_id в токене")

    # Находим пользователя в БД
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        print(f"🚨 Ошибка: пользователь с ID {user_id} не найден в базе данных")
        raise HTTPException(status_code=401, detail="Пользователь не найден")

    print(f"✅ Найден пользователь: {user.email}")

    # Проверяем, совпадает ли refresh_token
    if user.refresh_token != request.refresh_token:
        raise HTTPException(status_code=401, detail="Refresh-токен не соответствует")

    print(f"🔑 Refresh-токен подтверждён для пользователя {user.email}")

    # Генерируем новые токены
    new_access_token = create_access_token(user.id)  # ✅ ПРАВИЛЬНО!
    new_refresh_token = create_refresh_token(user.id)  # ✅ ПРАВИЛЬНО!

    # ✅ Обновляем refresh_token и last_updated в БД
    user.refresh_token = new_refresh_token
    user.last_updated = datetime.now(timezone.utc)  # Ставим текущее время в UTC
    db.commit()

    print(f"✅ Новый access_token: {new_access_token}")
    print(f"✅ Новый refresh_token: {new_refresh_token}")
    print(f"🕒 Поле last_updated обновлено: {user.last_updated}")

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
    }

