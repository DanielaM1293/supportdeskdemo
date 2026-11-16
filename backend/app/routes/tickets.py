import math
from datetime import UTC, datetime

from flask import Blueprint, Response, jsonify, request
from sqlalchemy import case, or_
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models import CATEGORIES, PRIORITIES, STAFF_ROLES, STATUSES, TIERS, Ticket, User
from ..security import auth_required, current_user
from ..serializers import comment_to_dict, ticket_detail_to_dict, ticket_to_dict
from ..services import tickets as ticket_service
from ..services.export import tickets_to_csv, tickets_to_xlsx
from ..utils import ApiError, json_body, utcnow

bp = Blueprint("tickets", __name__, url_prefix="/tickets")

SLA_FILTER_VALUES = ("ok", "at_risk", "breached", "met")
SORT_FIELDS = ("created_at", "updated_at", "priority", "status")
# Severity rank: higher number = more severe; "desc" therefore lists critica first.
PRIORITY_RANK = {"baja": 1, "media": 2, "alta": 3, "critica": 4}
STATUS_RANK = {status: index for index, status in enumerate(STATUSES)}
STAFF_PATCH_FIELDS = ("status", "priority", "category", "tier", "assigned_to_id")


def _visible_query(user: User):
    query = Ticket.query.options(joinedload(Ticket.created_by), joinedload(Ticket.assigned_to))
    if not user.is_staff:
        query = query.filter(Ticket.created_by_id == user.id)
    return query


def _get_visible_ticket(ticket_id: int, user: User) -> Ticket:
    ticket = _visible_query(user).filter(Ticket.id == ticket_id).first()
    if ticket is None:
        raise ApiError("Ticket not found", 404)
    return ticket


def _escape_like(text: str) -> str:
    return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _order_clause(sort: str, order: str):
    if sort == "priority":
        column = case(PRIORITY_RANK, value=Ticket.priority, else_=0)
    elif sort == "status":
        column = case(STATUS_RANK, value=Ticket.status, else_=0)
    else:
        column = getattr(Ticket, sort)
    return column.asc() if order == "asc" else column.desc()


def _filtered_query(user: User, args):
    """Apply the shared list/export filters. Returns (query, sla_filter or None)."""
    query = _visible_query(user)

    for name, column, allowed in (
        ("status", Ticket.status, STATUSES),
        ("priority", Ticket.priority, PRIORITIES),
        ("category", Ticket.category, CATEGORIES),
    ):
        value = args.get(name)
        if value:
            if value not in allowed:
                raise ApiError(f"Invalid {name}")
            query = query.filter(column == value)

    tier = args.get("tier")
    if tier:
        if not tier.isdigit() or int(tier) not in TIERS:
            raise ApiError("Invalid tier")
        query = query.filter(Ticket.tier == int(tier))

    assigned = args.get("assigned_to")
    if assigned:
        if assigned == "me":
            query = query.filter(Ticket.assigned_to_id == user.id)
        elif assigned == "unassigned":
            query = query.filter(Ticket.assigned_to_id.is_(None))
        elif assigned.isdigit():
            query = query.filter(Ticket.assigned_to_id == int(assigned))
        else:
            raise ApiError("Invalid assigned_to")

    q = (args.get("q") or "").strip()
    if q:
        pattern = f"%{_escape_like(q)}%"
        conditions = [
            Ticket.title.ilike(pattern, escape="\\"),
            Ticket.description.ilike(pattern, escape="\\"),
        ]
        if q.isdigit():
            conditions.append(Ticket.id == int(q))
        query = query.filter(or_(*conditions))

    sla_filter = args.get("sla")
    if sla_filter and sla_filter not in SLA_FILTER_VALUES:
        raise ApiError("Invalid sla")

    sort = args.get("sort") or "created_at"
    order = (args.get("order") or "desc").lower()
    if sort not in SORT_FIELDS:
        raise ApiError("Invalid sort")
    if order not in ("asc", "desc"):
        raise ApiError("Invalid order")
    query = query.order_by(_order_clause(sort, order), Ticket.id.desc())
    return query, sla_filter or None


def _int_arg(name: str, default: int) -> int:
    raw = request.args.get(name)
    if raw in (None, ""):
        return default
    try:
        value = int(raw)
    except ValueError:
        raise ApiError(f"Invalid {name}") from None
    if value < 1:
        raise ApiError(f"Invalid {name}")
    return value


def _matching_tickets(user: User, now: datetime) -> list[Ticket]:
    """All tickets matching the filters (no pagination)."""
    query, sla_filter = _filtered_query(user, request.args)
    tickets = query.all()
    if sla_filter:
        tickets = [t for t in tickets if t.sla(now)["state"] == sla_filter]
    return tickets


@bp.get("")
@auth_required()
def list_tickets():
    user = current_user()
    now = utcnow()
    page = _int_arg("page", 1)
    per_page = min(_int_arg("per_page", 10), 100)
    query, sla_filter = _filtered_query(user, request.args)

    if sla_filter:
        # The SLA state is computed in Python (it depends on "now"), so for this filter we
        # load the SQL-filtered rows and filter/paginate in memory. Fine for a portfolio app;
        # a production system would precompute deadlines in columns and filter in SQL.
        matching = [t for t in query.all() if t.sla(now)["state"] == sla_filter]
        total = len(matching)
        items = matching[(page - 1) * per_page : page * per_page]
    else:
        total = query.order_by(None).count()
        items = query.limit(per_page).offset((page - 1) * per_page).all()

    return jsonify(
        {
            "items": [ticket_to_dict(t, now) for t in items],
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": max(1, math.ceil(total / per_page)),
        }
    )


