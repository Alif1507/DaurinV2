from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status

from app.core.dependencies import CurrentUser, require_roles
from app.schemas.common import ListResponse, SingleResponse
from app.schemas.enums import Role, WasteCategory
from app.schemas.guide import GuideCreate, GuideOut, GuideUpdate
from app.schemas.user import Profile
from app.services.container import ServiceContainer, get_services


router = APIRouter(prefix="/guides", tags=["Waste Sorting Guide"])
Services = Annotated[ServiceContainer, Depends(get_services)]
AdminUser = Annotated[Profile, Depends(require_roles(Role.ADMIN))]


@router.get("", response_model=ListResponse[GuideOut])
def list_guides(
    _: CurrentUser,
    services: Services,
    search: Annotated[str | None, Query(max_length=150)] = None,
    category: WasteCategory | None = None,
) -> ListResponse[GuideOut]:
    return ListResponse(data=services.guides_repository.list(search, category))


@router.post("", response_model=SingleResponse[GuideOut], status_code=status.HTTP_201_CREATED)
def create_guide(
    payload: GuideCreate,
    _: AdminUser,
    services: Services,
) -> SingleResponse[GuideOut]:
    return SingleResponse(data=services.guides.create(payload), message="Waste guide created")


@router.patch("/{guide_id}", response_model=SingleResponse[GuideOut])
def update_guide(
    guide_id: UUID,
    payload: GuideUpdate,
    _: AdminUser,
    services: Services,
) -> SingleResponse[GuideOut]:
    return SingleResponse(data=services.guides.update(guide_id, payload), message="Waste guide updated")


@router.delete("/{guide_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_guide(guide_id: UUID, _: AdminUser, services: Services) -> Response:
    services.guides.deactivate(guide_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
