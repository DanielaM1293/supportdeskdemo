import csv
import io
from datetime import timedelta

from openpyxl import load_workbook

from app.extensions import db
from app.models import CATEGORIES, PRIORITIES, STATUSES, Ticket
from app.utils import utcnow


def test_dashboard_numbers_and_scoping(client, headers, create_ticket):
    create_ticket(headers["usuario"], category="red", priority="alta")
    resolved = create_ticket(headers["usuario"], category="red", priority="media")
    create_ticket(headers["otro"], category="software", priority="baja")
    client.patch(
        f"/api/tickets/{resolved['id']}", json={"status": "resuelto"}, headers=headers["agente"]
    )
    old = create_ticket(headers["usuario"], priority="critica")
    db.session.get(Ticket, old["id"]).created_at = utcnow() - timedelta(days=2)
    db.session.commit()

    data = client.get("/api/dashboard", headers=headers["agente"]).get_json()
    assert data["total"] == 4
    assert data["open_count"] == 3
    assert data["breached_count"] == 1
    assert set(data["by_status"]) == set(STATUSES) and data["by_status"]["resuelto"] == 1
    assert set(data["by_category"]) == set(CATEGORIES) and data["by_category"]["red"] == 2
    assert set(data["by_priority"]) == set(PRIORITIES) and data["by_priority"]["critica"] == 1
    assert data["sla_compliance_pct"] == 100.0
    assert data["avg_resolution_hours"] is not None
    scoped = client.get("/api/dashboard", headers=headers["otro"]).get_json()
    assert scoped["total"] == 1 and scoped["avg_resolution_hours"] is None
    assert scoped["sla_compliance_pct"] is None


def test_users_endpoints_permissions(client, headers, users):
    assert client.get("/api/users", headers=headers["agente"]).status_code == 403
    listing = client.get("/api/users", headers=headers["admin"]).get_json()
    assert len(listing["items"]) == 4
    agents = client.get("/api/users/agents", headers=headers["agente"]).get_json()["items"]
    assert {a["role"] for a in agents} == {"agente", "admin"}
    assert client.get("/api/users/agents", headers=headers["usuario"]).status_code == 403


def test_admin_updates_users_but_not_self(client, headers, users):
    url = f"/api/users/{users['usuario'].id}"
    updated = client.patch(url, json={"role": "agente"}, headers=headers["admin"])
    assert updated.get_json()["role"] == "agente"
    own = f"/api/users/{users['admin'].id}"
    assert client.patch(own, json={"role": "usuario"}, headers=headers["admin"]).status_code == 400
    assert client.patch(own, json={"is_active": False}, headers=headers["admin"]).status_code == 400
    assert client.patch(url, json={"role": "boss"}, headers=headers["admin"]).status_code == 400


def test_deactivated_user_loses_access(client, headers, users):
    client.patch(
        f"/api/users/{users['usuario'].id}", json={"is_active": False}, headers=headers["admin"]
    )
    assert client.get("/api/auth/me", headers=headers["usuario"]).status_code == 401


def test_csv_export_with_filters(client, headers, create_ticket):
    create_ticket(headers["usuario"], title="=cmd|injection", category="red")
    create_ticket(headers["usuario"], title="Laptop request", category="hardware")
    response = client.get("/api/tickets/export?format=csv&category=red", headers=headers["agente"])
    assert response.status_code == 200
    assert response.mimetype == "text/csv"
    disposition = response.headers["Content-Disposition"]
    assert disposition.startswith("attachment; filename=") and disposition.endswith('.csv"')
    rows = list(csv.reader(io.StringIO(response.get_data(as_text=True))))
    assert rows[0] == [
        "id", "title", "category", "priority", "status", "tier", "created_by",
        "assigned_to", "created_at", "first_response_at", "resolved_at", "sla_state",
    ]  # fmt: skip
    assert len(rows) == 2 and rows[1][2] == "red" and rows[1][-1] == "ok"
    assert rows[1][1] == "'=cmd|injection"  # formula injection neutralised


def test_export_is_scoped_for_users_and_ignores_pagination(client, headers, create_ticket):
    for index in range(3):
        create_ticket(headers["usuario"], title=f"Mine {index}")
    create_ticket(headers["otro"], title="Not mine")
    response = client.get("/api/tickets/export?per_page=1&page=2", headers=headers["usuario"])
    assert len(response.get_data(as_text=True).strip().splitlines()) == 4


def test_xlsx_export_opens_with_openpyxl(client, headers, create_ticket):
    create_ticket(headers["usuario"])
    old = create_ticket(headers["usuario"], priority="critica")
    db.session.get(Ticket, old["id"]).created_at = utcnow() - timedelta(days=2)
    db.session.commit()
    response = client.get("/api/tickets/export?format=xlsx", headers=headers["agente"])
    assert response.status_code == 200
    assert "spreadsheetml" in response.mimetype
    assert ".xlsx" in response.headers["Content-Disposition"]
    sheet = load_workbook(io.BytesIO(response.data)).active
    assert sheet.max_row == 3
    assert sheet.freeze_panes == "A2"
    assert sheet.auto_filter.ref.startswith("A1:")
    assert sheet["A1"].font.bold and sheet["L1"].value == "sla_state"
    assert len(sheet.conditional_formatting) >= 1
    assert "breached" in {sheet["L2"].value, sheet["L3"].value}


def test_export_invalid_format(client, headers):
    assert (
        client.get("/api/tickets/export?format=pdf", headers=headers["agente"]).status_code == 400
    )
