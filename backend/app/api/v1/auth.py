from fastapi import APIRouter

from app.core.dependencies import CurrentUser
from app.schemas.common import SingleResponse
from app.schemas.user import Profile


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/me", response_model=SingleResponse[Profile])
def get_me(current_user: CurrentUser) -> SingleResponse[Profile]:
    return SingleResponse(data=current_user)
