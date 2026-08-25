from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.dependencies import require_roles
from app.schemas.common import ListResponse, SingleResponse
from app.schemas.dashboard import DashboardSummary, ReportTrendPoint, WasteTrendPoint
from app.schemas.enums import Role, TrendPeriod
from app.schemas.user import Profile
from app.services.container import ServiceContainer, get_services
from app.utils.dates import validate_date_range


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
    validate_date_range(start_date, end_date)
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
) -> ListResponse[WasteTrendPoint]:
    validate_date_range(start_date, end_date)
    return ListResponse(
        data=services.dashboard.waste_trend(
            period=period,
            start_date=start_date,
            end_date=end_date,
        )
    )


@router.get("/report-trend", response_model=ListResponse[ReportTrendPoint])
def report_trend(
    _: StaffUser,
    services: Services,
    period: TrendPeriod = TrendPeriod.DAILY,
    start_date: date | None = None,
    end_date: date | None = None,
) -> ListResponse[ReportTrendPoint]:
    validate_date_range(start_date, end_date)
    return ListResponse(
        data=services.dashboard.report_trend(
            period=period,
            start_date=start_date,
            end_date=end_date,
        )
    )
