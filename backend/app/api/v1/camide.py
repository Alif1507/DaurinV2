from typing import Annotated

from fastapi import APIRouter, Depends, File, Query, UploadFile
from starlette.concurrency import run_in_threadpool

from app.core.dependencies import CurrentUser, require_roles
from app.schemas.camide import CamideIdentificationOut, CamidePrediction
from app.schemas.common import ListResponse, SingleResponse
from app.schemas.enums import Role
from app.schemas.user import Profile
from app.services.container import ServiceContainer, get_services


router = APIRouter(prefix="/camide", tags=["CAMIDE"])
Services = Annotated[ServiceContainer, Depends(get_services)]
StaffUser = Annotated[Profile, Depends(require_roles(Role.STAFF, Role.ADMIN))]


@router.post(
    "/identify",
    response_model=SingleResponse[CamidePrediction],
    description="Identify a detailed waste type and group it as Organik, Anorganik, B3, or Residu.",
)
async def identify_waste(
    current_user: CurrentUser,
    services: Services,
    file: Annotated[UploadFile, File(description="JPEG, PNG, or WebP; maximum 5 MB")],
) -> SingleResponse[CamidePrediction]:
    content = await file.read(services.settings.max_upload_bytes + 1)
    result = await run_in_threadpool(
        services.camide.identify,
        current_user,
        content,
        file.content_type,
    )
    message = "Waste identification completed" if result["is_confident"] else "Prediction confidence is low"
    return SingleResponse(data=result, message=message)


@router.get("/recent", response_model=ListResponse[CamideIdentificationOut])
def list_recent_identifications(
    _: StaffUser,
    services: Services,
    limit: Annotated[int, Query(ge=1, le=100)] = 25,
) -> ListResponse[CamideIdentificationOut]:
    return ListResponse(data=services.camide_repository.list_recent(limit=limit))
