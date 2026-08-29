from datetime import date

import pytest

from app.core.exceptions import ConflictError
from app.schemas.enums import ReportStatus, TrendPeriod
from app.services.dashboard_service import (
    calculate_report_summary,
    calculate_waste_summary,
    period_label,
)
from app.services.report_service import ReportService, validate_report_transition


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
        {"id": "with-photo", "photo_path": "reports/one/photo.webp"},
        {"id": "without-photo", "photo_path": None},
    ])

    assert reports[0]["photo_url"] == "https://storage.example/reports/one/photo.webp?signed=true"
    assert reports[1]["photo_url"] is None


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
