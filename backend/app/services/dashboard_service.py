from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import Any
from uuid import UUID

from app.core.config import Settings
from app.core.exceptions import AppError, NotFoundError
from app.repositories.camide_repository import CamideRepository
from app.repositories.location_repository import LocationRepository
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


def percentage_change(current: float, previous: float) -> float | None:
    if previous == 0:
        return None
    return round((current - previous) / previous * 100, 2)


def resolve_date_range(
    start_date: date | None,
    end_date: date | None,
    *,
    default_days: int,
    max_days: int,
) -> tuple[date, date]:
    resolved_end = end_date or date.today()
    resolved_start = start_date or (resolved_end - timedelta(days=default_days - 1))
    if resolved_start > resolved_end:
        raise AppError("INVALID_DATE_RANGE", "start_date must be before or equal to end_date", 400)
    if (resolved_end - resolved_start).days + 1 > max_days:
        raise AppError("DATE_RANGE_TOO_LARGE", f"Dashboard date range cannot exceed {max_days} days", 400)
    return resolved_start, resolved_end


class DashboardService:
    def __init__(
        self,
        reports: ReportRepository,
        waste: WasteRepository,
        camide: CamideRepository,
        locations: LocationRepository,
        settings: Settings,
    ) -> None:
        self.reports = reports
        self.waste = waste
        self.camide = camide
        self.locations = locations
        self.settings = settings

    def filters(self, start_date: date | None, end_date: date | None, location_id: UUID | None) -> tuple[date, date]:
        resolved = resolve_date_range(
            start_date,
            end_date,
            default_days=self.settings.dashboard_default_days,
            max_days=self.settings.dashboard_max_range_days,
        )
        if location_id and self.locations.get(location_id) is None:
            raise NotFoundError("LOCATION_NOT_FOUND", "Location not found")
        return resolved

    def summary(
        self,
        *,
        start_date: date | None,
        end_date: date | None,
        location_id: UUID | None,
    ) -> dict:
        start_date, end_date = self.filters(start_date, end_date, location_id)
        report_rows = self.reports.aggregate_rows(
            start_date=start_date, end_date=end_date, location_id=location_id
        )
        waste_rows = self.waste.aggregate_rows(
            start_date=start_date, end_date=end_date, location_id=location_id
        )
        report_summary = calculate_report_summary(report_rows)
        waste_summary = calculate_waste_summary(waste_rows)

        days = (end_date - start_date).days + 1
        previous_end = start_date - timedelta(days=1)
        previous_start = previous_end - timedelta(days=days - 1)
        previous_reports = calculate_report_summary(
            self.reports.aggregate_rows(
                start_date=previous_start,
                end_date=previous_end,
                location_id=location_id,
            )
        )
        previous_waste = calculate_waste_summary(
            self.waste.aggregate_rows(
                start_date=previous_start,
                end_date=previous_end,
                location_id=location_id,
            )
        )
        return {
            "reports": report_summary,
            "waste": waste_summary,
            "comparison": {
                "reports_change_percentage": percentage_change(report_summary["total"], previous_reports["total"]),
                "waste_change_percentage": percentage_change(waste_summary["total"], previous_waste["total"]),
                "residual_change_percentage": percentage_change(
                    waste_summary["residual_percentage"], previous_waste["residual_percentage"]
                ),
            },
        }

    def waste_trend(
        self,
        *,
        period: TrendPeriod,
        start_date: date | None,
        end_date: date | None,
        location_id: UUID | None = None,
    ) -> list[dict]:
        start_date, end_date = self.filters(start_date, end_date, location_id)
        rows = self.waste.aggregate_rows(start_date=start_date, end_date=end_date, location_id=location_id)
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
        location_id: UUID | None = None,
    ) -> list[dict]:
        start_date, end_date = self.filters(start_date, end_date, location_id)
        rows = self.reports.aggregate_rows(start_date=start_date, end_date=end_date, location_id=location_id)
        buckets: dict[str, dict[str, int]] = defaultdict(lambda: {"created": 0, "resolved": 0})
        for row in rows:
            buckets[period_label(row["created_at"], period)]["created"] += 1
            if row.get("resolved_at"):
                buckets[period_label(row["resolved_at"], period)]["resolved"] += 1
        return [
            {"label": label, "created": values["created"], "resolved": values["resolved"]}
            for label, values in sorted(buckets.items())
        ]

    def camide_summary(self, *, start_date: date | None, end_date: date | None) -> dict:
        start_date, end_date = self.filters(start_date, end_date, None)
        rows = self.camide.aggregate_rows(start_date=start_date, end_date=end_date)
        categories = {"organic": 0, "inorganic": 0, "b3": 0, "residual": 0}
        confident_count = 0
        confidence_total = 0.0
        for row in rows:
            category = row.get("category")
            if category in categories:
                categories[category] += 1
            confident_count += int(bool(row.get("is_confident")))
            confidence_total += float(row.get("confidence") or 0)
        top_category = max(categories, key=categories.get) if rows and any(categories.values()) else None
        return {
            "total_identifications": len(rows),
            "average_confidence": round(confidence_total / len(rows), 4) if rows else 0.0,
            "confident_count": confident_count,
            "low_confidence_count": len(rows) - confident_count,
            "top_category": top_category,
            "categories": categories,
        }

    def camide_trend(
        self,
        *,
        period: TrendPeriod,
        start_date: date | None,
        end_date: date | None,
    ) -> list[dict]:
        start_date, end_date = self.filters(start_date, end_date, None)
        rows = self.camide.aggregate_rows(start_date=start_date, end_date=end_date)
        buckets: dict[str, int] = defaultdict(int)
        for row in rows:
            buckets[period_label(row["created_at"], period)] += 1
        return [{"label": label, "count": count} for label, count in sorted(buckets.items())]

    def location_performance(self, *, start_date: date | None, end_date: date | None) -> list[dict]:
        start_date, end_date = self.filters(start_date, end_date, None)
        report_rows = self.reports.aggregate_rows(start_date=start_date, end_date=end_date, location_id=None)
        waste_rows = self.waste.aggregate_rows(start_date=start_date, end_date=end_date, location_id=None)
        report_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
        waste_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
        for row in report_rows:
            report_groups[str(row["location_id"])].append(row)
        for row in waste_rows:
            waste_groups[str(row["location_id"])].append(row)

        items = []
        for location in self.locations.list_active():
            location_id = str(location["id"])
            report_summary = calculate_report_summary(report_groups[location_id])
            waste_summary = calculate_waste_summary(waste_groups[location_id])
            items.append(
                {
                    "location_id": location_id,
                    "location_name": location["name"],
                    "reports": report_summary["total"],
                    "resolved_reports": report_summary["resolved"],
                    "resolution_rate": report_summary["resolution_rate"],
                    "total_waste": waste_summary["total"],
                    "residual_waste": waste_summary["residual"],
                    "residual_percentage": waste_summary["residual_percentage"],
                }
            )
        return sorted(items, key=lambda item: (item["reports"] + item["total_waste"]), reverse=True)
