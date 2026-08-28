from uuid import UUID

from pydantic import BaseModel


class ReportSummary(BaseModel):
    total: int
    reported: int
    in_progress: int
    resolved: int
    resolution_rate: float


class WasteSummary(BaseModel):
    total: float
    organic: float
    inorganic: float
    residual: float
    residual_percentage: float
    diversion_rate: float


class DashboardSummary(BaseModel):
    reports: ReportSummary
    waste: WasteSummary
    comparison: "DashboardComparison"


class DashboardComparison(BaseModel):
    reports_change_percentage: float | None = None
    waste_change_percentage: float | None = None
    residual_change_percentage: float | None = None


class WasteTrendPoint(BaseModel):
    label: str
    organic: float
    inorganic: float
    residual: float
    total: float


class ReportTrendPoint(BaseModel):
    label: str
    created: int
    resolved: int


class CamideCategoryCounts(BaseModel):
    organic: int
    inorganic: int
    b3: int
    residual: int


class CamideDashboardSummary(BaseModel):
    total_identifications: int
    average_confidence: float
    confident_count: int
    low_confidence_count: int
    top_category: str | None = None
    categories: CamideCategoryCounts


class CamideTrendPoint(BaseModel):
    label: str
    count: int


class LocationDashboardItem(BaseModel):
    location_id: UUID
    location_name: str
    reports: int
    resolved_reports: int
    resolution_rate: float
    total_waste: float
    residual_waste: float
    residual_percentage: float
