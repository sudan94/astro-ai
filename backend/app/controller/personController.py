from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException, status, BackgroundTasks
from app.models.Person import Person
from app.schemas import personSchema
from app.controller import astroController
from app.models.ChatSession import ChatSession


async def create_person(db: Session, person: personSchema.PersonCreate, current_user):
    """Create a new person"""
    try:
        db_person = Person(
            name=person.name,
            date_of_birth=person.date_of_birth,
            place_of_birth=person.place_of_birth,
            latitude=person.latitude,
            longitude=person.longitude,
            user_id=current_user.id,
        )
        db.add(db_person)
        db.commit()
        db.refresh(db_person)

        BackgroundTasks().add_task(astroController.get_vedic_chart, db=db, person_id=db_person.id)
        return db_person
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Failed to create person"
        )


def get_person(db: Session, person_id: int, current_user=None):
    """Get a person by ID"""
    person = (
        db.query(Person)
        .filter(Person.id == person_id, Person.user_id == current_user.id)
        .first()
    )
    return person


def get_all_persons(db: Session, skip: int = 0, limit: int = 10, current_user=None):
    """Get all persons with pagination"""
    return (
        db.query(Person)
        .filter(Person.user_id == current_user.id)
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_person(
    db: Session,
    person_id: int,
    person_update: personSchema.PersonUpdate,
    current_user=None,
):
    """Update a person"""
    try:
        db_person = (
            db.query(Person)
            .filter(Person.id == person_id, Person.user_id == current_user.id)
            .first()
        )

        if not db_person:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Person not found"
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
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists"
        )


def delete_person(db: Session, person_id: int, current_user=None):
    """Delete a person"""
    db_person = (
        db.query(Person)
        .filter(Person.id == person_id, Person.user_id == current_user.id)
        .first()
    )

    if not db_person:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Person not found"
        )

    db.delete(db_person)
    db.commit()
    return {"message": "Person deleted successfully"}


def get_person_by_session(db: Session, session_id: int, current_user=None):
    """Get person by chat session ID"""
    person = (
        db.query(Person)
        .join(ChatSession, ChatSession.person_id == Person.id)
        .filter(ChatSession.id == session_id, Person.user_id == current_user.id)
        .first()
    )
    return person
