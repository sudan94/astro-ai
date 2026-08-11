"""Tests for chart generation and, above all, for when the LLM is *not* called.

The analysis is the expensive part of this workflow. `get_vedic_chart` used to
run it unconditionally on every request, so each chart view re-billed a full
analysis and overwrote the stored one. These tests pin the caching contract.
"""

from datetime import datetime
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.controller import astroController
from app.models.Astro import Astro
from app.utilities import llm
from tests.test_ai_workflow import CHART, VALID_ANALYSIS


class FakeQuery:
    def __init__(self, result):
        self._result = result

    def filter(self, *args, **kwargs):
        return self

    def first(self):
        return self._result


class FakeSession:
    """Minimal stand-in for a SQLAlchemy session.

    Dispatches on the queried model rather than call order, so the tests don't
    break when the controller reorders its lookups.
    """

    def __init__(self, person=None, astro=None):
        self._results = {"Person": person, "Astro": astro}
        self.added = []
        self.commits = 0

    def query(self, model):
        return FakeQuery(self._results.get(model.__name__))

    def add(self, obj):
        self.added.append(obj)
        self._results["Astro"] = obj

    def commit(self):
        self.commits += 1

    def refresh(self, obj):
        pass

    def rollback(self):
        pass


PERSON = SimpleNamespace(
    id=1,
    user_id=7,
    name="Alice",
    date_of_birth=datetime(1990, 5, 1, 10, 30),
    place_of_birth="Kathmandu",
    latitude=27.7172,
    longitude=85.3240,
)


@pytest.fixture
def no_ephemeris(monkeypatch):
    """Return a fixed chart so tests don't depend on pyswisseph being built."""
    monkeypatch.setattr(
        astroController, "calculate_vedic_chart", lambda **kwargs: CHART
    )


@pytest.fixture
def analysis_spy(monkeypatch):
    """Count analysis calls so 'was the model called?' is directly assertable."""
    calls = []

    async def _fake_analysis(chart_data):
        calls.append(chart_data)
        return VALID_ANALYSIS

    monkeypatch.setattr(astroController, "run_chart_analysis", _fake_analysis)
    return calls


async def test_analysis_is_generated_when_missing(no_ephemeris, analysis_spy):
    db = FakeSession(person=PERSON, astro=None)

    await astroController.get_vedic_chart(db, person_id=1, user_id=7)

    assert len(analysis_spy) == 1
    assert db.added[0].ai_analysis == VALID_ANALYSIS


async def test_cached_analysis_is_not_regenerated(no_ephemeris, analysis_spy):
    """The regression this suite exists for: a second read must be free."""
    existing = Astro(
        person_id=1,
        vedic_chart=CHART,
        ascendent_sign="Leo",
        summary="s",
        ai_analysis=VALID_ANALYSIS,
    )
    db = FakeSession(person=PERSON, astro=existing)

    await astroController.get_vedic_chart(db, person_id=1, user_id=7)

    assert analysis_spy == []
    assert existing.ai_analysis == VALID_ANALYSIS


async def test_refresh_forces_regeneration(no_ephemeris, analysis_spy):
    existing = Astro(
        person_id=1,
        vedic_chart=CHART,
        ascendent_sign="Leo",
        summary="s",
        ai_analysis={"summary": {"core_identity": "stale"}},
    )
    db = FakeSession(person=PERSON, astro=existing)

    await astroController.get_vedic_chart(db, person_id=1, user_id=7, refresh=True)

    assert len(analysis_spy) == 1
    assert existing.ai_analysis == VALID_ANALYSIS


async def test_empty_analysis_is_regenerated(no_ephemeris, analysis_spy):
    """A row left without an analysis by an earlier failure heals on next read."""
    existing = Astro(
        person_id=1, vedic_chart=CHART, ascendent_sign="Leo", summary="s", ai_analysis=None
    )
    db = FakeSession(person=PERSON, astro=existing)

    await astroController.get_vedic_chart(db, person_id=1, user_id=7)

    assert len(analysis_spy) == 1


async def test_chart_is_still_returned_when_analysis_fails(no_ephemeris, monkeypatch):
    """The placements are the product; the reading is a layer on top."""
    async def _failing(chart_data):
        raise llm.LLMUnavailableError("provider down")

    monkeypatch.setattr(astroController, "run_chart_analysis", _failing)
    db = FakeSession(person=PERSON, astro=None)

    chart = await astroController.get_vedic_chart(db, person_id=1, user_id=7)

    assert chart["ascendant_sign"] == "Leo"
    assert db.added[0].ai_analysis is None
    assert db.commits == 1


async def test_schema_failure_does_not_overwrite_a_good_analysis(no_ephemeris, monkeypatch):
    async def _failing(chart_data):
        raise llm.LLMSchemaError("never validated")

    monkeypatch.setattr(astroController, "run_chart_analysis", _failing)
    existing = Astro(
        person_id=1, vedic_chart=CHART, ascendent_sign="Leo", summary="s",
        ai_analysis=VALID_ANALYSIS,
    )
    db = FakeSession(person=PERSON, astro=existing)

    await astroController.get_vedic_chart(db, person_id=1, user_id=7, refresh=True)

    assert existing.ai_analysis == VALID_ANALYSIS


async def test_foreign_person_is_not_found(no_ephemeris, analysis_spy):
    """Authorization lives in the query, so another user's person is a 404."""
    db = FakeSession(person=None, astro=None)

    with pytest.raises(HTTPException) as exc:
        await astroController.get_vedic_chart(db, person_id=1, user_id=99)

    assert exc.value.status_code == 404
    assert analysis_spy == []


def test_chart_summary_survives_a_chart_without_moon():
    """`get_chart_summary` used to KeyError when the ephemeris returned no Moon."""
    chart = {"ascendant_sign": "Leo", "planets": {"Sun": {"sign": "Virgo", "longitude": 165.2}}}

    summary = astroController.get_chart_summary(chart)

    assert "Ascendant: Leo" in summary
    assert "Sun: 165.20 (Virgo)" in summary
