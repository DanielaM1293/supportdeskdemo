"""Seed demo data: python scripts/seed.py [--reset]

Requires the schema to exist first (flask --app wsgi db upgrade). All data is fictional.
"""

import argparse
import random
import sys
from datetime import timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import inspect  # noqa: E402

from app import create_app  # noqa: E402
from app.extensions import db  # noqa: E402
from app.models import Comment, Ticket, TicketHistory, User  # noqa: E402
from app.services import tickets as svc  # noqa: E402
from app.sla import SLA_HOURS  # noqa: E402
from app.utils import utcnow  # noqa: E402

DEMO_PASSWORD = "Demo1234!"
DEMO_USERS = (
    ("Ana Usuario", "usuario@demo.com", "usuario"),
    ("Carlos Agente", "agente@demo.com", "agente"),
    ("Laura Admin", "admin@demo.com", "admin"),
)

# (title, description, category, priorities typically seen)
SCENARIOS = [
    (
        "Printer queue stuck",
        "Documents sent to the shared printer stay in the queue and never print.",
        "hardware",
        ("baja", "media"),
    ),
    (
        "VPN connection times out",
        "The VPN client connects, then drops after about 30 seconds with a timeout error.",
        "red",
        ("alta", "media"),
    ),
    (
        "Password reset needed",
        "I cannot sign in after the scheduled password change and need a reset.",
        "accesos",
        ("media", "alta"),
    ),
    (
        "New laptop request",
        "Requesting a new laptop for an incoming team member starting next week.",
        "hardware",
        ("baja", "media"),
    ),
    (
        "Wi-Fi drops in meeting room",
        "Wi-Fi disconnects every few minutes in the large meeting room during calls.",
        "red",
        ("alta", "media"),
    ),
    (
        "Software license activation fails",
        "The office suite shows 'license not activated' after the latest update.",
        "software",
        ("media", "baja"),
    ),
    (
        "Shared folder permission denied",
        "I get 'access denied' when opening the team shared folder since Monday.",
        "accesos",
        ("media", "alta"),
    ),
    (
        "Laptop battery drains quickly",
        "The battery lasts under one hour even after a full charge.",
        "hardware",
        ("baja", "media"),
    ),
    (
        "Email client keeps crashing",
        "The email application closes unexpectedly when opening large attachments.",
        "software",
        ("media", "alta"),
    ),
    (
        "Cannot reach internal wiki",
        "The internal documentation site returns a gateway error since this morning.",
        "red",
        ("alta", "critica"),
    ),
    (
        "Account locked after failed logins",
        "My account was locked after several failed sign-in attempts on my phone.",
        "accesos",
        ("media", "alta"),
    ),
    (
        "Monitor flickering",
        "The external monitor flickers intermittently when connected through the dock.",
        "hardware",
        ("baja", "media"),
    ),
    (
        "Install design software",
        "Please install the approved vector graphics editor on my workstation.",
        "software",
        ("baja", "media"),
    ),
    (
        "Slow network in the warehouse office",
        "File transfers are extremely slow from the warehouse office desks.",
        "red",
        ("media", "alta"),
    ),
    (
        "Request access to project tracker",
        "I need access to the project tracker board for the new onboarding project.",
        "accesos",
        ("baja", "media"),
    ),
    (
        "Keyboard keys not responding",
        "Several keys on my keyboard stopped working after a coffee spill.",
        "hardware",
        ("baja", "media"),
    ),
    (
        "Video call app has no audio",
        "Microphone is detected but nobody can hear me in video calls.",
        "software",
        ("media", "alta"),
    ),
    (
        "Server room unreachable from branch",
        "The branch office cannot reach the file server at all.",
        "red",
        ("critica", "alta"),
    ),
    (
        "Multi-factor authentication code not arriving",
        "I am not receiving the verification codes on my registered phone.",
        "accesos",
        ("alta", "critica"),
    ),
    (
        "Docking station not detected",
        "The laptop does not recognise the docking station after a firmware update.",
        "hardware",
        ("media", "baja"),
    ),
    (
        "Spreadsheet macro blocked",
        "A macro that I use daily is now blocked by security settings.",
        "software",
        ("baja", "media"),
    ),
    (
        "Guest Wi-Fi password request",
        "We have visitors tomorrow and need a temporary guest Wi-Fi password.",
        "red",
        ("baja", "media"),
    ),
    (
        "Remove former colleague's access",
        "Please revoke the shared mailbox access of a colleague who left the team.",
        "accesos",
        ("media", "alta"),
    ),
    (
        "Scanner outputs blank pages",
        "The document scanner on the second floor produces blank pages.",
        "hardware",
        ("media", "baja"),
    ),
    (
        "Browser extension conflicts with portal",
        "The expense portal does not load unless I disable my browser extensions.",
        "software",
        ("baja", "media"),
    ),
    (
        "Critical: whole floor lost network",
        "Everyone on the third floor lost wired and wireless network access.",
        "red",
        ("critica",),
    ),
    (
        "Operating system update stuck",
        "The laptop is stuck at 40% on a system update for several hours.",
        "software",
        ("media", "alta"),
    ),
    (
        "Headset not recognised",
        "My USB headset is not detected by the computer anymore.",
        "hardware",
        ("baja",),
    ),
    (
        "Request admin rights for installer",
        "I need temporary admin rights to run a vendor driver installer.",
        "accesos",
        ("baja", "media"),
    ),
    (
        "Intranet page shows outdated data",
        "The IT contacts page on the intranet lists outdated phone numbers.",
        "software",
        ("baja",),
    ),
]
PLACES = (
    "Reception",
    "Finance team",
    "Sales floor",
    "HR team",
    "Warehouse",
    "Marketing",
    "Support team",
)

