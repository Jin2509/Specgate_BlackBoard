import os

os.environ["DATABASE_URL"] = "sqlite:///./test.db"

import pytest
from fastapi.testclient import TestClient

from app.config import settings
from app.db import Base, engine
from app.main import app


@pytest.fixture()
def client(monkeypatch):
    """API only: POST /api/v1/runs records the run without starting the pipeline."""
    monkeypatch.setattr(settings, "pipeline_enabled", False)
    Base.metadata.drop_all(engine)
    with TestClient(app) as c:
        yield c
