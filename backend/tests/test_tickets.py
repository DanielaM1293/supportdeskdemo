from datetime import timedelta

from app.extensions import db
from app.models import Ticket
from app.utils import utcnow


def test_create_ticket_shape_and_history(client, headers, create_ticket):
    ticket = create_ticket(headers["usuario"])
    assert ticket["status"] == "abierto" and ticket["tier"] == 1
    assert ticket["created_by"]["name"] == "Ursula User"
    assert ticket["assigned_to"] is None
    assert ticket["sla"]["state"] == "ok"
    assert ticket["created_at"].endswith("Z")
    detail = client.get(f"/api/tickets/{ticket['id']}", headers=headers["usuario"]).get_json()
    assert [h["field"] for h in detail["history"]] == ["created"]
    assert detail["comments"] == []


def test_create_ticket_validation(client, headers):
    bad = client.post(
        "/api/tickets",
        json={"title": "ab", "description": "short", "category": "x", "priority": "media"},
        headers=headers["usuario"],
    )
    assert bad.status_code == 400 and "error" in bad.get_json()


def test_user_only_sees_own_tickets(client, headers, create_ticket):
    mine = create_ticket(headers["usuario"])
    theirs = create_ticket(headers["otro"], title="Other person's ticket")
    listing = client.get("/api/tickets", headers=headers["usuario"]).get_json()
    assert [t["id"] for t in listing["items"]] == [mine["id"]]
    assert client.get(f"/api/tickets/{theirs['id']}", headers=headers["usuario"]).status_code == 404
    staff = client.get("/api/tickets", headers=headers["agente"]).get_json()
    assert staff["total"] == 2


def test_user_cannot_patch_assignment_but_agent_can(client, headers, users, create_ticket):
    ticket = create_ticket(headers["usuario"])
    url = f"/api/tickets/{ticket['id']}"
    forbidden = client.patch(
        url, json={"assigned_to_id": users["agente"].id}, headers=headers["usuario"]
    )
    assert forbidden.status_code == 403
    forbidden = client.patch(url, json={"priority": "critica"}, headers=headers["usuario"])
    assert forbidden.status_code == 403
    forbidden = client.patch(url, json={"status": "cerrado"}, headers=headers["usuario"])
    assert forbidden.status_code == 403  # not resolved yet
    ok = client.patch(url, json={"assigned_to_id": users["agente"].id}, headers=headers["agente"])
    assert ok.status_code == 200
    assert ok.get_json()["assigned_to"]["id"] == users["agente"].id


def test_assignee_must_be_active_staff(client, headers, users, create_ticket):
    url = f"/api/tickets/{create_ticket(headers['usuario'])['id']}"
    bad = client.patch(url, json={"assigned_to_id": users["otro"].id}, headers=headers["agente"])
    assert bad.status_code == 400
    cleared = client.patch(url, json={"assigned_to_id": None}, headers=headers["agente"])
    assert cleared.status_code == 200


def test_user_can_close_or_reopen_resolved_ticket(client, headers, create_ticket):
    url = f"/api/tickets/{create_ticket(headers['usuario'])['id']}"
    client.patch(url, json={"status": "resuelto"}, headers=headers["agente"])
    reopened = client.patch(url, json={"status": "abierto"}, headers=headers["usuario"])
    assert reopened.status_code == 200 and reopened.get_json()["resolved_at"] is None
    client.patch(url, json={"status": "resuelto"}, headers=headers["agente"])
    closed = client.patch(url, json={"status": "cerrado"}, headers=headers["usuario"])
    assert closed.get_json()["status"] == "cerrado" and closed.get_json()["closed_at"]


def test_history_written_on_changes_including_tier(client, headers, users, create_ticket):
    url = f"/api/tickets/{create_ticket(headers['usuario'])['id']}"
    client.patch(
        url,
        json={"status": "en_progreso", "tier": 2, "priority": "alta"},
        headers=headers["agente"],
    )
    client.patch(url, json={"status": "en_progreso"}, headers=headers["agente"])  # no-op
    detail = client.get(url, headers=headers["agente"]).get_json()
    fields = [h["field"] for h in detail["history"]]
    assert sorted(fields) == ["created", "priority", "status", "tier"]
    tier = next(h for h in detail["history"] if h["field"] == "tier")
    assert (tier["old_value"], tier["new_value"]) == ("1", "2")
    assert tier["actor"]["id"] == users["agente"].id
    assert detail["first_response_at"] is not None  # agent moved it out of "abierto"


