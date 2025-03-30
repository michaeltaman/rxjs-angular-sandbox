from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import UserCreate, UserResponse, LoginRequest, TokenResponse
from app.crud import (
    create_user,
    get_user_by_email,
    check_invite_code,
    mark_code_as_used,
    save_refresh_token
)
from app.security import create_refresh_token, create_access_token, verify_password
from app.models import User # ✅ Добавляем импорт!
from app.schemas import UserProfileResponse  # ✅ Добавляем импорт!
from app.security import get_current_user  # ✅ Добавляем импорт!

router = APIRouter()

# ✅ Регистрация пользователя
@router.post("/register/", response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, user.email):
        raise HTTPException(status_code=400, detail="Этот email уже используется!")

    # ✅ Проверяем invite-код (если введен)
    role = "user"
    invite_code = user.invite_code  # ✅ Читаем invite-код из тела запроса
    if invite_code:
        valid_code = check_invite_code(db, invite_code)
        if not valid_code:
            raise HTTPException(status_code=400, detail="Неверный или использованный invite-код")
        role = "admin"
        mark_code_as_used(db, invite_code)  # Помечаем код как использованный

    # ✅ Создаем пользователя
    new_user = create_user(db, user, role)

    # ✅ Генерируем и сохраняем refresh-токен
    refresh_token = create_refresh_token(new_user.id)
    save_refresh_token(db, new_user, refresh_token)

    return new_user


# ✅ Вход пользователя (логин)
@router.post("/login/", response_model=TokenResponse)
def login_user(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = get_user_by_email(db, login_data.email)
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    # ✅ Генерируем access и refresh токены
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    # ✅ Сохраняем refresh-токен в БД
    save_refresh_token(db, user, refresh_token)

    return {"access_token": access_token, "refresh_token": refresh_token}


# ✅ Проверка существования email (уже было)
@router.get("/check-email/")
def check_email(email: str, db: Session = Depends(get_db)):
    exists = get_user_by_email(db, email) is not None
    return {"exists": exists}


# ✅ Новый эндпоинт /profile
@router.get("/profile/", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == current_user.id).first()

    if not user:
        print(f"🔎User not found")
        return {"message": "User not found"}

    return UserProfileResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        avatar=user.avatar if user.avatar else None,  # Пока аватар может быть `NULL`
        created_at=user.created_at
    )

