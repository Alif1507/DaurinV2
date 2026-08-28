from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile
from starlette.concurrency import run_in_threadpool

from app.core.dependencies import CurrentUser
from app.schemas.camide import CamidePrediction
from app.schemas.common import SingleResponse
from app.services.container import ServiceContainer, get_services


router = APIRouter(prefix="/camide", tags=["CAMIDE"])
Services = Annotated[ServiceContainer, Depends(get_services)]


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
