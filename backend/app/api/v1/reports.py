from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.core.dependencies import CurrentUser, require_roles
from app.schemas.common import CollectionResponse, SingleResponse
from app.schemas.enums import ProblemType, ReportStatus, Role
from app.schemas.report import ReportCreate, ReportOut, ReportResolve
from app.schemas.user import Profile
from app.services.container import ServiceContainer, get_services
from app.utils.dates import validate_date_range
from app.utils.pagination import pagination_meta


router = APIRouter(prefix="/reports", tags=["Cleanliness Reports"])
Services = Annotated[ServiceContainer, Depends(get_services)]
StaffUser = Annotated[Profile, Depends(require_roles(Role.STAFF, Role.ADMIN))]


@router.post("", response_model=SingleResponse[ReportOut], status_code=status.HTTP_201_CREATED)
def create_report(
    payload: ReportCreate,
    current_user: CurrentUser,
    services: Services,
) -> SingleResponse[ReportOut]:
    return SingleResponse(data=services.reports.create(payload, current_user), message="Report created")


@router.post("/{report_id}/image", response_model=SingleResponse[ReportOut])
async def upload_report_image(
    report_id: UUID,
    current_user: CurrentUser,
    services: Services,
    file: Annotated[UploadFile, File(description="JPEG, PNG, or WebP; maximum 5 MB")],
) -> SingleResponse[ReportOut]:
    content = await file.read(services.settings.max_upload_bytes + 1)
    result = await run_in_threadpool(
        services.reports.upload_image,
        report_id,
        current_user,
        content,
        file.content_type,
    )
    return SingleResponse(data=result, message="Report image uploaded")


@router.get("/me", response_model=CollectionResponse[ReportOut])
def list_my_reports(
    current_user: CurrentUser,
    services: Services,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    report_status: Annotated[ReportStatus | None, Query(alias="status")] = None,
) -> CollectionResponse[ReportOut]:
    rows, total = services.reports_repository.list(
        page=page,
        limit=limit,
        reporter_id=current_user.id,
        status=report_status,
    )
    return CollectionResponse(
        data=services.reports.with_signed_urls(rows),
        meta=pagination_meta(page, limit, total),
    )


@router.get("", response_model=CollectionResponse[ReportOut])
def list_all_reports(
    _: StaffUser,
    services: Services,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    report_status: Annotated[ReportStatus | None, Query(alias="status")] = None,
    location_id: UUID | None = None,
    problem_type: ProblemType | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
) -> CollectionResponse[ReportOut]:
    validate_date_range(date_from, date_to)
    rows, total = services.reports_repository.list(
        page=page,
        limit=limit,
        status=report_status,
        location_id=location_id,
        problem_type=problem_type,
        date_from=date_from,
        date_to=date_to,
    )
    return CollectionResponse(
        data=services.reports.with_signed_urls(rows),
        meta=pagination_meta(page, limit, total),
    )


@router.get("/{report_id}", response_model=SingleResponse[ReportOut])
def get_report(
    report_id: UUID,
    current_user: CurrentUser,
    services: Services,
) -> SingleResponse[ReportOut]:
    return SingleResponse(data=services.reports.get_authorized(report_id, current_user))


@router.patch("/{report_id}/start", response_model=SingleResponse[ReportOut])
def start_report(
    report_id: UUID,
    current_user: StaffUser,
    services: Services,
) -> SingleResponse[ReportOut]:
    return SingleResponse(data=services.reports.start(report_id, current_user), message="Report started")


@router.patch("/{report_id}/resolve", response_model=SingleResponse[ReportOut])
def resolve_report(
    report_id: UUID,
    payload: ReportResolve,
    _: StaffUser,
    services: Services,
) -> SingleResponse[ReportOut]:
    return SingleResponse(
        data=services.reports.resolve(report_id, payload.resolution_note),
        message="Report resolved",
    )
