import pytest

from app import create_app
from app.extensions import db
from app.models import User

PASSWORD = "Secret123!"


@pytest.fixture
def app():
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def _make_user(name, email, role, active=True):
    user = User(name=name, email=email, role=role, is_active=active)
    user.set_password(PASSWORD)
    db.session.add(user)
    db.session.commit()
    return user


@pytest.fixture
def make_user(app):
    return _make_user


@pytest.fixture
def users(app):
    return {
        "usuario": _make_user("Ursula User", "user@test.com", "usuario"),
        "otro": _make_user("Otto Other", "other@test.com", "usuario"),
        "agente": _make_user("Agnes Agent", "agent@test.com", "agente"),
        "admin": _make_user("Adam Admin", "admin@test.com", "admin"),
    }


@pytest.fixture
def login(client):
    def _login(user):
        response = client.post("/api/auth/login", json={"email": user.email, "password": PASSWORD})
        assert response.status_code == 200, response.get_json()
        return {"Authorization": f"Bearer {response.get_json()['access_token']}"}

    return _login


@pytest.fixture
def headers(users, login):
    return {key: login(user) for key, user in users.items()}


@pytest.fixture
def create_ticket(client):
    def _create(auth, **overrides):
        payload = {
            "title": "Printer is jammed",
            "description": "The printer on floor two keeps jamming.",
            "category": "hardware",
            "priority": "media",
        }
        payload.update(overrides)
        response = client.post("/api/tickets", json=payload, headers=auth)
        assert response.status_code == 201, response.get_json()
        return response.get_json()

    return _create
