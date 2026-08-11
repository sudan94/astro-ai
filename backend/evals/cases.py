"""Golden cases for the chart-analysis eval.

Synthetic birth data, chosen to spread across the wheel rather than to describe
real people: different hemispheres, a near-midnight birth, a high-latitude birth
(where ascendant calculation is most fragile) and an equatorial one.

Charts are not stored here - they are recomputed from this birth data by the
ephemeris engine on every run, so a regression in `astro_calc` shows up as an
eval failure too.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import List


@dataclass(frozen=True)
class EvalCase:
    id: str
    name: str
    date_of_birth: datetime
    place_of_birth: str
    latitude: float
    longitude: float
    note: str


CASES: List[EvalCase] = [
    EvalCase(
        id="kathmandu_morning",
        name="Case A",
        date_of_birth=datetime(1990, 5, 1, 10, 30),
        place_of_birth="Kathmandu, Nepal",
        latitude=27.7172,
        longitude=85.3240,
        note="Baseline northern-hemisphere daytime birth.",
    ),
    EvalCase(
        id="delhi_predawn",
        name="Case B",
        date_of_birth=datetime(1988, 7, 9, 4, 15),
        place_of_birth="Delhi, India",
        latitude=28.6139,
        longitude=77.2090,
        note="Pre-dawn birth: ascendant sits close to a sign boundary.",
    ),
    EvalCase(
        id="sydney_near_midnight",
        name="Case C",
        date_of_birth=datetime(1995, 11, 23, 23, 50),
        place_of_birth="Sydney, Australia",
        latitude=-33.8688,
        longitude=151.2093,
        note="Southern hemisphere, near-midnight - exercises the UTC conversion.",
    ),
    EvalCase(
        id="reykjavik_winter",
        name="Case D",
        date_of_birth=datetime(1979, 12, 21, 14, 5),
        place_of_birth="Reykjavik, Iceland",
        latitude=64.1466,
        longitude=-21.9426,
        note="High latitude, winter solstice - hardest case for house calculation.",
    ),
    EvalCase(
        id="quito_equator",
        name="Case E",
        date_of_birth=datetime(2001, 3, 14, 18, 40),
        place_of_birth="Quito, Ecuador",
        latitude=-0.1807,
        longitude=-78.4678,
        note="Equatorial, western longitude - negative UTC offset path.",
    ),
]


def by_id(case_id: str) -> EvalCase:
    for case in CASES:
        if case.id == case_id:
            return case
    raise KeyError(f"Unknown eval case: {case_id}")
