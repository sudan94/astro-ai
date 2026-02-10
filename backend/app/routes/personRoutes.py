from app.controller.authController import get_current_user
from app.models.User import User
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas import personSchema
from app.controller import personController


router = APIRouter(prefix="/persons", tags=["persons"])


@router.post("", response_model=personSchema.PersonResponse, status_code=status.HTTP_201_CREATED)
async def create_person_route(person: personSchema.PersonCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Create a new person"""
    return await personController.create_person(db, person, current_user)

@router.get("", response_model=list[personSchema.PersonResponse])
def get_all_persons_route(skip: int = 0, limit: int = 10, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get all persons with pagination"""
    return personController.get_all_persons(db, skip, limit, current_user)


@router.get("/{person_id}", response_model=personSchema.PersonResponse)
def get_person_route(person_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get a specific person by ID"""
    person = personController.get_person(db, person_id, current_user)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    return person


@router.put("/{person_id}", response_model=personSchema.PersonResponse)
def update_person_route(person_id: int, person_update: personSchema.PersonUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Update a person"""
    person = personController.get_person(db, person_id, current_user)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    return personController.update_person(db, person_id, person_update, current_user)

@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_person_route(person_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Delete a person"""
    person = personController.get_person(db, person_id, current_user)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    return personController.delete_person(db, person_id, current_user)

