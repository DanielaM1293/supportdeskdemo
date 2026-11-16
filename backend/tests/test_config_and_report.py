import importlib.util
from pathlib import Path

import pytest
from openpyxl import load_workbook

from app import create_app
from app.config import load_config, normalize_database_url


def test_postgres_url_is_normalised():
    assert normalize_database_url("postgres://u:p@h/db") == "postgresql://u:p@h/db"
    assert normalize_database_url("postgresql://u:p@h/db") == "postgresql://u:p@h/db"


@pytest.mark.parametrize("database_url", [None, "", "sqlite:///x.db"])
def test_production_refuses_missing_or_sqlite_database(monkeypatch, database_url):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("SECRET_KEY", "a")
    monkeypatch.setenv("JWT_SECRET_KEY", "b")
    if database_url is None:
        monkeypatch.delenv("DATABASE_URL", raising=False)
    else:
        monkeypatch.setenv("DATABASE_URL", database_url)
    with pytest.raises(RuntimeError):
        load_config()
    with pytest.raises(RuntimeError):
        create_app()


def test_production_accepts_postgres_url(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("DATABASE_URL", "postgres://u:p@h/db")
    monkeypatch.setenv("SECRET_KEY", "a")
    monkeypatch.setenv("JWT_SECRET_KEY", "b")
    monkeypatch.setenv("CORS_ORIGINS", "https://a.example, https://b.example")
    config = load_config()
    assert config["SQLALCHEMY_DATABASE_URI"].startswith("postgresql://")
    assert config["CORS_ORIGINS"] == ["https://a.example", "https://b.example"]


def test_weekly_report_script_writes_workbook(app, client, headers, create_ticket, tmp_path):
    create_ticket(headers["usuario"])
    path = Path(__file__).resolve().parent.parent / "scripts" / "weekly_report.py"
    spec = importlib.util.spec_from_file_location("weekly_report", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    # Reuse the in-memory test app instead of building a new one from the environment.
    module.create_app = lambda: app
    output = tmp_path / "report.xlsx"
    module.main(["--output", str(output)])
    workbook = load_workbook(output)
    assert workbook.sheetnames == ["Summary", "Tickets", "SLA Breaches"]
    summary = {row[0]: row[1] for row in workbook["Summary"].iter_rows(values_only=True)}
    assert summary["Tickets created"] == 1
    assert workbook["Tickets"].max_row == 2
