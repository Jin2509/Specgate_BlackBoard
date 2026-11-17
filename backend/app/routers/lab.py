"""Settings and fault injection."""

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import lab_settings
from app.db import get_session
from app.errors import ApiError, engine_not_configured
from app.schemas import FaultProfile, LabSettings

router = APIRouter(tags=["lab"])


@router.get("/settings")
def get_settings(session: Session = Depends(get_session)) -> dict[str, Any]:
    return lab_settings.response(session)


@router.put("/settings")
def put_settings(body: LabSettings, session: Session = Depends(get_session)) -> dict[str, Any]:
    ids = lab_settings.model_ids()
    for label, model in (("defaultCoderModel", body.default_coder_model), ("defaultSpecModel", body.default_spec_model)):
        if model not in ids:
            raise ApiError(400, f'{label} "{model}" không có trong danh mục model (MODEL_CATALOG).')
    lab_settings.save(session, body.model_dump(by_alias=True))
    return lab_settings.response(session)


# Fault kinds ADOM can inject (harness.inject): --fault injected-spec / injected-code. No trusted-base faults.
_FAULTS = {
    "specFaults": [{"value": "none", "label": "Không tiêm"},
                   {"value": "injected_spec", "label": "Đột biến P0 (harness.inject.inject_spec)"}],
    "codeFaults": [{"value": "none", "label": "Không tiêm"},
                   {"value": "injected_code", "label": "Đột biến C bị P0 bác bỏ (harness.inject.code_mutants)"}],
    "trustedFaults": [{"value": "none", "label": "Không tiêm"}],
}


@router.get("/fault-injection")
def fault_injection_state() -> dict[str, Any]:
    return {"options": _FAULTS, "defaults": {"specFault": "none", "codeFault": "none", "trustedFault": "none"},
            "metrics": {"misattributionRate": 0, "faultyPatchSlipRate": 0, "gateBlockedCount": 0,
                        "totalInjections": 0}}


@router.post("/fault-injection")
def run_fault_injection(body: FaultProfile) -> dict[str, Any]:
    allowed = {k: {o["value"] for o in v} for k, v in _FAULTS.items()}
    if (body.spec_fault not in allowed["specFaults"] or body.code_fault not in allowed["codeFaults"]
            or body.trusted_fault not in allowed["trustedFaults"]):
        raise ApiError(400, "Profile tiêm lỗi không hợp lệ.")
    raise engine_not_configured(
        "Chưa có bước đo misattribution / faulty-patch-slip từ các variant injected-* của ADOM (scoring.compare).")
