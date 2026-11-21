# Loads typed backend settings from the environment and .env file.
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./specgate.db"
    # Version prefix of every HTTP route; the Next.js app calls the same prefix.
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000"]

    # Signs session tokens and derives the key that encrypts stored API keys. MUST be set in production.
    secret_key: str = "dev-secret-change-me"
    # Fernet key (urlsafe base64, 32 bytes) for stored API keys; derived from secret_key when empty.
    key_encryption_key: str = ""
    session_ttl_days: int = 30
    cookie_secure: bool = False
    # Where the browser goes after OAuth (the Next.js app) and the public URL of this API (OAuth callbacks).
    frontend_url: str = "http://localhost:3000"
    public_api_url: str = "http://localhost:8000"
    # OAuth apps. A provider without client id/secret answers 501 on /api/auth/{provider}/start.
    google_client_id: str = ""
    google_client_secret: str = ""
    github_client_id: str = ""
    github_client_secret: str = ""
    # Dev/test only: POST /api/auth/dev-login stands in for the provider step (same as the UI's mock form).
    auth_dev_login: bool = True

    # Email one-time codes, needed to sign in by email and to create accounts on the simulated provider screen.
    # Without smtp_host and smtp_from_address both are off. Port 465 uses implicit TLS, any other port STARTTLS.
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_address: str = ""
    email_code_ttl_minutes: int = 10
    email_code_attempts_max: int = 5        # wrong guesses before the code is void
    email_code_resend_seconds: int = 60     # wait before asking for another code
    email_codes_per_hour_max: int = 5       # codes sent to one address per hour

    # LLM gateway. llm_fake=true: deterministic agent for dev and CI (no network, no cost); key rules match the UI mock:
    # shorter than 20 chars -> invalid, ending in "0000" -> out of quota.
    llm_fake: bool = False
    llm_timeout_s: float = 60.0
    llm_max_tokens: int = 2048
    anthropic_base_url: str = "https://api.anthropic.com"
    openai_base_url: str = "https://api.openai.com/v1"
    # openai-compatible base URLs pointing at private/loopback addresses (e.g. local Ollama) are refused unless true.
    allow_private_base_urls: bool = False
    # Group context limits (NFR-07): newest own messages kept; highlights are never cut.
    context_own_messages_max: int = 50
    # "Tóm tắt tin cũ" (flow §5): a block of old messages shorter than this is sent word for word, not summarized.
    digest_block_min: int = 5
    # Limits proposed in docs/flow.md (open point 7).
    private_highlights_max: int = 200       # "Highlight riêng" per person
    agent_highlights_max: int = 30          # "Highlight cho agent" per person and workspace
    owned_workspaces_max: int = 10          # shared workspaces one person owns
    summary_attached_turns_max: int = 4     # original turns attached to a "Tóm tắt cho nhóm"
    conversation_history_turns_max: int = 40   # newest turns sent back to the model (flow §4, open point 1)


settings = Settings()
