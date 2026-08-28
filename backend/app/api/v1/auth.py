from fastapi import APIRouter, Depends

from app.core.dependencies import CurrentUser
from app.schemas.common import SingleResponse
from app.core.config import Settings, get_settings
from app.core.exceptions import ConfigurationError
from app.schemas.user import AuthPublicConfig, Profile


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/config", response_model=SingleResponse[AuthPublicConfig])
def auth_public_config(settings: Settings = Depends(get_settings)) -> SingleResponse[AuthPublicConfig]:
    anon_key = settings.supabase_anon_key.get_secret_value()
    if not settings.supabase_url or not anon_key:
        raise ConfigurationError("Supabase public authentication is not configured")
    return SingleResponse(data={"supabase_url": settings.supabase_url, "supabase_anon_key": anon_key})


@router.get("/me", response_model=SingleResponse[Profile])
def get_me(current_user: CurrentUser) -> SingleResponse[Profile]:
    return SingleResponse(data=current_user)
