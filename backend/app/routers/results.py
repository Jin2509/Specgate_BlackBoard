"""Read-only access to ADOM result files. Bodies are the ADOM JSON as written (snake_case), except the variant list."""

from typing import Any

from fastapi import APIRouter

from app import results

router = APIRouter(prefix="/api/runs/{run_id}", tags=["results"])


@router.get("/tasks")
def get_tasks(run_id: str) -> dict[str, Any]:
    return results.read_tasks(run_id)


@router.get("/specs")
def get_specs(run_id: str) -> dict[str, Any]:
    return results.read_specs(run_id)


@router.get("/variants")
def get_variants(run_id: str) -> list[dict[str, Any]]:
    return results.list_variants(run_id)


@router.get("/variants/{variant}")
def get_variant(run_id: str, variant: str) -> dict[str, Any]:
    return results.read_variant(run_id, variant)


# task ids contain "/" (HumanEval/53), hence the :path converter as the last segment.
@router.get("/variants/{variant}/state/{task_id:path}")
def get_state(run_id: str, variant: str, task_id: str) -> dict[str, Any]:
    return results.read_state(run_id, variant, task_id)


@router.get("/variants/{variant}/monitors/{task_id:path}")
def get_monitors(run_id: str, variant: str, task_id: str) -> list[dict[str, Any]]:
    return results.list_monitors(run_id, variant, task_id)
