from uuid import uuid4

from app.core.dependencies import get_current_user
from app.schemas.enums import Role
from app.schemas.user import Profile
from app.main import app


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
