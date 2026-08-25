from typing import Any

from app.core.config import Settings
from app.core.exceptions import ConfigurationError


class SupabaseGateway:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._auth_client: Any | None = None
        self._admin_client: Any | None = None

    def _ensure_configured(self) -> None:
        if not self.settings.supabase_configured:
            raise ConfigurationError(
                "Set SUPABASE_URL, SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY"
            )

    @property
    def auth_client(self) -> Any:
        self._ensure_configured()
        if self._auth_client is None:
            from supabase import ClientOptions, create_client

            self._auth_client = create_client(
                self.settings.supabase_url,
                self.settings.supabase_anon_key.get_secret_value(),
                options=ClientOptions(auto_refresh_token=False, persist_session=False),
            )
        return self._auth_client

    @property
    def admin_client(self) -> Any:
        self._ensure_configured()
        if self._admin_client is None:
            from supabase import ClientOptions, create_client

            self._admin_client = create_client(
                self.settings.supabase_url,
                self.settings.supabase_service_role_key.get_secret_value(),
                options=ClientOptions(auto_refresh_token=False, persist_session=False),
            )
        return self._admin_client
