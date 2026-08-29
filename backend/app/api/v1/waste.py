from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.core.dependencies import require_roles
from app.schemas.common import CollectionResponse, SingleResponse
from app.schemas.enums import Role
from app.schemas.user import Profile
from app.schemas.waste import WasteRecordCreate, WasteRecordOut, WasteRecordUpdate
from app.services.container import ServiceContainer, get_services
from app.utils.dates import validate_date_range
from app.utils.pagination import pagination_meta


router = APIRouter(prefix="/waste-records", tags=["Waste Records"])
Services = Annotated[ServiceContainer, Depends(get_services)]
StaffUser = Annotated[Profile, Depends(require_roles(Role.STAFF, Role.ADMIN))]


@router.post("", response_model=SingleResponse[WasteRecordOut], status_code=status.HTTP_201_CREATED)
def create_waste_record(
    payload: WasteRecordCreate,
    current_user: StaffUser,
    services: Services,
) -> SingleResponse[WasteRecordOut]:
    return SingleResponse(data=services.waste.create(payload, current_user), message="Waste record created")


@router.get("", response_model=CollectionResponse[WasteRecordOut])
def list_waste_records(
    _: StaffUser,
    services: Services,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    location_id: UUID | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
) -> CollectionResponse[WasteRecordOut]:
    validate_date_range(start_date, end_date)
    rows, total = services.waste_repository.list(
        page=page,
        limit=limit,
        location_id=location_id,
        start_date=start_date,
        end_date=end_date,
    )
    return CollectionResponse(data=rows, meta=pagination_meta(page, limit, total))


@router.get("/{record_id}", response_model=SingleResponse[WasteRecordOut])
def get_waste_record(
    record_id: UUID,
    _: StaffUser,
    services: Services,
) -> SingleResponse[WasteRecordOut]:
    return SingleResponse(data=services.waste.get(record_id))


@router.patch("/{record_id}", response_model=SingleResponse[WasteRecordOut])
def update_waste_record(
    record_id: UUID,
    payload: WasteRecordUpdate,
    current_user: StaffUser,
    services: Services,
) -> SingleResponse[WasteRecordOut]:
    return SingleResponse(data=services.waste.update(record_id, payload, current_user), message="Waste record updated")


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_waste_record(record_id: UUID, current_user: StaffUser, services: Services) -> Response:
    services.waste.delete(record_id, current_user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
