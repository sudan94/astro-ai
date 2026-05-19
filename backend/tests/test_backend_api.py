from datetime import datetime
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

import main
from app.controller.authController import get_current_user
from app.routes import authRoutes, chatRoutes, locationRoutes, personRoutes, userRoutes


@pytest.fixture
def client():
    main.app.dependency_overrides.clear()
    test_client = TestClient(main.app)
    yield test_client
    main.app.dependency_overrides.clear()


@pytest.fixture
def fake_db():
    return object()


@pytest.fixture
def current_user():
    return SimpleNamespace(
        id=7,
        google_id="google-123",
        email="tester@example.com",
        name="Test User",
        avatar_url="https://example.com/avatar.png",
        is_active=True,
    )


@pytest.fixture
def authenticated_client(client, fake_db, current_user):
    def _override_db():
        yield fake_db

    main.app.dependency_overrides[personRoutes.get_db] = _override_db
    main.app.dependency_overrides[chatRoutes.get_db] = _override_db
    main.app.dependency_overrides[authRoutes.get_db] = _override_db
    main.app.dependency_overrides[userRoutes.get_db] = _override_db
    main.app.dependency_overrides[get_current_user] = lambda: current_user
    return client


def test_root_returns_docs_in_development(client, monkeypatch):
    monkeypatch.setattr(main, "ENV", "development")

    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "message": "Welcome to Astrology API",
        "version": "1.0.0",
        "docs": "/docs",
    }


def test_root_hides_docs_in_production(client, monkeypatch):
    monkeypatch.setattr(main, "ENV", "production")

    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"message": "Astrology API is running."}


def test_login_requires_token(client):
    response = client.post("/auth/login", json={})

    assert response.status_code == 400
    assert response.json() == {"detail": "Token required"}


def test_verify_requires_bearer_header(client):
    response = client.get("/auth/verify")

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid token"}


def test_verify_returns_user_when_token_is_valid(client, fake_db, current_user, monkeypatch):
    def _override_db():
        yield fake_db

    main.app.dependency_overrides[authRoutes.get_db] = _override_db
    monkeypatch.setattr(authRoutes.authController, "get_current_user", lambda token, db: current_user)

    response = client.get("/auth/verify", headers={"Authorization": "Bearer valid-token"})

    assert response.status_code == 200
    assert response.json()["user"]["id"] == current_user.id
    assert response.json()["user"]["email"] == current_user.email


def test_login_returns_token_and_user(client, fake_db, current_user, monkeypatch):
    def _override_db():
        yield fake_db

    main.app.dependency_overrides[authRoutes.get_db] = _override_db
    monkeypatch.setattr(
        authRoutes.authController,
        "verify_google_token",
        lambda token: {
            "sub": "google-123",
            "email": current_user.email,
            "name": current_user.name,
            "picture": current_user.avatar_url,
        },
    )
    monkeypatch.setattr(
        authRoutes.authController,
        "create_or_update_user",
        lambda db, google_id, email, name, avatar_url: current_user,
    )
    monkeypatch.setattr(
        authRoutes.authController,
        "create_access_token",
        lambda user, expires_delta: "generated-access-token",
    )

    response = client.post("/auth/login", json={"token": "google-token"})

    assert response.status_code == 200
    assert response.json()["token"] == "generated-access-token"
    assert response.json()["user"]["google_id"] == current_user.google_id


def test_location_search_returns_matching_city_fields(client, monkeypatch):
    monkeypatch.setattr(
        locationRoutes,
        "cities",
        [
            {
                "city": "Kathmandu",
                "city_ascii": "Kathmandu",
                "country": "Nepal",
                "lat": "27.7172",
                "lng": "85.3240",
            },
            {
                "city": "Karachi",
                "city_ascii": "Karachi",
                "country": "Pakistan",
                "lat": "24.8607",
                "lng": "67.0011",
            },
            {
                "city": "Delhi",
                "city_ascii": "Delhi",
                "country": "India",
                "lat": "28.6139",
                "lng": "77.2090",
            },
        ],
    )

    response = client.get("/location/cities", params={"q": "ka"})

    assert response.status_code == 200
    assert response.json() == [
        {
            "city": "Kathmandu",
            "country": "Nepal",
            "lat": 27.7172,
            "lng": 85.324,
        },
        {
            "city": "Karachi",
            "country": "Pakistan",
            "lat": 24.8607,
            "lng": 67.0011,
        },
    ]


