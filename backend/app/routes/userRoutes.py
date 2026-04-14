from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.controller import userController, authController
from app.schemas import userSchema

router = APIRouter(prefix="/user", tags=["user"])


@router.put("/profile")
async def update_name(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid token")
    token = auth_header.split(" ")[1]
    user = authController.get_current_user(token, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    data = await request.json()
    new_name = data.get("name")
    if not new_name:
        raise HTTPException(status_code=400, detail="Name is required")

    updated_user = userController.update_user_name(db, user.id, new_name)
    return {"user": userSchema.UserResponse.from_orm(updated_user)}