AGENT_NOTES = [
    "Thanks for reporting this. I am looking into it now.",
    "I could reproduce the issue and I am working on a fix.",
    "Applied a configuration change on our side. Please let me know if it helps.",
    "Escalating to the specialist team for a deeper review.",
]
INTERNAL_NOTES = [
    "Checked logs: known issue after last patch window, see runbook.",
    "Waiting on vendor response before next step.",
    "Similar to a previous case; reusing the earlier workaround.",
    "Needs a second pair of eyes from tier 2 if it persists.",
]
USER_REPLIES = [
    "Thanks, I tried that and will report back.",
    "The problem is still there, same behaviour as before.",
    "Here is the extra detail you asked for: it happens every time I try.",
]


def _clamp(value, created_at, now):
    return max(created_at, min(value, now - timedelta(minutes=1)))


def _simulate(rng, ticket, users, target_status, now, allow_late=True):
    """Replay a plausible lifecycle through the service layer so history stays consistent."""
    user, agent, admin = users
    if ticket.created_by_id == agent.id:
        agent = admin  # the requester cannot be the one giving the first response
    created = ticket.created_at
    first_h, res_h = SLA_HOURS[ticket.priority]
    cursor = created

    def advance(hours):
        nonlocal cursor
        cursor = _clamp(cursor + timedelta(hours=hours), created, now)
        return cursor

    if target_status == "abierto":
        if rng.random() < 0.2:
            svc.add_comment(
                ticket,
                agent,
                "Ticket received, it is in the queue.",
                False,
                advance(first_h * rng.uniform(0.2, 1.4)),
            )
        return

    # Agent picks it up (first response, maybe late).
    late = allow_late and rng.random() < 0.12
    advance(first_h * (rng.uniform(1.1, 2.0) if late else rng.uniform(0.1, 0.9)))
    if ticket.created_by_id != agent.id:
        svc.set_assignee(ticket, agent, agent, cursor)
    svc.set_status(ticket, "en_progreso", agent, cursor)
    if rng.random() < 0.7:
        svc.add_comment(ticket, agent, rng.choice(AGENT_NOTES), False, advance(0.1))
    if rng.random() < 0.4:
        svc.add_comment(ticket, agent, rng.choice(INTERNAL_NOTES), True, advance(0.2))
    if rng.random() < 0.15:
        svc.set_simple_field(ticket, "priority", rng.choice(("media", "alta")), agent, advance(0.2))
    if rng.random() < 0.2:
        svc.set_simple_field(ticket, "tier", 2, agent, advance(0.3))
        svc.set_assignee(ticket, admin, agent, cursor)
        svc.add_comment(ticket, admin, "Taking this one as tier 2 specialist.", True, advance(0.2))

    if target_status == "en_progreso":
        return
    if target_status == "esperando_usuario":
        svc.add_comment(
            ticket, agent, "Could you share more details so I can continue?", False, advance(0.3)
        )
        svc.set_status(ticket, "esperando_usuario", agent, cursor)
        if rng.random() < 0.4:
            svc.add_comment(
                ticket, user, rng.choice(USER_REPLIES), False, advance(rng.uniform(0.5, 4))
            )
        return

    # resuelto / cerrado: resolution time sometimes beyond the SLA so compliance is below 100%.
    overdue = allow_late and rng.random() < 0.2
    target = created + timedelta(
        hours=res_h * (rng.uniform(1.05, 1.8) if overdue else rng.uniform(0.25, 0.95))
    )
    cursor = _clamp(max(target, cursor + timedelta(minutes=10)), created, now)
    svc.add_comment(ticket, agent, "Fix applied. Marking this as resolved.", False, cursor)
    svc.set_status(ticket, "resuelto", agent, cursor)
    if target_status == "cerrado":
        closer = user if ticket.created_by_id == user.id and rng.random() < 0.6 else agent
        advance(rng.uniform(1, 30))
        svc.set_status(ticket, "cerrado", closer, cursor)


