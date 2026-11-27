# Tests the realtime WebSocket: authentication, channel subscriptions, replay, workspace and join events.
from contextlib import contextmanager

import pytest
from fastapi.websockets import WebSocketDisconnect

from app.ws.realtime import broker, channel_topic
from test_ws import add_member, api, login, post, shared  # noqa: F401

REALTIME_PATH = "/api/v1/realtime"


@pytest.fixture()
def team(api):
    lan, _ = login(api, "lan-pham", "Lan")
    long, _ = login(api, "long-tran", "Long")
    ws = shared(api, lan)
    add_member(api, lan, ws, long)
    return api, lan, long, ws


@contextmanager
def open_socket(api, headers):
    with api.websocket_connect(REALTIME_PATH, headers=headers) as connection:
        assert connection.receive_json()["type"] == "realtime.connection.opened"
        yield connection


def receive_until(connection, event_type, **fields):
    for _ in range(20):
        event = connection.receive_json()
        if event["type"] == event_type and all(event.get(key) == value for key, value in fields.items()):
            return event
    raise AssertionError(f"no {event_type} event")


def subscribe(connection, ws, after=None, channel="chung"):
    connection.send_json({"type": "subscribe", "workspaceId": ws["id"], "channelId": channel, "after": after})


def test_should_close_the_socket_when_not_signed_in(api):
    with api.websocket_connect(REALTIME_PATH) as connection, pytest.raises(WebSocketDisconnect) as closed:
        connection.receive_json()
    assert closed.value.code == 4401


def test_should_close_the_socket_when_opened_from_another_site(team):
    api, lan, _, _ = team
    with api.websocket_connect(REALTIME_PATH, headers={**lan, "origin": "https://evil.example"}) as connection:
        with pytest.raises(WebSocketDisconnect) as closed:
            connection.receive_json()
    assert closed.value.code == 4403


def test_should_push_a_new_message_to_a_subscribed_member(team):
    api, lan, long, ws = team
    with open_socket(api, long) as connection:
        subscribe(connection, ws)
        confirmed = receive_until(connection, "channel.subscription.confirmed")
        post(api, lan, ws, "Chào cả nhóm")
        pushed = receive_until(connection, "channel.message.created")
        assert pushed["message"]["text"] == "Chào cả nhóm"
        assert pushed["message"]["channelId"] == confirmed["channelId"]


def test_should_replay_messages_missed_since_the_given_seq(team):
    api, lan, long, ws = team
    first = post(api, lan, ws, "Tin một")[0]
    post(api, lan, ws, "Tin hai")
    with open_socket(api, long) as connection:
        subscribe(connection, ws, after=first["seq"])
        replayed = connection.receive_json()
        assert replayed["type"] == "channel.message.created"
        assert replayed["message"]["text"] == "Tin hai"
        assert connection.receive_json()["type"] == "channel.subscription.confirmed"


def test_should_refuse_a_channel_of_a_workspace_the_user_is_not_in(team):
    api, lan, _, ws = team
    stranger, _ = login(api, "an-ngo", "An")
    with open_socket(api, stranger) as connection:
        subscribe(connection, ws)
        assert connection.receive_json()["type"] == "channel.subscription.refused"


def test_should_tell_every_member_that_a_channel_moved_without_subscribing(team):
    api, lan, long, ws = team
    with open_socket(api, long) as connection:
        post(api, lan, ws, "Có tin mới")
        activity = receive_until(connection, "workspace.channel.updated")
        assert activity["workspaceId"] == ws["id"]


def test_should_tell_the_owner_of_a_new_join_request_and_follow_the_newcomer_in(team):
    api, lan, _, ws = team
    an, _ = login(api, "an-ngo", "An")
    with open_socket(api, lan) as owner:
        with open_socket(api, an) as newcomer:
            request = api.post("/api/v1/join-requests", headers=an, json={"code": ws["joinCode"]}).json()
            assert receive_until(owner, "join.request.changed")["requestId"] == request["id"]
            api.patch(f"/api/v1/join-requests/{request['id']}", headers=lan, json={"status": "approved"})
            receive_until(newcomer, "join.request.changed", status="approved")
            receive_until(newcomer, "workspace.membership.changed")
            post(api, lan, ws, "Chào An")
            assert receive_until(newcomer, "workspace.channel.updated")["workspaceId"] == ws["id"]


def test_should_stop_pushing_a_channel_once_the_member_is_removed(team):
    api, lan, long, ws = team
    long_id = api.get("/api/v1/me", headers=long).json()["user"]["id"]
    with open_socket(api, long) as connection:
        subscribe(connection, ws)
        channel_id = receive_until(connection, "channel.subscription.confirmed")["channelId"]
        assert api.delete(f"/api/v1/workspaces/{ws['id']}/members/{long_id}", headers=lan).status_code == 204
        receive_until(connection, "workspace.membership.changed")
        subscribe(connection, ws)
        assert receive_until(connection, "channel.subscription.refused")
        post(api, lan, ws, "Long không còn thấy tin này")
        subscribe(connection, ws)
        assert connection.receive_json()["type"] == "channel.subscription.refused"
        assert broker.subscriber_count(channel_topic(channel_id)) == 0