@bp.post("")
@auth_required()
def create_ticket():
    user = current_user()
    data = json_body()
    title = str(data.get("title") or "").strip()
    description = str(data.get("description") or "").strip()
    category = data.get("category")
    priority = data.get("priority")
    if not 3 <= len(title) <= 120:
        raise ApiError("Title must be 3-120 characters")
    if len(description) < 10:
        raise ApiError("Description must be at least 10 characters")
    if category not in CATEGORIES:
        raise ApiError("Invalid category")
    if priority not in PRIORITIES:
        raise ApiError("Invalid priority")
    ticket = ticket_service.create_ticket(user, title, description, category, priority)
    db.session.commit()
    return jsonify(ticket_to_dict(ticket)), 201


# NOTE: /export must be registered before /<int:ticket_id> (kept explicit for clarity).
@bp.get("/export")
@auth_required()
def export_tickets():
    user = current_user()
    fmt = (request.args.get("format") or "csv").lower()
    if fmt not in ("csv", "xlsx"):
        raise ApiError("Invalid format (use csv or xlsx)")
    now = utcnow()
    tickets = _matching_tickets(user, now)
    filename = f"supportdesk_tickets_{now.astimezone(UTC):%Y%m%d}.{fmt}"
    if fmt == "csv":
        body = tickets_to_csv(tickets, now)
        mimetype = "text/csv; charset=utf-8"
    else:
        body = tickets_to_xlsx(tickets, now)
        mimetype = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    response = Response(body, mimetype=mimetype)
    response.headers["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


@bp.get("/<int:ticket_id>")
@auth_required()
def get_ticket(ticket_id: int):
    user = current_user()
    ticket = _get_visible_ticket(ticket_id, user)
    return jsonify(ticket_detail_to_dict(ticket, user))


def _validate_staff_patch(data: dict) -> dict:
    """Validate staff changes up front so a bad request changes nothing."""
    changes: dict = {}
    if "status" in data:
        if data["status"] not in STATUSES:
            raise ApiError("Invalid status")
        changes["status"] = data["status"]
    if "priority" in data:
        if data["priority"] not in PRIORITIES:
            raise ApiError("Invalid priority")
        changes["priority"] = data["priority"]
    if "category" in data:
        if data["category"] not in CATEGORIES:
            raise ApiError("Invalid category")
        changes["category"] = data["category"]
    if "tier" in data:
        tier = data["tier"]
        if isinstance(tier, bool) or tier not in TIERS:
            raise ApiError("Invalid tier")
        changes["tier"] = tier
    if "assigned_to_id" in data:
        assignee_id = data["assigned_to_id"]
        assignee = None
        if assignee_id is not None:
            if isinstance(assignee_id, bool) or not isinstance(assignee_id, int):
                raise ApiError("Invalid assigned_to_id")
            assignee = db.session.get(User, assignee_id)
            if assignee is None or not assignee.is_active or assignee.role not in STAFF_ROLES:
                raise ApiError("Assignee must be an active agent or admin")
        changes["assigned_to"] = assignee
    return changes


@bp.patch("/<int:ticket_id>")
@auth_required()
def patch_ticket(ticket_id: int):
    user = current_user()
    ticket = _get_visible_ticket(ticket_id, user)
    data = json_body()
    now = utcnow()

    if not user.is_staff:
        # Requesters may only close or reopen their own resolved ticket.
        if any(field in data for field in STAFF_PATCH_FIELDS if field != "status"):
            raise ApiError("Forbidden", 403)
        new_status = data.get("status")
        if new_status not in ("cerrado", "abierto"):
            raise ApiError("Forbidden", 403)
        if ticket.status != "resuelto":
            raise ApiError("Only resolved tickets can be closed or reopened", 403)
        ticket_service.set_status(ticket, new_status, user, now)
    else:
        changes = _validate_staff_patch(data)
        # Priority first so history order is natural; status last.
        if "priority" in changes:
            ticket_service.set_simple_field(ticket, "priority", changes["priority"], user, now)
        if "category" in changes:
            ticket_service.set_simple_field(ticket, "category", changes["category"], user, now)
        if "tier" in changes:
            ticket_service.set_simple_field(ticket, "tier", changes["tier"], user, now)
        if "assigned_to" in changes:
            ticket_service.set_assignee(ticket, changes["assigned_to"], user, now)
        if "status" in changes:
            ticket_service.set_status(ticket, changes["status"], user, now)

    db.session.commit()
    return jsonify(ticket_detail_to_dict(ticket, user, now))


@bp.post("/<int:ticket_id>/comments")
@auth_required()
def add_comment(ticket_id: int):
    user = current_user()
    ticket = _get_visible_ticket(ticket_id, user)
    data = json_body()
    body = str(data.get("body") or "").strip()
    internal = data.get("internal", False)
    if not body:
        raise ApiError("Comment body is required")
    if not isinstance(internal, bool):
        raise ApiError("internal must be a boolean")
    if internal and not user.is_staff:
        raise ApiError("Forbidden", 403)
    comment = ticket_service.add_comment(ticket, user, body, internal, utcnow())
    db.session.commit()
    return jsonify(comment_to_dict(comment)), 201
