"""Generate the weekly XLSX report.

Usage: python scripts/weekly_report.py [--output PATH] [--weeks-back N] [--end-date YYYY-MM-DD]
Default period: the last 7 days up to now. With --end-date the period ends at the end of that
day (UTC) and spans N weeks (default 1).
"""

import argparse
import sys
from datetime import UTC, datetime, time, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy.orm import joinedload  # noqa: E402

from app import create_app  # noqa: E402
from app.models import Ticket  # noqa: E402
from app.services.export import build_weekly_workbook  # noqa: E402


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="SupportDesk weekly report")
    parser.add_argument(
        "--output", help="output .xlsx path (default reports/weekly_report_DATE.xlsx)"
    )
    parser.add_argument("--weeks-back", type=int, default=1, help="weeks covered (default 1)")
    parser.add_argument(
        "--end-date",
        type=lambda s: datetime.strptime(s, "%Y-%m-%d").date(),
        help="last day of the period, YYYY-MM-DD (default: now)",
    )
    args = parser.parse_args(argv)
    if args.weeks_back < 1:
        parser.error("--weeks-back must be >= 1")
    return args


def compute_period(now, end_date, weeks_back):
    if end_date is None:
        end = now
    else:
        end = datetime.combine(end_date, time(23, 59, 59), tzinfo=UTC)
    return end - timedelta(weeks=weeks_back), end


def main(argv=None) -> Path:
    args = parse_args(argv)
    now = datetime.now(UTC)
    start, end = compute_period(now, args.end_date, args.weeks_back)
    output = Path(args.output or f"reports/weekly_report_{end:%Y-%m-%d}.xlsx")
    output.parent.mkdir(parents=True, exist_ok=True)

    app = create_app()
    with app.app_context():
        tickets = Ticket.query.options(
            joinedload(Ticket.created_by), joinedload(Ticket.assigned_to)
        ).all()
        workbook = build_weekly_workbook(tickets, start, end, min(end, now))
    workbook.save(output)
    print(f"Report written to {output}")
    return output


if __name__ == "__main__":
    main()
