from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.config.database import get_db
from app.schemas.personSchema import PersonResponse, PersonCreate, PersonUpdate
from app.controller.personController import (
    create_person,
    get_person,
    get_all_persons,
    update_person,
    delete_person,
)

router = APIRouter(prefix="/persons", tags=["persons"])


@router.post("", response_model=PersonResponse, status_code=status.HTTP_201_CREATED)
def create_person_route(person: PersonCreate, db: Session = Depends(get_db)):
    """Create a new person"""
    return create_person(db, person)

@router.get("", response_model=list[PersonResponse])
def get_all_persons_route(skip: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    """Get all persons with pagination"""
    return get_all_persons(db, skip, limit)


@router.get("/{person_id}", response_model=PersonResponse)
def get_person_route(person_id: int, db: Session = Depends(get_db)):
    """Get a specific person by ID"""
    person = get_person(db, person_id)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    return person


@router.put("/{person_id}", response_model=PersonResponse)
def update_person_route(person_id: int, person_update: PersonUpdate, db: Session = Depends(get_db)):
    """Update a person"""
    person = get_person(db, person_id)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    return update_person(db, person_id, person_update)

@router.delete("/{person_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_person_route(person_id: int, db: Session = Depends(get_db)):
    """Delete a person"""
    person = get_person(db, person_id)
    if not person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )
    return delete_person(db, person_id)

