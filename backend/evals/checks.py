"""Graders for the chart-analysis workflow.

The schema guarantees the analysis is *shaped* correctly. It says nothing about
whether the analysis is *about the chart it was given* — a model can return a
perfectly valid reading that places Mars in a sign it isn't in. These checks
close that gap by re-deriving the claims from the deterministic chart and
comparing.

Each grader takes (chart, analysis) and returns a CheckResult. They are pure and
model-free, so they run offline against recorded outputs.
"""

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List

SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

PLANETS = [
    "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Rahu", "Ketu",
]

_PLANET_ALT = "|".join(PLANETS)
_SIGN_ALT = "|".join(SIGNS)

# "Mars in Scorpio", "the Sun is placed in Virgo", "Moon, located in Cancer"
PLACEMENT_PATTERN = re.compile(
    rf"\b(?P<planet>{_PLANET_ALT})\b"
    rf"(?:\s*,)?\s*(?:is\s+|being\s+)?(?:placed\s+|posited\s+|located\s+|sitting\s+)?"
    rf"in\s+(?:the\s+)?(?:sign\s+of\s+)?(?P<sign>{_SIGN_ALT})\b",
    re.IGNORECASE,
)

# "Saturn in the 7th house", "Jupiter in house 10"
HOUSE_PATTERN = re.compile(
    rf"\b(?P<planet>{_PLANET_ALT})\b"
    rf"(?:\s*,)?\s*(?:is\s+|being\s+)?(?:placed\s+|posited\s+|located\s+)?"
    rf"in\s+(?:the\s+)?(?:(?P<ordinal>\d{{1,2}})(?:st|nd|rd|th)?\s+house"
    rf"|house\s+(?P<cardinal>\d{{1,2}}))\b",
    re.IGNORECASE,
)

# The analysis is cached and reused, so the prompt forbids time-varying content.
TIME_VARYING_TERMS = ["transit", "dasha", "antardasha", "gochar", "mahadasha"]


@dataclass
class CheckResult:
    name: str
    passed: bool
    detail: str = ""
    failures: List[str] = field(default_factory=list)

    @property
    def status(self) -> str:
        return "PASS" if self.passed else "FAIL"


def analysis_text(analysis: Dict[str, Any]) -> str:
    """Flatten every string in the analysis into one searchable blob."""
    chunks: List[str] = []

    def walk(node: Any) -> None:
        if isinstance(node, str):
            chunks.append(node)
        elif isinstance(node, list):
            for item in node:
                walk(item)
        elif isinstance(node, dict):
            for value in node.values():
                walk(value)

    walk(analysis)
    return "\n".join(chunks)


def _chart_signs(chart: Dict[str, Any]) -> Dict[str, str]:
    planets = chart.get("planets") or {}
    return {
        name: body.get("sign")
        for name, body in planets.items()
        if isinstance(body, dict) and body.get("sign")
    }


def _chart_houses(chart: Dict[str, Any]) -> Dict[str, int]:
    """Whole-sign house number for each planet.

    With whole-sign houses the ascendant's sign is house 1 and each subsequent
    sign is the next house, so this is derivable without re-reading the chart's
    house block.
    """
    ascendant = (chart.get("ascendant") or {}).get("sign") or chart.get("ascendant_sign")
    if ascendant not in SIGNS:
        return {}

    asc_index = SIGNS.index(ascendant)
    houses: Dict[str, int] = {}
    for planet, sign in _chart_signs(chart).items():
        if sign in SIGNS:
            houses[planet] = ((SIGNS.index(sign) - asc_index) % 12) + 1
    return houses


def check_placements_grounded(chart: Dict[str, Any], analysis: Dict[str, Any]) -> CheckResult:
    """Every "<planet> in <sign>" claim must match the computed chart."""
    actual = _chart_signs(chart)
    text = analysis_text(analysis)
    failures: List[str] = []
    checked = 0

    for match in PLACEMENT_PATTERN.finditer(text):
        planet = match.group("planet").capitalize()
        claimed = match.group("sign").capitalize()
        truth = actual.get(planet)
        if truth is None:
            continue
        checked += 1
        if truth != claimed:
            failures.append(
                f'claimed "{planet} in {claimed}" but chart has {planet} in {truth}'
            )

    return CheckResult(
        name="placements_grounded",
        passed=not failures,
        detail=f"{checked} placement claim(s) checked",
        failures=failures,
    )


def check_houses_grounded(chart: Dict[str, Any], analysis: Dict[str, Any]) -> CheckResult:
    """Every "<planet> in the Nth house" claim must match whole-sign houses."""
    actual = _chart_houses(chart)
    text = analysis_text(analysis)
    failures: List[str] = []
    checked = 0

    for match in HOUSE_PATTERN.finditer(text):
        planet = match.group("planet").capitalize()
        raw = match.group("ordinal") or match.group("cardinal")
        try:
            claimed = int(raw)
        except (TypeError, ValueError):
            continue
        truth = actual.get(planet)
        if truth is None or not 1 <= claimed <= 12:
            continue
        checked += 1
        if truth != claimed:
            failures.append(
                f'claimed "{planet} in house {claimed}" but chart has it in house {truth}'
            )

    return CheckResult(
        name="houses_grounded",
        passed=not failures,
        detail=f"{checked} house claim(s) checked",
        failures=failures,
    )


def check_no_time_varying_claims(chart: Dict[str, Any], analysis: Dict[str, Any]) -> CheckResult:
    """The reading is cached indefinitely, so it must not date itself."""
    text = analysis_text(analysis).lower()
    found = sorted({term for term in TIME_VARYING_TERMS if term in text})

    return CheckResult(
        name="no_time_varying_claims",
        passed=not found,
        detail="no transit/dasha language" if not found else "",
        failures=[f"mentions time-varying concept: {term}" for term in found],
    )


REQUIRED_NON_EMPTY = [
    "personality",
    "career",
    "relationships",
    "strengths",
    "challenges",
]


def check_coverage(chart: Dict[str, Any], analysis: Dict[str, Any]) -> CheckResult:
    """Every section a user sees must have content behind it."""
    failures = []
    for key in REQUIRED_NON_EMPTY:
        values = analysis.get(key)
        if not isinstance(values, list) or not [v for v in values if str(v).strip()]:
            failures.append(f"{key} is empty")

    summary = analysis.get("summary") or {}
    for key in ("core_identity", "life_focus", "overall_tone"):
        if not str(summary.get(key, "")).strip():
            failures.append(f"summary.{key} is empty")

    return CheckResult(
        name="coverage",
        passed=not failures,
        detail=f"{len(REQUIRED_NON_EMPTY) + 3} required fields populated" if not failures else "",
        failures=failures,
    )


ALL_CHECKS = [
    check_coverage,
    check_placements_grounded,
    check_houses_grounded,
    check_no_time_varying_claims,
]


def run_all(chart: Dict[str, Any], analysis: Dict[str, Any]) -> List[CheckResult]:
    return [check(chart, analysis) for check in ALL_CHECKS]
