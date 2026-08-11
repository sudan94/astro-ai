"""Contract for the LLM's chart interpretation.

The chart itself is computed deterministically by `astro_calc` — the model never
does arithmetic, it only turns those numbers into language. This schema is what
makes that boundary enforceable: whatever the model returns has to fit here or
the call is repaired and retried rather than persisted.

The prompt's shape instructions are derived from this file (see
`analysis_json_skeleton`), so the contract and the instruction can't drift apart.
"""

import json
from typing import List

from pydantic import BaseModel, ConfigDict, Field, field_validator


class NamedFinding(BaseModel):
    """A yoga or dosha the model claims to see in the chart."""

    model_config = ConfigDict(extra="ignore")

    name: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1)


class AnalysisSummary(BaseModel):
    model_config = ConfigDict(extra="ignore")

    core_identity: str = Field(..., min_length=1)
    life_focus: str = Field(..., min_length=1)
    overall_tone: str = Field(..., min_length=1)


class ChartAnalysis(BaseModel):
    """The stored reading of a chart.

    Field names match what `PersonDetailPage` renders, so this doubles as the
    frontend contract.
    """

    model_config = ConfigDict(extra="ignore")

    summary: AnalysisSummary
    personality: List[str] = Field(..., min_length=1)
    career: List[str] = Field(..., min_length=1)
    relationships: List[str] = Field(..., min_length=1)
    strengths: List[str] = Field(..., min_length=1)
    challenges: List[str] = Field(..., min_length=1)
    health_tendencies: List[str] = Field(default_factory=list)
    spiritual_path: List[str] = Field(default_factory=list)
    key_yogas: List[NamedFinding] = Field(default_factory=list)
    key_doshas: List[NamedFinding] = Field(default_factory=list)

    @field_validator(
        "personality",
        "career",
        "relationships",
        "strengths",
        "challenges",
        "health_tendencies",
        "spiritual_path",
        mode="before",
    )
    @classmethod
    def _drop_blank_entries(cls, value):
        """Models occasionally pad a list with empty strings to hit a length.

        Strip those before the `min_length` check runs, so padding fails
        validation instead of silently passing.
        """
        if isinstance(value, list):
            return [item.strip() for item in value if isinstance(item, str) and item.strip()]
        return value


def analysis_json_skeleton() -> str:
    """The output shape, rendered for the prompt.

    Generated from the model rather than hand-written, so adding a field to
    `ChartAnalysis` updates the instruction the LLM receives automatically.
    """
    skeleton = {
        "summary": {"core_identity": "", "life_focus": "", "overall_tone": ""},
        "personality": [],
        "career": [],
        "relationships": [],
        "strengths": [],
        "challenges": [],
        "health_tendencies": [],
        "spiritual_path": [],
        "key_yogas": [{"name": "", "description": ""}],
        "key_doshas": [{"name": "", "description": ""}],
    }

    missing = set(ChartAnalysis.model_fields) - set(skeleton)
    if missing:  # pragma: no cover - guards against silent prompt drift
        raise RuntimeError(
            f"ChartAnalysis fields missing from the prompt skeleton: {sorted(missing)}"
        )

    return json.dumps(skeleton, indent=2)
