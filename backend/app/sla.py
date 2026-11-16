"""SLA calculation as pure functions (explicit ``now`` for testability).

Deadlines are measured in calendar hours from ``created_at``. Time spent in the
"esperando_usuario" status does NOT pause the clock (kept simple on purpose).
"""

from datetime import datetime, timedelta

# priority -> (first response hours, resolution hours)
SLA_HOURS = {
    "critica": (1, 4),
    "alta": (4, 8),
    "media": (8, 24),
    "baja": (24, 72),
}

AT_RISK_THRESHOLD = 0.75


def sla_deadlines(priority: str, created_at: datetime) -> tuple[datetime, datetime]:
    first_hours, resolution_hours = SLA_HOURS[priority]
    return (
        created_at + timedelta(hours=first_hours),
        created_at + timedelta(hours=resolution_hours),
    )


def metric_state(
    created_at: datetime, due: datetime, done_at: datetime | None, now: datetime
) -> str:
    """State of a single metric: met, breached, at_risk or ok."""
    if done_at is not None:
        return "met" if done_at <= due else "breached"
    if now > due:
        return "breached"
    allowed = (due - created_at).total_seconds()
    elapsed = (now - created_at).total_seconds()
    if allowed > 0 and elapsed >= AT_RISK_THRESHOLD * allowed:
        return "at_risk"
    return "ok"


def overall_state(first_state: str, resolution_state: str) -> str:
    """Worst state wins (breached > at_risk > ok); both met -> met."""
    states = {first_state, resolution_state}
    if "breached" in states:
        return "breached"
    if "at_risk" in states:
        return "at_risk"
    if states == {"met"}:
        return "met"
    return "ok"


def compute_sla(
    priority: str,
    created_at: datetime,
    first_response_at: datetime | None,
    resolved_at: datetime | None,
    closed_at: datetime | None,
    now: datetime,
) -> dict:
    """Full SLA info. A ticket closed without being resolved counts closed_at as completion."""
    first_due, resolution_due = sla_deadlines(priority, created_at)
    done_at = resolved_at or closed_at
    first_state = metric_state(created_at, first_due, first_response_at, now)
    resolution_state = metric_state(created_at, resolution_due, done_at, now)
    return {
        "first_response_due": first_due,
        "resolution_due": resolution_due,
        "first_response_state": first_state,
        "resolution_state": resolution_state,
        "state": overall_state(first_state, resolution_state),
    }
