from flask import Blueprint, jsonify

from ..models import CATEGORIES, PRIORITIES, STATUSES, Ticket
from ..security import auth_required, current_user
from ..utils import utcnow

bp = Blueprint("dashboard", __name__)


def build_dashboard(tickets: list[Ticket], now) -> dict:
    """Aggregate numbers for a list of tickets.

    breached_count counts tickets whose overall SLA state is "breached" (open ones past a
    deadline plus completed ones that finished late).
    """
    by_status = dict.fromkeys(STATUSES, 0)
    by_category = dict.fromkeys(CATEGORIES, 0)
    by_priority = dict.fromkeys(PRIORITIES, 0)
    breached = 0
    resolution_hours = []
    done_total = 0
    done_on_time = 0
    for ticket in tickets:
        by_status[ticket.status] += 1
        by_category[ticket.category] += 1
        by_priority[ticket.priority] += 1
        sla = ticket.sla(now)
        if sla["state"] == "breached":
            breached += 1
        if ticket.resolved_at is not None:
            hours = (ticket.resolved_at - ticket.created_at).total_seconds() / 3600
            resolution_hours.append(hours)
        done_at = ticket.resolved_at or ticket.closed_at
        if done_at is not None:
            done_total += 1
            if done_at <= sla["resolution_due"]:
                done_on_time += 1
    return {
        "total": len(tickets),
        "open_count": sum(1 for t in tickets if t.is_open),
        "breached_count": breached,
        "by_status": by_status,
        "by_category": by_category,
        "by_priority": by_priority,
        "avg_resolution_hours": (
            round(sum(resolution_hours) / len(resolution_hours), 2) if resolution_hours else None
        ),
        "sla_compliance_pct": (round(100 * done_on_time / done_total, 1) if done_total else None),
    }


@bp.get("/dashboard")
@auth_required()
def dashboard():
    user = current_user()
    query = Ticket.query
    if not user.is_staff:
        query = query.filter(Ticket.created_by_id == user.id)
    return jsonify(build_dashboard(query.all(), utcnow()))
