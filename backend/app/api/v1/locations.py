from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status

from app.core.dependencies import CurrentUser, require_roles
from app.schemas.common import ListResponse, SingleResponse
from app.schemas.enums import Role
from app.schemas.location import LocationCreate, LocationOut, LocationUpdate
from app.schemas.user import Profile
from app.services.container import ServiceContainer, get_services


router = APIRouter(prefix="/locations", tags=["Locations"])
Services = Annotated[ServiceContainer, Depends(get_services)]
AdminUser = Annotated[Profile, Depends(require_roles(Role.ADMIN))]


@router.get("", response_model=ListResponse[LocationOut])
def list_locations(_: CurrentUser, services: Services) -> ListResponse[LocationOut]:
    return ListResponse(data=services.locations_repository.list_active())


@router.post("", response_model=SingleResponse[LocationOut], status_code=status.HTTP_201_CREATED)
def create_location(
    payload: LocationCreate,
    _: AdminUser,
    services: Services,
) -> SingleResponse[LocationOut]:
    return SingleResponse(data=services.locations.create(payload), message="Location created")


@router.patch("/{location_id}", response_model=SingleResponse[LocationOut])
def update_location(
    location_id: UUID,
    payload: LocationUpdate,
    _: AdminUser,
    services: Services,
) -> SingleResponse[LocationOut]:
    return SingleResponse(data=services.locations.update(location_id, payload), message="Location updated")


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_location(location_id: UUID, _: AdminUser, services: Services) -> Response:
    services.locations.deactivate(location_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
