"""CSV / XLSX builders shared by the export route and the weekly report script."""

import csv
import io
from collections import Counter
from collections.abc import Iterable
from datetime import UTC, datetime

from openpyxl import Workbook
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from ..models import CATEGORIES, PRIORITIES, STATUSES, Ticket
from ..utils import iso

EXPORT_COLUMNS = (
    "id",
    "title",
    "category",
    "priority",
    "status",
    "tier",
    "created_by",
    "assigned_to",
    "created_at",
    "first_response_at",
    "resolved_at",
    "sla_state",
)
DATETIME_COLUMNS = ("created_at", "first_response_at", "resolved_at")

HEADER_FILL = PatternFill("solid", start_color="1F3A5F")
HEADER_FONT = Font(bold=True, color="FFFFFF")
BREACHED_FILL = PatternFill("solid", start_color="F8C9C9", end_color="F8C9C9")
AT_RISK_FILL = PatternFill("solid", start_color="FFE3A3", end_color="FFE3A3")
DATETIME_FORMAT = "yyyy-mm-dd hh:mm"


def _naive_utc(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    return value.astimezone(UTC).replace(tzinfo=None)


def ticket_row(ticket: Ticket, now: datetime) -> dict:
    return {
        "id": ticket.id,
        "title": ticket.title,
        "category": ticket.category,
        "priority": ticket.priority,
        "status": ticket.status,
        "tier": ticket.tier,
        "created_by": ticket.created_by.name,
        "assigned_to": ticket.assigned_to.name if ticket.assigned_to else "",
        "created_at": ticket.created_at,
        "first_response_at": ticket.first_response_at,
        "resolved_at": ticket.resolved_at,
        "sla_state": ticket.sla(now)["state"],
    }


def _csv_safe(value):
    """Neutralise spreadsheet formula injection in text cells."""
    if isinstance(value, str) and value[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + value
    return value


def tickets_to_csv(tickets: Iterable[Ticket], now: datetime) -> str:
    buffer = io.StringIO()
    writer = csv.writer(buffer, lineterminator="\r\n")
    writer.writerow(EXPORT_COLUMNS)
    for ticket in tickets:
        row = ticket_row(ticket, now)
        values = []
        for column in EXPORT_COLUMNS:
            value = row[column]
            if column in DATETIME_COLUMNS:
                value = iso(value) or ""
            values.append(_csv_safe(value))
        writer.writerow(values)
    return buffer.getvalue()


def _style_header(sheet, row: int = 1) -> None:
    for cell in sheet[row]:
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(vertical="center")


def _auto_widths(sheet, minimum: int = 8, maximum: int = 60) -> None:
    widths: dict[int, int] = {}
    for row in sheet.iter_rows():
        for cell in row:
            if cell.value is None:
                continue
            value = cell.value
            length = (
                len(value.strftime("%Y-%m-%d %H:%M"))
                if isinstance(value, datetime)
                else len(str(value))
            )
            widths[cell.column] = max(widths.get(cell.column, 0), length)
    for column, width in widths.items():
        sheet.column_dimensions[get_column_letter(column)].width = max(
            minimum, min(maximum, width + 2)
        )


def _add_sla_conditional_fill(sheet, column_index: int, last_row: int) -> None:
    if last_row < 2:
        return
    letter = get_column_letter(column_index)
    cell_range = f"{letter}2:{letter}{last_row}"
    sheet.conditional_formatting.add(
        cell_range, CellIsRule(operator="equal", formula=['"breached"'], fill=BREACHED_FILL)
    )
    sheet.conditional_formatting.add(
        cell_range, CellIsRule(operator="equal", formula=['"at_risk"'], fill=AT_RISK_FILL)
    )


def _write_ticket_table(sheet, tickets: list[Ticket], now: datetime) -> None:
    sheet.append(list(EXPORT_COLUMNS))
    for ticket in tickets:
        row = ticket_row(ticket, now)
        sheet.append(
            [
                _naive_utc(row[c]) if c in DATETIME_COLUMNS else _csv_safe(row[c])
                for c in EXPORT_COLUMNS
            ]
        )
    _style_header(sheet)
    for column_index, name in enumerate(EXPORT_COLUMNS, start=1):
        if name in DATETIME_COLUMNS:
            for cell in sheet[get_column_letter(column_index)][1:]:
                cell.number_format = DATETIME_FORMAT
    sheet.freeze_panes = "A2"
    sheet.auto_filter.ref = f"A1:{get_column_letter(len(EXPORT_COLUMNS))}{max(sheet.max_row, 1)}"
    _add_sla_conditional_fill(sheet, EXPORT_COLUMNS.index("sla_state") + 1, sheet.max_row)
    _auto_widths(sheet)


def workbook_to_bytes(workbook: Workbook) -> bytes:
    buffer = io.BytesIO()
    workbook.save(buffer)
    return buffer.getvalue()


def tickets_to_xlsx(tickets: Iterable[Ticket], now: datetime) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Tickets"
    _write_ticket_table(sheet, list(tickets), now)
    return workbook_to_bytes(workbook)


def _in_range(value: datetime | None, start: datetime, end: datetime) -> bool:
    return value is not None and start <= value <= end


def compute_weekly_summary(
    tickets: list[Ticket], start: datetime, end: datetime, as_of: datetime
) -> dict:
    """Numbers for the weekly report. Period is [start, end]; SLA evaluated at ``as_of``."""
    created = [t for t in tickets if _in_range(t.created_at, start, end)]
    resolved = [t for t in tickets if _in_range(t.resolved_at, start, end)]
    open_now = [t for t in tickets if t.is_open]
    hours = [(t.resolved_at - t.created_at).total_seconds() / 3600 for t in resolved]
    on_time = sum(1 for t in resolved if t.resolved_at <= t.sla(as_of)["resolution_due"])
    return {
        "created": created,
        "resolved": resolved,
        "open_now": open_now,
        "avg_resolution_hours": round(sum(hours) / len(hours), 2) if hours else None,
        "sla_compliance_pct": round(100 * on_time / len(resolved), 1) if resolved else None,
    }


def build_weekly_workbook(
    tickets: list[Ticket], start: datetime, end: datetime, as_of: datetime
) -> Workbook:
    """Workbook with Summary, Tickets and SLA Breaches sheets."""
    summary = compute_weekly_summary(tickets, start, end, as_of)
    created = summary["created"]
    workbook = Workbook()

    sheet = workbook.active
    sheet.title = "Summary"
    sheet.append(["Metric", "Value"])
    rows: list[tuple[str, object]] = [
        ("Period start (UTC)", start.strftime("%Y-%m-%d %H:%M")),
        ("Period end (UTC)", end.strftime("%Y-%m-%d %H:%M")),
        ("Tickets created", len(created)),
        ("Tickets resolved", len(summary["resolved"])),
        ("Tickets open (currently)", len(summary["open_now"])),
        ("Avg resolution hours (resolved in period)", summary["avg_resolution_hours"] or "n/a"),
        (
            "SLA compliance % (resolved in period)",
            summary["sla_compliance_pct"] if summary["sla_compliance_pct"] is not None else "n/a",
        ),
    ]
    for row in rows:
        sheet.append(list(row))
    _style_header(sheet)
    for title, field, values in (
        ("Created by status", "status", STATUSES),
        ("Created by category", "category", CATEGORIES),
        ("Created by priority", "priority", PRIORITIES),
    ):
        counts = Counter(getattr(t, field) for t in created)
        sheet.append([])
        sheet.append([title, "Count"])
        _style_header(sheet, sheet.max_row)
        for value in values:
            sheet.append([value, counts.get(value, 0)])
    _auto_widths(sheet, minimum=12)

    detail = workbook.create_sheet("Tickets")
    _write_ticket_table(detail, sorted(created, key=lambda t: t.created_at), as_of)

    breaches = workbook.create_sheet("SLA Breaches")
    headers = [
        "id", "title", "priority", "status", "assigned_to", "created_at",
        "first_response_state", "resolution_state", "resolution_due", "overdue_hours",
    ]  # fmt: skip
    breaches.append(headers)
    relevant = {t.id: t for t in created + summary["resolved"] + summary["open_now"]}
    for ticket in sorted(relevant.values(), key=lambda t: t.created_at):
        sla = ticket.sla(as_of)
        if sla["state"] != "breached":
            continue
        done_at = ticket.resolved_at or ticket.closed_at or as_of
        overdue = max(0.0, (done_at - sla["resolution_due"]).total_seconds() / 3600)
        breaches.append(
            [
                ticket.id,
                _csv_safe(ticket.title),
                ticket.priority,
                ticket.status,
                ticket.assigned_to.name if ticket.assigned_to else "",
                _naive_utc(ticket.created_at),
                sla["first_response_state"],
                sla["resolution_state"],
                _naive_utc(sla["resolution_due"]),
                round(overdue, 1),
            ]
        )
    _style_header(breaches)
    for column in ("F", "I"):
        for cell in breaches[column][1:]:
            cell.number_format = DATETIME_FORMAT
    breaches.freeze_panes = "A2"
    _auto_widths(breaches)
    return workbook
