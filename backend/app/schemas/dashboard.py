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
