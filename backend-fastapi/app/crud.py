from sqlalchemy.orm import Session
from app.models import User, InviteCode
from app.schemas import UserCreate
from app.security import hash_password, verify_password, create_access_token, create_refresh_token
import bcrypt
import secrets


# ✅ Получение пользователя по email
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


# ✅ Аутентификация пользователя
def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not verify_password(password, user.password):
        return None
    return user


# ✅ Сохранение Refresh-токена в БД
def save_refresh_token(db: Session, user: User, refresh_token: str):
    user.refresh_token = refresh_token
    db.commit()
    db.refresh(user)  # ✅ Освежаем объект в БД



# ✅ Удаление Refresh-токена (выход из системы)
def revoke_refresh_token(db: Session, user: User):
    user.refresh_token = None
    db.commit()


# ✅ Создание нового пользователя (с возможным инвайт-кодом)
def create_user(db: Session, user: UserCreate, role: str = "user"):
    hashed_password = hash_password(user.password)

    print(f"✅ Создаем пользователя: {user.email}, роль: {role}")

    db_user = User(name=user.name, email=user.email, password=hashed_password, role=role)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


# ✅ Функции для invite-кодов:
def generate_invite_code(db: Session):
    """Создает и сохраняет новый invite-код"""
    new_code = secrets.token_hex(16)  # Генерация случайного 32-символьного кода
    invite_code = InviteCode(code=new_code)
    db.add(invite_code)
    db.commit()
    db.refresh(invite_code)
    return invite_code


def check_invite_code(db: Session, code: str):
    """Проверяет, существует ли код и не использован ли он"""
    return db.query(InviteCode).filter(InviteCode.code == code, InviteCode.used == False).first()


def mark_code_as_used(db: Session, code: str):
    """Отмечает код как использованный"""
    invite_code = db.query(InviteCode).filter(InviteCode.code == code, InviteCode.used == False).first()
    if invite_code:
        invite_code.used = True
        db.commit()
        db.refresh(invite_code)
        return True
    return False
