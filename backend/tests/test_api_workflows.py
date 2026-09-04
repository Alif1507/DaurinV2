from datetime import date, datetime, timezone
from uuid import uuid4

from app.core.dependencies import get_current_user
from app.main import app
from app.schemas.enums import Role
from app.schemas.user import Profile
from app.services.container import get_services


NOW = datetime.now(timezone.utc).isoformat()
LOCATION_ID = uuid4()


def profile(role: Role) -> Profile:
    return Profile(
        id=uuid4(),
        full_name=f"{role.value.title()} Test",
        email=f"{role.value}@example.com",
        role=role,
        is_active=True,
    )


class FakeReportService:
    def create(self, payload, current_user):
        return {
            "id": str(uuid4()),
            "reporter_id": str(current_user.id),
            "location_id": str(payload.location_id),
            "problem_type": payload.problem_type.value,
            "description": payload.description,
            "photo_path": None,
            "status": "reported",
            "handled_by": None,
            "resolution_note": None,
            "started_at": None,
            "resolved_at": None,
            "created_at": NOW,
            "updated_at": NOW,
        }


class FakeWasteService:
    def create(self, payload, current_user):
        return {
            "id": str(uuid4()),
            "location_id": str(payload.location_id),
            "recorded_by": str(current_user.id),
            "record_date": payload.record_date.isoformat(),
            "organic_weight": float(payload.organic_weight),
            "inorganic_weight": float(payload.inorganic_weight),
            "residual_weight": float(payload.residual_weight),
            "notes": payload.notes,
            "created_at": NOW,
            "updated_at": NOW,
        }


class FakeServices:
    reports = FakeReportService()
    waste = FakeWasteService()


def test_student_can_create_cleanliness_report(client):
    app.dependency_overrides[get_current_user] = lambda: profile(Role.STUDENT)
    app.dependency_overrides[get_services] = FakeServices
    response = client.post(
        "/api/v1/reports",
        json={
            "location_id": str(LOCATION_ID),
            "problem_type": "scattered_waste",
            "description": "Waste near the canteen",
        },
    )
    assert response.status_code == 201
    assert response.json()["data"]["status"] == "reported"


def test_staff_can_create_waste_record(client):
    app.dependency_overrides[get_current_user] = lambda: profile(Role.STAFF)
    app.dependency_overrides[get_services] = FakeServices
    response = client.post(
        "/api/v1/waste-records",
        json={
            "location_id": str(LOCATION_ID),
            "record_date": date(2026, 8, 25).isoformat(),
            "organic_weight": 12.5,
            "inorganic_weight": 8,
            "residual_weight": 3.5,
            "notes": "Afternoon collection",
        },
    )
    assert response.status_code == 201
    assert response.json()["data"]["organic_weight"] == 12.5


def test_student_cannot_create_waste_record(client):
    app.dependency_overrides[get_current_user] = lambda: profile(Role.STUDENT)
    app.dependency_overrides[get_services] = FakeServices
    response = client.post(
        "/api/v1/waste-records",
        json={
            "location_id": str(LOCATION_ID),
            "record_date": "2026-08-25",
            "organic_weight": 1,
        },
    )
    assert response.status_code == 403


def test_non_admin_cannot_change_another_users_role(client):
    app.dependency_overrides[get_current_user] = lambda: profile(Role.STAFF)
    app.dependency_overrides[get_services] = FakeServices

    response = client.patch(
        f"/api/v1/users/{uuid4()}",
        json={"role": "teacher"},
    )

    assert response.status_code == 403
