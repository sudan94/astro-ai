from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status
from app.models.Person import Person
from app.schemas import personSchema

def create_person(db: Session, person: personSchema.PersonCreate):
    """Create a new person"""
    try:
        db_person = Person(
            name=person.name,
            date_of_birth=person.date_of_birth,
            place_of_birth=person.place_of_birth,
            latitude=person.latitude,
            longitude=person.longitude,
        )
        db.add(db_person)
        db.commit()
        db.refresh(db_person)
        return db_person
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )


def get_person(db: Session, person_id: int):
    """Get a person by ID"""
    return db.query(Person).filter(Person.id == person_id).first()


def get_all_persons(db: Session, skip: int = 0, limit: int = 10):
    """Get all persons with pagination"""
    return db.query(Person).offset(skip).limit(limit).all()


def update_person(db: Session, person_id: int, person_update: personSchema.PersonUpdate):
    """Update a person"""
    try:
        db_person = db.query(Person).filter(Person.id == person_id).first()

        if not db_person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Person not found"
            )

        # Update only provided fields
        update_data = person_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_person, field, value)

        db.add(db_person)
        db.commit()
        db.refresh(db_person)
        return db_person
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )


def delete_person(db: Session, person_id: int):
    """Delete a person"""
    db_person = db.query(Person).filter(Person.id == person_id).first()

    if not db_person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Person not found"
        )

    db.delete(db_person)
    db.commit()
    return {"message": "Person deleted successfully"}
