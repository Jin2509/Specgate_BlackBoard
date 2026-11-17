from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./specgate.db"
    # Version prefix of every HTTP route; the Next.js app calls the same prefix.
    api_prefix: str = "/api/v1"
    cors_origins: list[str] = ["http://localhost:3000"]

    # ADOM pipeline (spec-gate repo). Every pipeline command runs with cwd=adom_dir.
    adom_dir: Path = Path("../../spec-gate/adom")
    runs_dir: Path = Path("./data/runs")
    adom_tasks_dir: str = "config/tasks"
    llm_fixtures: str | None = None
    dataset_file: str | None = None
    holdout_max: int = 200
    pipeline_enabled: bool = True

    # Models the UI may pick (GET /api/settings, /api/experiments/options), e.g.
    # MODEL_CATALOG=[{"id":"gpt-4o-mini","name":"GPT-4o mini","family":"openai"}]
    # Ids are passed to ADOM as CODER_MODEL / SPEC_MODEL.
    model_catalog: list[dict[str, str]] = []
    # Baselines an experiment may ask for; any of them turns on ADOM's --ablation.
    baselines: list[str] = ["llm_judge"]

    # ---------- SpecGate Workspace (app/ws) ----------
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

    # ADOM trial runs from the web (flow §13). Fake: simulated, deterministic (dev, CI). Otherwise the real pipeline
    # runs with the ADOM team's keys and config installed on the server; members' keys are never used.
    adom_trial_fake: bool = False
    adom_trial_max_tasks: int = 5
    adom_trial_fake_step_s: float = 0.8
    adom_trial_timeout_s: float = 1800.0


settings = Settings()