def test_filters_search_sort_and_pagination(client, headers, create_ticket):
    create_ticket(headers["usuario"], title="VPN timeout", category="red", priority="alta")
    create_ticket(headers["usuario"], title="Laptop request", category="hardware", priority="baja")
    last = create_ticket(
        headers["usuario"], title="Wi-Fi drops", category="red", priority="critica",
        description="100% of calls drop in room_1",
    )  # fmt: skip
    get = lambda qs: client.get(f"/api/tickets?{qs}", headers=headers["agente"]).get_json()  # noqa: E731
    assert get("category=red")["total"] == 2
    assert get("priority=baja")["items"][0]["title"] == "Laptop request"
    assert get("q=vpn")["total"] == 1
    assert get(f"q={last['id']}")["items"][0]["id"] == last["id"]
    assert get("q=100%25")["total"] == 1  # wildcard characters are escaped
    assert get("q=zzz")["total"] == 0
    ordered = get("sort=priority&order=desc")["items"]
    assert [t["priority"] for t in ordered] == ["critica", "alta", "baja"]
    page = get("per_page=2&page=2")
    assert (page["total"], page["pages"], len(page["items"]), page["page"]) == (3, 2, 1, 2)
    assert get("per_page=500")["per_page"] == 100
    assert get("assigned_to=unassigned")["total"] == 3
    assert get("assigned_to=me")["total"] == 0
    bad = client.get("/api/tickets?status=nope", headers=headers["agente"])
    assert bad.status_code == 400


def test_sla_filter_uses_computed_state(client, app, headers, create_ticket):
    fresh = create_ticket(headers["usuario"])
    old = create_ticket(headers["usuario"], title="Very old ticket", priority="alta")
    ticket = db.session.get(Ticket, old["id"])
    ticket.created_at = utcnow() - timedelta(days=3)
    db.session.commit()
    breached = client.get("/api/tickets?sla=breached", headers=headers["agente"]).get_json()
    assert [t["id"] for t in breached["items"]] == [old["id"]]
    ok = client.get("/api/tickets?sla=ok", headers=headers["agente"]).get_json()
    assert [t["id"] for t in ok["items"]] == [fresh["id"]]


def test_comments_and_internal_visibility(client, headers, create_ticket):
    ticket = create_ticket(headers["usuario"])
    url = f"/api/tickets/{ticket['id']}"
    public = client.post(f"{url}/comments", json={"body": "Any news?"}, headers=headers["usuario"])
    assert public.status_code == 201
    denied = client.post(
        f"{url}/comments", json={"body": "secret", "internal": True}, headers=headers["usuario"]
    )
    assert denied.status_code == 403
    internal = client.post(
        f"{url}/comments",
        json={"body": "note to self", "internal": True},
        headers=headers["agente"],
    )
    assert internal.status_code == 201 and internal.get_json()["internal"] is True
    assert client.get(url, headers=headers["agente"]).get_json()["first_response_at"] is None
    reply = client.post(f"{url}/comments", json={"body": "On it."}, headers=headers["agente"])
    assert reply.get_json()["author"]["role"] == "agente"
    as_user = client.get(url, headers=headers["usuario"]).get_json()
    assert [c["body"] for c in as_user["comments"]] == ["Any news?", "On it."]
    as_agent = client.get(url, headers=headers["agente"]).get_json()
    assert len(as_agent["comments"]) == 3
    assert as_agent["first_response_at"] is not None
    other = client.post(f"{url}/comments", json={"body": "hi"}, headers=headers["otro"])
    assert other.status_code == 404
    empty = client.post(f"{url}/comments", json={"body": "  "}, headers=headers["usuario"])
    assert empty.status_code == 400


def test_resolved_and_reopen_timestamps(client, headers, create_ticket):
    url = f"/api/tickets/{create_ticket(headers['usuario'])['id']}"
    resolved = client.patch(url, json={"status": "resuelto"}, headers=headers["agente"]).get_json()
    assert resolved["resolved_at"] and resolved["sla"]["state"] == "met"
    reopened = client.patch(url, json={"status": "en_progreso"}, headers=headers["agente"])
    assert reopened.get_json()["resolved_at"] is None
