from datetime import UTC, datetime, timedelta

from app.sla import compute_sla, metric_state, overall_state, sla_deadlines

T0 = datetime(2026, 1, 5, 9, 0, tzinfo=UTC)


def hours(n):
    return timedelta(hours=n)


def test_deadlines_per_priority():
    expected = {"critica": (1, 4), "alta": (4, 8), "media": (8, 24), "baja": (24, 72)}
    for priority, (first, resolution) in expected.items():
        first_due, resolution_due = sla_deadlines(priority, T0)
        assert first_due == T0 + hours(first)
        assert resolution_due == T0 + hours(resolution)


def test_metric_ok_when_early():
    assert metric_state(T0, T0 + hours(8), None, T0 + hours(2)) == "ok"


def test_metric_at_risk_from_75_percent():
    due = T0 + hours(8)
    assert metric_state(T0, due, None, T0 + hours(5.9)) == "ok"
    assert metric_state(T0, due, None, T0 + hours(6)) == "at_risk"
    assert metric_state(T0, due, None, T0 + hours(8)) == "at_risk"


def test_metric_breached_after_deadline():
    assert metric_state(T0, T0 + hours(8), None, T0 + hours(8.01)) == "breached"


def test_metric_met_and_completed_late():
    due = T0 + hours(8)
    assert metric_state(T0, due, T0 + hours(7), T0 + hours(100)) == "met"
    assert metric_state(T0, due, T0 + hours(9), T0 + hours(100)) == "breached"


def test_overall_state_worst_wins():
    assert overall_state("met", "met") == "met"
    assert overall_state("met", "ok") == "ok"
    assert overall_state("ok", "at_risk") == "at_risk"
    assert overall_state("at_risk", "breached") == "breached"
    assert overall_state("met", "breached") == "breached"


def test_compute_sla_resolved_on_time_is_met():
    sla = compute_sla("media", T0, T0 + hours(1), T0 + hours(10), None, T0 + hours(200))
    assert sla["state"] == "met"
    assert sla["first_response_due"] == T0 + hours(8)
    assert sla["resolution_due"] == T0 + hours(24)


def test_compute_sla_open_ticket_breaches_over_time():
    kwargs = {"priority": "critica", "created_at": T0, "first_response_at": None}
    kwargs |= {"resolved_at": None, "closed_at": None}
    assert compute_sla(now=T0 + hours(0.5), **kwargs)["state"] == "ok"
    assert compute_sla(now=T0 + hours(0.8), **kwargs)["first_response_state"] == "at_risk"
    assert compute_sla(now=T0 + hours(2), **kwargs)["state"] == "breached"


def test_compute_sla_closed_without_resolution_uses_closed_at():
    sla = compute_sla("baja", T0, T0 + hours(1), None, T0 + hours(10), T0 + hours(500))
    assert sla["resolution_state"] == "met"
