"""Database models and domain enums."""

from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlalchemy.types import TypeDecorator
from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db
from .sla import compute_sla
from .utils import utcnow

ROLES = ("usuario", "agente", "admin")
STAFF_ROLES = ("agente", "admin")
STATUSES = ("abierto", "en_progreso", "esperando_usuario", "resuelto", "cerrado")
CLOSED_STATUSES = ("resuelto", "cerrado")
CATEGORIES = ("hardware", "software", "red", "accesos")
PRIORITIES = ("baja", "media", "alta", "critica")
TIERS = (1, 2)


class UTCDateTime(TypeDecorator):
    """Stores naive UTC, returns timezone-aware UTC datetimes (works on SQLite and PostgreSQL)."""

    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if value.tzinfo is None:
            value = value.replace(tzinfo=UTC)
        return value.astimezone(UTC).replace(tzinfo=None)

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        return value.replace(tzinfo=UTC)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="usuario")
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(UTCDateTime, nullable=False, default=utcnow)

    def set_password(self, password: str) -> None:
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    @property
    def is_staff(self) -> bool:
        return self.role in STAFF_ROLES


class Ticket(db.Model):
    __tablename__ = "tickets"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(20), nullable=False)
    priority = db.Column(db.String(20), nullable=False, index=True)
    status = db.Column(db.String(30), nullable=False, default="abierto", index=True)
    tier = db.Column(db.Integer, nullable=False, default=1)
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    assigned_to_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True, index=True)
    created_at = db.Column(UTCDateTime, nullable=False, default=utcnow, index=True)
    updated_at = db.Column(UTCDateTime, nullable=False, default=utcnow, onupdate=utcnow)
    first_response_at = db.Column(UTCDateTime, nullable=True)
    resolved_at = db.Column(UTCDateTime, nullable=True)
    closed_at = db.Column(UTCDateTime, nullable=True)

    created_by = db.relationship("User", foreign_keys=[created_by_id])
    assigned_to = db.relationship("User", foreign_keys=[assigned_to_id])
    comments = db.relationship(
        "Comment",
        back_populates="ticket",
        order_by="(Comment.created_at, Comment.id)",
        cascade="all, delete-orphan",
    )
    history = db.relationship(
        "TicketHistory",
        back_populates="ticket",
        order_by="(TicketHistory.created_at, TicketHistory.id)",
        cascade="all, delete-orphan",
    )

    @property
    def is_open(self) -> bool:
        return self.status not in CLOSED_STATUSES

    def sla(self, now: datetime | None = None) -> dict:
        return compute_sla(
            self.priority,
            self.created_at,
            self.first_response_at,
            self.resolved_at,
            self.closed_at,
            now or utcnow(),
        )


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False, index=True)
    author_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    body = db.Column(db.Text, nullable=False)
    internal = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(UTCDateTime, nullable=False, default=utcnow)

    ticket = db.relationship("Ticket", back_populates="comments")
    author = db.relationship("User")


class TicketHistory(db.Model):
    __tablename__ = "ticket_history"

    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey("tickets.id"), nullable=False, index=True)
    actor_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    field = db.Column(db.String(40), nullable=False)
    old_value = db.Column(db.String(255), nullable=True)
    new_value = db.Column(db.String(255), nullable=True)
    created_at = db.Column(UTCDateTime, nullable=False, default=utcnow)

    ticket = db.relationship("Ticket", back_populates="history")
    actor = db.relationship("User")