def test_get_all_persons_returns_controller_data(authenticated_client, fake_db, current_user, monkeypatch):
    persons = [
        SimpleNamespace(
            id=1,
            name="Alice",
            date_of_birth=datetime(1990, 5, 1, 10, 30),
            place_of_birth="Kathmandu",
            latitude=27.7172,
            longitude=85.3240,
            created_at=datetime(2024, 1, 1, 12, 0),
            updated_at=None,
        )
    ]
    monkeypatch.setattr(
        personRoutes.personController,
        "get_all_persons",
        lambda db, skip, limit, user: persons,
    )

    response = authenticated_client.get("/persons")

    assert response.status_code == 200
    assert response.json()[0]["name"] == "Alice"
    assert response.json()[0]["place_of_birth"] == "Kathmandu"


def test_get_person_returns_404_when_missing(authenticated_client, monkeypatch):
    monkeypatch.setattr(personRoutes.personController, "get_person", lambda db, person_id, user: None)

    response = authenticated_client.get("/persons/999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Person not found"}


def test_create_person_returns_created_person(authenticated_client, current_user, monkeypatch):
    created_person = SimpleNamespace(
        id=2,
        name="Bob",
        date_of_birth=datetime(1988, 7, 9, 6, 45),
        place_of_birth="Delhi",
        latitude=28.6139,
        longitude=77.2090,
        created_at=datetime(2024, 2, 1, 8, 0),
        updated_at=None,
    )

    async def _fake_create_person(db, person, user):
        assert user.id == current_user.id
        assert person.name == "Bob"
        return created_person

    monkeypatch.setattr(personRoutes.personController, "create_person", _fake_create_person)

    response = authenticated_client.post(
        "/persons",
        json={
            "name": "Bob",
            "date_of_birth": "1988-07-09T06:45:00",
            "place_of_birth": "Delhi",
            "latitude": 28.6139,
            "longitude": 77.2090,
        },
    )

    assert response.status_code == 201
    assert response.json()["id"] == 2
    assert response.json()["name"] == "Bob"


def test_create_chat_session_returns_404_when_person_is_missing(authenticated_client, monkeypatch):
    monkeypatch.setattr(chatRoutes.personController, "get_person", lambda db, person_id, user: None)

    response = authenticated_client.post("/chat/session", json={"person_id": 11})

    assert response.status_code == 404
    assert response.json() == {"detail": "Person not found"}


def test_create_chat_session_returns_created_session(authenticated_client, monkeypatch):
    monkeypatch.setattr(chatRoutes.personController, "get_person", lambda db, person_id, user: SimpleNamespace(id=person_id))

    async def _fake_chat_session(db, chat):
        return SimpleNamespace(
            id=10,
            person_id=chat.person_id,
            title="New Chat",
            created_at=datetime(2024, 3, 1, 9, 0),
            updated_at=None,
        )

    monkeypatch.setattr(chatRoutes.chatController, "chat_session", _fake_chat_session)

    response = authenticated_client.post("/chat/session", json={"person_id": 4})

    assert response.status_code == 201
    assert response.json()["person_id"] == 4
    assert response.json()["title"] == "New Chat"


def test_chat_history_returns_messages(authenticated_client, monkeypatch):
    monkeypatch.setattr(
        chatRoutes.personController,
        "get_person_by_session",
        lambda db, session_id, user: SimpleNamespace(id=1, user_id=user.id),
    )

    async def _fake_history(db, session_id):
        return [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there"},
        ]

    monkeypatch.setattr(chatRoutes.chatController, "get_chat_history", _fake_history)

    response = authenticated_client.get("/chat/session/5/history")

    assert response.status_code == 200
    assert response.json() == {
        "session_id": 5,
        "messages": [
            {"role": "user", "content": "Hello"},
            {"role": "assistant", "content": "Hi there"},
        ],
    }


def test_update_user_profile_requires_name(client, fake_db, current_user, monkeypatch):
    def _override_db():
        yield fake_db

    main.app.dependency_overrides[userRoutes.get_db] = _override_db
    monkeypatch.setattr(userRoutes.authController, "get_current_user", lambda token, db: current_user)

    response = client.put("/user/profile", headers={"Authorization": "Bearer valid-token"}, json={})

    assert response.status_code == 400
    assert response.json() == {"detail": "Name is required"}


def test_update_user_profile_returns_updated_user(client, fake_db, current_user, monkeypatch):
    updated_user = SimpleNamespace(
        id=current_user.id,
        google_id=current_user.google_id,
        email=current_user.email,
        name="Updated Name",
        avatar_url=current_user.avatar_url,
        is_active=True,
    )

    def _override_db():
        yield fake_db

    main.app.dependency_overrides[userRoutes.get_db] = _override_db
    monkeypatch.setattr(userRoutes.authController, "get_current_user", lambda token, db: current_user)
    monkeypatch.setattr(userRoutes.userController, "update_user_name", lambda db, user_id, new_name: updated_user)

    response = client.put(
        "/user/profile",
        headers={"Authorization": "Bearer valid-token"},
        json={"name": "Updated Name"},
    )

    assert response.status_code == 200
    assert response.json()["user"]["name"] == "Updated Name"
