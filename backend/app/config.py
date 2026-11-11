from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "sqlite:///./specgate.db"
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


settings = Settings()
