# Файл app/admin.py отвечает за генерацию пароля Суперадмина и регистрацию админа.
import secrets
from fastapi import APIRouter, HTTPException
from app.database import get_db_connection
from app.security import hash_password, verify_password
from app.schemas import AdminRegistration

router = APIRouter()

# 📌 1. Генерация пароля СуперАдмина
@router.post("/generate-admin-password")
def generate_admin_password():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM super_admin")
    existing = cur.fetchone()

    if existing:
        cur.close()
        conn.close()
        raise HTTPException(status_code=403, detail="❌ Пароль уже создан!")

    new_password = secrets.token_urlsafe(12)
    hashed_password = hash_password(new_password)

    cur.execute("INSERT INTO super_admin (secret_password) VALUES (%s)", (hashed_password,))
    conn.commit()

    cur.close()
    conn.close()

    return {"password": new_password}  # Показываем один раз


# 📌 2. Регистрация администратора
@router.post("/register-admin")
def register_admin(data: AdminRegistration):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT secret_password FROM super_admin")
    super_admin = cur.fetchone()

    if not super_admin or not verify_password(data.secret, super_admin[0]):
        cur.close()
        conn.close()
        raise HTTPException(status_code=403, detail="❌ Неверный пароль Суперадмина!")

    cur.execute("SELECT id FROM users WHERE email = %s", (data.email,))
    if cur.fetchone():
        cur.close()
        conn.close()
        raise HTTPException(status_code=400, detail="❌ Этот email уже зарегистрирован!")

    hashed_password = hash_password(data.password)

    cur.execute(
        "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s) RETURNING id, name, email, role",
        ("Admin", data.email, hashed_password, "admin"),
    )
    new_admin = cur.fetchone()
    conn.commit()

    cur.close()
    conn.close()

    return {"message": "✅ Администратор зарегистрирован!", "admin": {"id": new_admin[0], "email": new_admin[2], "role": new_admin[3]}}
