"""Ticket domain operations. Every function takes an explicit ``now`` (used by the seed)."""

from datetime import datetime

from ..extensions import db
from ..models import Comment, Ticket, TicketHistory, User
from ..utils import utcnow


def add_history(
    ticket: Ticket,
    field: str,
    old: object,
    new: object,
    actor: User,
    now: datetime | None = None,
) -> TicketHistory:
    entry = TicketHistory(
        ticket=ticket,
        actor=actor,
        field=field,
        old_value=None if old is None else str(old),
        new_value=None if new is None else str(new),
        created_at=now or utcnow(),
    )
    db.session.add(entry)
    return entry


def create_ticket(
    creator: User,
    title: str,
    description: str,
    category: str,
    priority: str,
    now: datetime | None = None,
) -> Ticket:
    now = now or utcnow()
    ticket = Ticket(
        title=title,
        description=description,
        category=category,
        priority=priority,
        status="abierto",
        tier=1,
        created_by=creator,
        created_at=now,
        updated_at=now,
    )
    db.session.add(ticket)
    add_history(ticket, "created", None, title, creator, now)
    return ticket


def _touch(ticket: Ticket, now: datetime) -> None:
    ticket.updated_at = now


def _mark_first_response(ticket: Ticket, actor: User, now: datetime) -> None:
    """First response = first staff action by someone other than the requester."""
    if ticket.first_response_at is None and actor.is_staff and actor.id != ticket.created_by_id:
        ticket.first_response_at = now


def set_simple_field(
    ticket: Ticket, field: str, new_value, actor: User, now: datetime | None = None
) -> bool:
    """Change priority/category/tier and log it. Returns True if something changed."""
    now = now or utcnow()
    old_value = getattr(ticket, field)
    if old_value == new_value:
        return False
    setattr(ticket, field, new_value)
    add_history(ticket, field, old_value, new_value, actor, now)
    _touch(ticket, now)
    return True


def set_assignee(
    ticket: Ticket, assignee: User | None, actor: User, now: datetime | None = None
) -> bool:
    now = now or utcnow()
    old = ticket.assigned_to
    if (old.id if old else None) == (assignee.id if assignee else None):
        return False
    ticket.assigned_to = assignee
    add_history(
        ticket,
        "assigned_to",
        old.name if old else None,
        assignee.name if assignee else None,
        actor,
        now,
    )
    _touch(ticket, now)
    return True


def set_status(ticket: Ticket, new_status: str, actor: User, now: datetime | None = None) -> bool:
    """Change status, maintaining first_response_at / resolved_at / closed_at."""
    now = now or utcnow()
    old_status = ticket.status
    if old_status == new_status:
        return False
    ticket.status = new_status
    if old_status == "abierto":
        _mark_first_response(ticket, actor, now)
    if new_status == "resuelto":
        ticket.resolved_at = now
    elif new_status in ("abierto", "en_progreso"):
        ticket.resolved_at = None  # reopened
    if new_status == "cerrado":
        ticket.closed_at = now
    else:
        ticket.closed_at = None
    add_history(ticket, "status", old_status, new_status, actor, now)
    _touch(ticket, now)
    return True


def add_comment(
    ticket: Ticket,
    author: User,
    body: str,
    internal: bool = False,
    now: datetime | None = None,
) -> Comment:
    now = now or utcnow()
    comment = Comment(ticket=ticket, author=author, body=body, internal=internal, created_at=now)
    db.session.add(comment)
    if not internal:
        _mark_first_response(ticket, author, now)
    _touch(ticket, now)
    return comment