def _scripted_plan(now):
    """Hand-placed tickets guaranteeing a mix of fresh, at-risk and breached open tickets."""
    # (scenario index, priority, age in hours, target status)
    return [
        (0, "media", 2, "abierto"),
        (4, "alta", 1.5, "abierto"),
        (6, "baja", 4, "en_progreso"),
        (13, "media", 20, "en_progreso"),  # ~83% of resolution time: at risk
        (1, "alta", 7, "en_progreso"),  # ~88%: at risk
        (14, "baja", 60, "en_progreso"),  # ~83%: at risk
        (25, "critica", 3.5, "en_progreso"),  # ~88%: at risk
        (9, "alta", 30, "abierto"),  # breached, never answered
        (17, "critica", 12, "en_progreso"),  # breached
        (10, "media", 70, "esperando_usuario"),
    ]


def seed(reset: bool = False) -> None:
    if not inspect(db.engine).has_table("users"):
        sys.exit("Tables not found. Run 'flask --app wsgi db upgrade' first.")
    if reset:
        for model in (TicketHistory, Comment, Ticket, User):
            db.session.query(model).delete()
        db.session.commit()
    elif User.query.first() is not None:
        print("Users already exist; skipping seed (use --reset to rebuild).")
        return

    rng = random.Random(42)
    now = utcnow()
    users = []
    for name, email, role in DEMO_USERS:
        user = User(name=name, email=email, role=role, created_at=now - timedelta(days=30))
        user.set_password(DEMO_PASSWORD)
        db.session.add(user)
        users.append(user)
    db.session.flush()
    user, agent, admin = users

    plan = [(i, p, age, s) for i, p, age, s in _scripted_plan(now)]
    statuses = ("abierto", "en_progreso", "esperando_usuario", "resuelto", "cerrado")
    while len(plan) < 60:
        index = rng.randrange(len(SCENARIOS))
        priority = rng.choice(SCENARIOS[index][3])
        age = rng.uniform(3, 21 * 24)
        # Older tickets are mostly finished; open ones are concentrated in recent days.
        weights = (3, 5, 6, 40, 46) if age > 5 * 24 else (16, 18, 10, 28, 28)
        status = rng.choices(statuses, weights)[0]
        plan.append((index, priority, age, status))

    for number, (index, priority, age, status) in enumerate(plan):
        title, description, category, _ = SCENARIOS[index]
        if number >= len(SCENARIOS) or number >= 10:
            title = f"{title} - {rng.choice(PLACES)}"
        creator = user if rng.random() < 0.85 else rng.choice((agent, admin))
        created_at = now - timedelta(hours=age)
        ticket = svc.create_ticket(creator, title, description, category, priority, created_at)
        db.session.flush()
        _simulate(rng, ticket, users, status, now, allow_late=number >= len(_scripted_plan(now)))

    db.session.commit()
    states = {}
    for ticket in Ticket.query.all():
        state = ticket.sla(now)["state"]
        states[state] = states.get(state, 0) + 1
    print(f"Seeded {len(users)} users and {Ticket.query.count()} tickets. SLA states: {states}")
    print(f"Demo password for all users: {DEMO_PASSWORD}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed SupportDesk demo data")
    parser.add_argument("--reset", action="store_true", help="delete existing data first")
    args = parser.parse_args()
    app = create_app()
    with app.app_context():
        seed(reset=args.reset)


if __name__ == "__main__":
    main()
