from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.core.dependencies import require_roles
from app.schemas.common import CollectionResponse, SingleResponse
from app.schemas.enums import Role
from app.schemas.user import Profile, UserCreate, UserUpdate
from app.services.container import ServiceContainer, get_services
from app.utils.pagination import pagination_meta


router = APIRouter(prefix="/users", tags=["User Administration"])
Services = Annotated[ServiceContainer, Depends(get_services)]
AdminUser = Annotated[Profile, Depends(require_roles(Role.ADMIN))]


@router.get("", response_model=CollectionResponse[Profile])
def list_users(
    _: AdminUser,
    services: Services,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    role: Role | None = None,
    is_active: bool | None = None,
    search: Annotated[str | None, Query(max_length=150)] = None,
) -> CollectionResponse[Profile]:
    rows, total = services.profiles.list(
        page=page,
        limit=limit,
        role=role,
        is_active=is_active,
        search=search,
    )
    return CollectionResponse(data=rows, meta=pagination_meta(page, limit, total))


@router.post("", response_model=SingleResponse[Profile], status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    _: AdminUser,
    services: Services,
) -> SingleResponse[Profile]:
    return SingleResponse(data=services.users.create(payload), message="User created")


@router.patch("/{user_id}", response_model=SingleResponse[Profile])
def update_user(
    user_id: UUID,
    payload: UserUpdate,
    _: AdminUser,
    services: Services,
) -> SingleResponse[Profile]:
    return SingleResponse(data=services.users.update(user_id, payload), message="User updated")
