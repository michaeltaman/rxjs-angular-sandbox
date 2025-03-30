from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional
from datetime import datetime

# DTO для создания пользователя
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    invite_code: Optional[str] = None  # ✅ Теперь invite_code передается из запроса


# DTO для возврата информации о пользователе
class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: str  # Оставляем str, но добавляем конвертацию через валидатор

    @field_validator("created_at", mode="before")
    def convert_created_at(cls, value):
        if isinstance(value, datetime):
            return value.strftime("%Y-%m-%d %H:%M:%S")
        return value

# ✅ Схема для запроса на логин
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

# ✅ Схема для ответа с токенами
class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

# ✅ Схема для запроса обновления токена
class RefreshTokenRequest(BaseModel):
    refresh_token: str


# ✅ Новая схема для профиля пользователя
class UserProfileResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    avatar: Optional[str] = None  # Может быть NULL
    created_at: str  # Храним дату в строке

    @field_validator("created_at", mode="before")
    def convert_created_at(cls, value):
        if isinstance(value, datetime):
            return value.strftime("%Y-%m-%d %H:%M:%S")
        return value