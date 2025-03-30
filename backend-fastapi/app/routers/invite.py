from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import InviteCode  # ✅ Добавляем импорт!
from app.crud import generate_invite_code, check_invite_code, mark_code_as_used

router = APIRouter()

@router.post("/generate-invite/")
def create_invite_code(db: Session = Depends(get_db)):
    """Генерирует новый invite-код"""
    return generate_invite_code(db)

@router.get("/check-invite/")
def check_invite_code(code: str, db: Session = Depends(get_db)):
    invite = db.query(InviteCode).filter(InviteCode.code == code).first()

    if not invite:
        return {"valid": False, "used": False}  # ❌ Код НЕ найден

    return {"valid": True, "used": invite.used}  # ✅ Возвращаем статус использования

@router.post("/use-invite/")
def use_invite_code(code: str, db: Session = Depends(get_db)):
    """Отмечает invite-код как использованный"""
    if mark_code_as_used(db, code):
        return {"message": "Код успешно использован."}
    raise HTTPException(status_code=400, detail="Код не найден.")
