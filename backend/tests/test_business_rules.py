from datetime import date
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.core.exceptions import AuthorizationError, ConflictError
from app.schemas.enums import ReportStatus, Role, TrendPeriod
from app.schemas.user import Profile
from app.schemas.waste import WasteRecordUpdate
from app.services.dashboard_service import (
    calculate_report_summary,
    calculate_waste_summary,
    period_label,
)
from app.services.report_service import ReportService, validate_report_transition
from app.services.waste_service import WasteService


def test_report_transition_sequence():
    validate_report_transition(ReportStatus.REPORTED, ReportStatus.IN_PROGRESS)
    validate_report_transition(ReportStatus.IN_PROGRESS, ReportStatus.RESOLVED)
    with pytest.raises(ConflictError):
        validate_report_transition(ReportStatus.REPORTED, ReportStatus.RESOLVED)


def test_report_list_receives_signed_photo_urls():
    class FakeStorage:
        def signed_url(self, path):
            return f"https://storage.example/{path}?signed=true"

    service = ReportService(None, None, FakeStorage(), None)
    reports = service.with_signed_urls([
        {
            "id": "with-photo",
            "photo_path": "reports/one/photo.webp",
            "resolution_photo_path": "reports/one/resolution/proof.webp",
        },
        {"id": "without-photo", "photo_path": None},
    ])

    assert reports[0]["photo_url"] == "https://storage.example/reports/one/photo.webp?signed=true"
    assert reports[0]["resolution_photo_url"] == "https://storage.example/reports/one/resolution/proof.webp?signed=true"
    assert reports[1]["photo_url"] is None
    assert reports[1]["resolution_photo_url"] is None


def test_staff_resolution_uploads_proof_and_transitions_report():
    staff_id = uuid4()
    report_id = uuid4()

    class FakeRepository:
        transition_payload = None

        def get(self, _report_id):
            return {
                "id": str(report_id),
                "status": "in_progress",
                "handled_by": str(staff_id),
                "photo_path": None,
                "resolution_photo_path": None,
            }

        def transition(self, _report_id, expected_status, payload):
            assert expected_status == ReportStatus.IN_PROGRESS
            self.transition_payload = payload
            return {**self.get(_report_id), **payload}

    class FakeStorage:
        uploaded_path = None

        def upload(self, path, content, content_type):
            self.uploaded_path = path
            assert content == b"\x89PNG\r\n\x1a\n"
            assert content_type == "image/png"

        def remove(self, _path):
            raise AssertionError("Successful upload should not be removed")

        def signed_url(self, path):
            return f"https://storage.example/{path}?signed=true"

    repository = FakeRepository()
    storage = FakeStorage()
    service = ReportService(repository, None, storage, SimpleNamespace(max_upload_bytes=5 * 1024 * 1024))
    staff = Profile(id=staff_id, full_name="Staff Test", email="staff@example.com", role=Role.STAFF, is_active=True)

    result = service.resolve_with_proof(report_id, "Area sudah dibersihkan", staff, b"\x89PNG\r\n\x1a\n", "image/png")

    assert repository.transition_payload["status"] == "resolved"
    assert repository.transition_payload["resolution_photo_path"] == storage.uploaded_path
    assert result["resolution_photo_url"].startswith("https://storage.example/reports/")


def test_staff_can_only_update_own_waste_record():
    owner = profile = Profile(id=uuid4(), full_name="Owner", email="owner@example.com", role=Role.STAFF, is_active=True)
    other_staff = Profile(id=uuid4(), full_name="Other", email="other@example.com", role=Role.STAFF, is_active=True)

    class FakeRepository:
        def get(self, _record_id):
            return {
                "id": str(_record_id),
                "recorded_by": str(owner.id),
                "organic_weight": 1,
                "inorganic_weight": 0,
                "residual_weight": 0,
            }

        def update(self, _record_id, payload):
            return {**self.get(_record_id), **payload}

    service = WasteService(FakeRepository(), None)
    record_id = uuid4()

    result = service.update(record_id, WasteRecordUpdate(organic_weight=2), profile)
    assert result["organic_weight"] == "2"

    with pytest.raises(AuthorizationError):
        service.update(record_id, WasteRecordUpdate(organic_weight=3), other_staff)


def test_dashboard_formulas():
    reports = calculate_report_summary(
        [{"status": "reported"}, {"status": "resolved"}, {"status": "resolved"}]
    )
    assert reports["resolution_rate"] == 66.67

    waste = calculate_waste_summary(
        [{"organic_weight": 40, "inorganic_weight": 55, "residual_weight": 25}]
    )
    assert waste["total"] == 120
    assert waste["residual_percentage"] == 20.83
    assert waste["diversion_rate"] == 79.17


def test_weekly_and_monthly_period_labels():
    assert period_label(date(2026, 8, 25), TrendPeriod.WEEKLY) == "2026-08-24"
    assert period_label(date(2026, 8, 25), TrendPeriod.MONTHLY) == "2026-08"
