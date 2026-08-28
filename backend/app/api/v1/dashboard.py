from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.dependencies import require_roles
from app.schemas.common import ListResponse, SingleResponse
from app.schemas.dashboard import (
    CamideDashboardSummary,
    CamideTrendPoint,
    DashboardSummary,
    LocationDashboardItem,
    ReportTrendPoint,
    WasteTrendPoint,
)
from app.schemas.enums import Role, TrendPeriod
from app.schemas.user import Profile
from app.services.container import ServiceContainer, get_services


router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
Services = Annotated[ServiceContainer, Depends(get_services)]
StaffUser = Annotated[Profile, Depends(require_roles(Role.STAFF, Role.ADMIN))]


@router.get("/summary", response_model=SingleResponse[DashboardSummary])
def dashboard_summary(
    _: StaffUser,
    services: Services,
    start_date: date | None = None,
    end_date: date | None = None,
    location_id: UUID | None = None,
) -> SingleResponse[DashboardSummary]:
    return SingleResponse(
        data=services.dashboard.summary(
            start_date=start_date,
            end_date=end_date,
            location_id=location_id,
        )
    )


@router.get("/waste-trend", response_model=ListResponse[WasteTrendPoint])
def waste_trend(
    _: StaffUser,
    services: Services,
    period: TrendPeriod = TrendPeriod.DAILY,
    start_date: date | None = None,
    end_date: date | None = None,
    location_id: UUID | None = None,
) -> ListResponse[WasteTrendPoint]:
    return ListResponse(
        data=services.dashboard.waste_trend(
            period=period,
            start_date=start_date,
            end_date=end_date,
            location_id=location_id,
        )
    )


@router.get("/report-trend", response_model=ListResponse[ReportTrendPoint])
def report_trend(
    _: StaffUser,
    services: Services,
    period: TrendPeriod = TrendPeriod.DAILY,
    start_date: date | None = None,
    end_date: date | None = None,
    location_id: UUID | None = None,
) -> ListResponse[ReportTrendPoint]:
    return ListResponse(
        data=services.dashboard.report_trend(
            period=period,
            start_date=start_date,
            end_date=end_date,
            location_id=location_id,
        )
    )


@router.get("/camide-summary", response_model=SingleResponse[CamideDashboardSummary])
def camide_summary(
    _: StaffUser,
    services: Services,
    start_date: date | None = None,
    end_date: date | None = None,
) -> SingleResponse[CamideDashboardSummary]:
    return SingleResponse(data=services.dashboard.camide_summary(start_date=start_date, end_date=end_date))


@router.get("/camide-trend", response_model=ListResponse[CamideTrendPoint])
def camide_trend(
    _: StaffUser,
    services: Services,
    period: TrendPeriod = TrendPeriod.DAILY,
    start_date: date | None = None,
    end_date: date | None = None,
) -> ListResponse[CamideTrendPoint]:
    return ListResponse(
        data=services.dashboard.camide_trend(period=period, start_date=start_date, end_date=end_date)
    )


@router.get("/locations", response_model=ListResponse[LocationDashboardItem])
def location_performance(
    _: StaffUser,
    services: Services,
    start_date: date | None = None,
    end_date: date | None = None,
) -> ListResponse[LocationDashboardItem]:
    return ListResponse(data=services.dashboard.location_performance(start_date=start_date, end_date=end_date))
