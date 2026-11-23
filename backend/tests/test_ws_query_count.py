"""Database round trips per request: a team page must not cost more queries for every member."""

from contextlib import contextmanager

from sqlalchemy import event

from app.db import engine
from test_ws import add_member, api, login, shared, with_key  # noqa: F401


@contextmanager
def counted_queries():
    counter = {"queries": 0}

    def count(*_args) -> None:
        counter["queries"] += 1

    event.listen(engine, "before_cursor_execute", count)
    try:
        yield counter
    finally:
        event.remove(engine, "before_cursor_execute", count)


def queries_for(c, h, path: str) -> int:
    with counted_queries() as counter:
        assert c.get(path, headers=h).status_code == 200
    return counter["queries"]


def team_of(c, size: int):
    owner, _ = login(c, "owner-0", "Owner")
    ws = shared(c, owner)
    for index in range(1, size):
        member, _ = login(c, f"member-{index}", f"Member {index}")
        with_key(c, member)
        add_member(c, owner, ws, member)
    return owner, ws


def test_should_load_a_workspace_with_the_same_queries_for_two_or_six_members(api):
    owner, small = team_of(api, 2)
    small_count = queries_for(api, owner, f"/api/v1/workspaces/{small['id']}")
    for index in range(2, 6):
        member, _ = login(api, f"member-{index}", f"Member {index}")
        with_key(api, member)
        add_member(api, owner, small, member)
    assert queries_for(api, owner, f"/api/v1/workspaces/{small['id']}") == small_count


def test_should_list_members_with_the_same_queries_for_two_or_six_members(api):
    owner, ws = team_of(api, 2)
    small_count = queries_for(api, owner, f"/api/v1/workspaces/{ws['id']}/members")
    for index in range(2, 6):
        member, _ = login(api, f"member-{index}", f"Member {index}")
        add_member(api, owner, ws, member)
    assert queries_for(api, owner, f"/api/v1/workspaces/{ws['id']}/members") == small_count
