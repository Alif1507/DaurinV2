from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Any
from uuid import UUID

from app.repositories.report_repository import ReportRepository
from app.repositories.waste_repository import WasteRepository
from app.schemas.enums import ReportStatus, TrendPeriod


def calculate_report_summary(rows: list[dict[str, Any]]) -> dict[str, int | float]:
    counts = {status.value: 0 for status in ReportStatus}
    for row in rows:
        status = row.get("status")
        if status in counts:
            counts[status] += 1
    total = sum(counts.values())
    return {
        "total": total,
        "reported": counts[ReportStatus.REPORTED.value],
        "in_progress": counts[ReportStatus.IN_PROGRESS.value],
        "resolved": counts[ReportStatus.RESOLVED.value],
        "resolution_rate": round(counts[ReportStatus.RESOLVED.value] / total * 100, 2) if total else 0.0,
    }


def calculate_waste_summary(rows: list[dict[str, Any]]) -> dict[str, float]:
    organic = sum(float(row.get("organic_weight") or 0) for row in rows)
    inorganic = sum(float(row.get("inorganic_weight") or 0) for row in rows)
    residual = sum(float(row.get("residual_weight") or 0) for row in rows)
    total = organic + inorganic + residual
    return {
        "total": round(total, 2),
        "organic": round(organic, 2),
        "inorganic": round(inorganic, 2),
        "residual": round(residual, 2),
        "residual_percentage": round(residual / total * 100, 2) if total else 0.0,
        "diversion_rate": round((organic + inorganic) / total * 100, 2) if total else 0.0,
    }


def period_label(value: date | datetime | str, period: TrendPeriod) -> str:
    if isinstance(value, str):
        value = datetime.fromisoformat(value.replace("Z", "+00:00"))
    day = value.date() if isinstance(value, datetime) else value
    if period == TrendPeriod.DAILY:
        return day.isoformat()
    if period == TrendPeriod.WEEKLY:
        return (day - timedelta(days=day.weekday())).isoformat()
    return day.strftime("%Y-%m")


class DashboardService:
    def __init__(self, reports: ReportRepository, waste: WasteRepository) -> None:
        self.reports = reports
        self.waste = waste

    def summary(
        self,
        *,
        start_date: date | None,
        end_date: date | None,
        location_id: UUID | None,
    ) -> dict:
        report_rows = self.reports.aggregate_rows(
            start_date=start_date, end_date=end_date, location_id=location_id
        )
        waste_rows = self.waste.aggregate_rows(
            start_date=start_date, end_date=end_date, location_id=location_id
        )
        return {
            "reports": calculate_report_summary(report_rows),
            "waste": calculate_waste_summary(waste_rows),
        }

    def waste_trend(
        self,
        *,
        period: TrendPeriod,
        start_date: date | None,
        end_date: date | None,
    ) -> list[dict]:
        rows = self.waste.aggregate_rows(start_date=start_date, end_date=end_date, location_id=None)
        buckets: dict[str, dict[str, float]] = defaultdict(
            lambda: {"organic": 0.0, "inorganic": 0.0, "residual": 0.0}
        )
        for row in rows:
            label = period_label(row["record_date"], period)
            buckets[label]["organic"] += float(row.get("organic_weight") or 0)
            buckets[label]["inorganic"] += float(row.get("inorganic_weight") or 0)
            buckets[label]["residual"] += float(row.get("residual_weight") or 0)
        return [
            {
                "label": label,
                "organic": round(values["organic"], 2),
                "inorganic": round(values["inorganic"], 2),
                "residual": round(values["residual"], 2),
                "total": round(sum(values.values()), 2),
            }
            for label, values in sorted(buckets.items())
        ]

    def report_trend(
        self,
        *,
        period: TrendPeriod,
        start_date: date | None,
        end_date: date | None,
    ) -> list[dict]:
        rows = self.reports.aggregate_rows(start_date=start_date, end_date=end_date, location_id=None)
        buckets: dict[str, dict[str, int]] = defaultdict(lambda: {"created": 0, "resolved": 0})
        for row in rows:
            buckets[period_label(row["created_at"], period)]["created"] += 1
            if row.get("resolved_at"):
                buckets[period_label(row["resolved_at"], period)]["resolved"] += 1
        return [
            {"label": label, "created": values["created"], "resolved": values["resolved"]}
            for label, values in sorted(buckets.items())
        ]
