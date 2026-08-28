from uuid import uuid4
from types import SimpleNamespace

from app.core.dependencies import get_current_user
from app.schemas.enums import Role
from app.schemas.user import Profile
from app.main import app
from app.services.auth_service import AuthService


def student_profile() -> Profile:
    return Profile(
        id=uuid4(),
        full_name="Student Test",
        email="student@example.com",
        role=Role.STUDENT,
        is_active=True,
    )


def test_missing_token_returns_standard_401(client):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert response.json() == {
        "detail": {"code": "UNAUTHORIZED", "message": "Bearer access token is required"}
    }


def test_authenticated_profile_response(client):
    profile = student_profile()
    app.dependency_overrides[get_current_user] = lambda: profile
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 200
    assert response.json()["data"]["role"] == "student"


def test_student_cannot_access_staff_endpoint(client):
    app.dependency_overrides[get_current_user] = student_profile
    response = client.get("/api/v1/waste-records")
    assert response.status_code == 403
    assert response.json()["detail"]["code"] == "FORBIDDEN"


def test_first_login_provisions_safe_student_profile():
    user_id = uuid4()
    auth_user = SimpleNamespace(
        id=user_id,
        email="new-student@example.com",
        user_metadata={"full_name": "New Student"},
    )
    gateway = SimpleNamespace(
        auth_client=SimpleNamespace(
            auth=SimpleNamespace(get_user=lambda _token: SimpleNamespace(user=auth_user))
        )
    )

    class Profiles:
        row = None

        def get(self, _user_id):
            return self.row

        def create(self, payload):
            self.row = payload
            return payload

    profile = AuthService(gateway, Profiles()).authenticate("valid-token")
    assert profile.full_name == "New Student"
    assert profile.role == Role.STUDENT
