from datetime import date
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.core.config import Settings
from app.core.dependencies import get_current_user
from app.core.exceptions import AppError
from app.main import app
from app.schemas.enums import Role, TrendPeriod
from app.schemas.user import Profile
from app.services.container import get_services
from app.services.dashboard_service import DashboardService


LOCATION_ID = uuid4()


def profile(role: Role) -> Profile:
    return Profile(
        id=uuid4(),
        full_name=f"{role.value.title()} Dashboard",
        email=f"dashboard-{role.value}@example.com",
        role=role,
        is_active=True,
    )


class FakeReports:
    def __init__(self) -> None:
        self.locations = []

    def aggregate_rows(self, *, start_date, end_date, location_id):
        self.locations.append(location_id)
        if start_date.month != 8:
            return [{"status": "resolved", "created_at": "2026-07-30T08:00:00+00:00", "resolved_at": "2026-07-30T09:00:00+00:00", "location_id": str(LOCATION_ID)}]
        return [
            {"status": "reported", "created_at": "2026-08-01T08:00:00+00:00", "resolved_at": None, "location_id": str(LOCATION_ID)},
            {"status": "resolved", "created_at": "2026-08-02T08:00:00+00:00", "resolved_at": "2026-08-02T09:00:00+00:00", "location_id": str(LOCATION_ID)},
        ]


class FakeWaste:
    def aggregate_rows(self, *, start_date, end_date, location_id):
        if start_date.month != 8:
            return [{"record_date": "2026-07-30", "organic_weight": 5, "inorganic_weight": 3, "residual_weight": 2, "location_id": str(LOCATION_ID)}]
        return [
            {"record_date": "2026-08-01", "organic_weight": 10, "inorganic_weight": 5, "residual_weight": 5, "location_id": str(LOCATION_ID)},
            {"record_date": "2026-08-02", "organic_weight": 5, "inorganic_weight": 5, "residual_weight": 0, "location_id": str(LOCATION_ID)},
        ]


class FakeCamide:
    def aggregate_rows(self, *, start_date, end_date):
        return [
            {"category": "organic", "confidence": 0.92, "is_confident": True, "created_at": "2026-08-01T10:00:00+00:00"},
            {"category": "b3", "confidence": 0.41, "is_confident": False, "created_at": "2026-08-02T10:00:00+00:00"},
        ]


class FakeLocations:
    def get(self, location_id):
        return {"id": str(location_id), "name": "Kantin"} if location_id == LOCATION_ID else None

    def list_active(self):
        return [{"id": str(LOCATION_ID), "name": "Kantin"}]


def service() -> DashboardService:
    return DashboardService(
        FakeReports(),
        FakeWaste(),
        FakeCamide(),
        FakeLocations(),
        Settings(app_env="test", dashboard_default_days=30, dashboard_max_range_days=365),
    )


def test_dashboard_summary_calculates_kpis_and_comparison():
    result = service().summary(start_date=date(2026, 8, 1), end_date=date(2026, 8, 2), location_id=LOCATION_ID)
    assert result["reports"]["total"] == 2
    assert result["reports"]["resolution_rate"] == 50
    assert result["waste"]["total"] == 30
    assert result["waste"]["residual_percentage"] == 16.67
    assert result["comparison"]["waste_change_percentage"] == 200


def test_dashboard_rejects_invalid_and_excessive_ranges():
    dashboard = service()
    with pytest.raises(AppError) as invalid:
        dashboard.summary(start_date=date(2026, 8, 2), end_date=date(2026, 8, 1), location_id=None)
    assert invalid.value.code == "INVALID_DATE_RANGE"
    assert invalid.value.status_code == 400

    with pytest.raises(AppError) as excessive:
        dashboard.summary(start_date=date(2025, 1, 1), end_date=date(2026, 8, 1), location_id=None)
    assert excessive.value.code == "DATE_RANGE_TOO_LARGE"


def test_dashboard_location_filter_and_missing_location():
    dashboard = service()
    dashboard.summary(start_date=date(2026, 8, 1), end_date=date(2026, 8, 2), location_id=LOCATION_ID)
    assert LOCATION_ID in dashboard.reports.locations
    with pytest.raises(AppError) as missing:
        dashboard.summary(start_date=date(2026, 8, 1), end_date=date(2026, 8, 2), location_id=uuid4())
    assert missing.value.code == "LOCATION_NOT_FOUND"


def test_camide_and_trend_aggregations():
    dashboard = service()
    camide = dashboard.camide_summary(start_date=date(2026, 8, 1), end_date=date(2026, 8, 2))
    assert camide["total_identifications"] == 2
    assert camide["low_confidence_count"] == 1
    assert camide["categories"]["b3"] == 1

    trend = dashboard.waste_trend(period=TrendPeriod.DAILY, start_date=date(2026, 8, 1), end_date=date(2026, 8, 2))
    assert trend[0]["total"] == 20
    assert trend[1]["total"] == 10


class FakeDashboardEndpoint:
    def summary(self, **kwargs):
        return {
            "reports": {"total": 0, "reported": 0, "in_progress": 0, "resolved": 0, "resolution_rate": 0},
            "waste": {"total": 0, "organic": 0, "inorganic": 0, "residual": 0, "residual_percentage": 0, "diversion_rate": 0},
            "comparison": {"reports_change_percentage": None, "waste_change_percentage": None, "residual_change_percentage": None},
        }


def test_staff_can_access_dashboard_and_student_is_forbidden(client):
    app.dependency_overrides[get_services] = lambda: SimpleNamespace(dashboard=FakeDashboardEndpoint())
    app.dependency_overrides[get_current_user] = lambda: profile(Role.STAFF)
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 200
    assert response.json()["data"]["reports"]["total"] == 0

    app.dependency_overrides[get_current_user] = lambda: profile(Role.STUDENT)
    response = client.get("/api/v1/dashboard/summary")
    assert response.status_code == 403
