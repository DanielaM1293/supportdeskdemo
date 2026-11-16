"""Convert models to API dictionaries."""

from datetime import datetime

from .models import Comment, Ticket, TicketHistory, User
from .utils import iso, utcnow


def user_ref(user: User | None) -> dict | None:
    return None if user is None else {"id": user.id, "name": user.name}


def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": iso(user.created_at),
    }


def sla_to_dict(sla: dict) -> dict:
    return {
        "first_response_due": iso(sla["first_response_due"]),
        "resolution_due": iso(sla["resolution_due"]),
        "first_response_state": sla["first_response_state"],
        "resolution_state": sla["resolution_state"],
        "state": sla["state"],
    }


def ticket_to_dict(ticket: Ticket, now: datetime | None = None) -> dict:
    return {
        "id": ticket.id,
        "title": ticket.title,
        "description": ticket.description,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "tier": ticket.tier,
        "created_by": user_ref(ticket.created_by),
        "assigned_to": user_ref(ticket.assigned_to),
        "created_at": iso(ticket.created_at),
        "updated_at": iso(ticket.updated_at),
        "first_response_at": iso(ticket.first_response_at),
        "resolved_at": iso(ticket.resolved_at),
        "closed_at": iso(ticket.closed_at),
        "sla": sla_to_dict(ticket.sla(now or utcnow())),
    }


def comment_to_dict(comment: Comment) -> dict:
    return {
        "id": comment.id,
        "body": comment.body,
        "internal": comment.internal,
        "author": {
            "id": comment.author.id,
            "name": comment.author.name,
            "role": comment.author.role,
        },
        "created_at": iso(comment.created_at),
    }


def history_to_dict(entry: TicketHistory) -> dict:
    return {
        "id": entry.id,
        "field": entry.field,
        "old_value": entry.old_value,
        "new_value": entry.new_value,
        "actor": user_ref(entry.actor),
        "created_at": iso(entry.created_at),
    }


def ticket_detail_to_dict(ticket: Ticket, viewer: User, now: datetime | None = None) -> dict:
    data = ticket_to_dict(ticket, now)
    comments = [c for c in ticket.comments if viewer.is_staff or not c.internal]
    data["comments"] = [comment_to_dict(c) for c in comments]
    data["history"] = [history_to_dict(h) for h in ticket.history]
    return data
