from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base  # ✅ Добавляем импорт
from datetime import datetime

Base = declarative_base()  # ✅ Определяем Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    role = Column(String(20), default="user")
    refresh_token = Column(String(255), nullable=True)  # ✅ Добавлено поле для Refresh Token
    created_at = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=func.now(), onupdate=func.now())  # ✅ Должно быть!
    avatar = Column(String(255), nullable=True)  # ✅ Новое поле

class InviteCode(Base):
    __tablename__ = "invite_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(32), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    used = Column(Boolean, default=False)
    used_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    user = relationship("User", backref="invites")
