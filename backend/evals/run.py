"""Eval runner for the chart-analysis workflow.

Four modes:

    python -m evals.run                 # replay recorded outputs, no API key needed
    python -m evals.run --mock          # self-test the harness, no API key, no recordings
    python -m evals.run --live          # call the model, grade the fresh output
    python -m evals.run --record        # call the model and save outputs as the new baseline

Replay is the default so the suite runs in CI and during a demo without spending
money or depending on the provider being up. `--record` is how the baseline gets
refreshed when the prompt or schema changes. `--mock` grades a stub derived from
the chart, which verifies the harness rather than any model.

Exit code is non-zero if any check fails, so this can gate a build.
"""

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from evals import checks  # noqa: E402
from evals.cases import CASES, EvalCase  # noqa: E402

RECORDINGS_DIR = Path(__file__).resolve().parent / "recordings"


def compute_chart(case: EvalCase) -> Dict[str, Any]:
    from app.utilities.astro_calc import calculate_vedic_chart

    chart = calculate_vedic_chart(
        date_of_birth=case.date_of_birth,
        latitude=case.latitude,
        longitude=case.longitude,
        timezone=None,
    )
    if "error" in chart:
        raise RuntimeError(
            f"Could not compute chart for {case.id}: {chart['error']}. "
            "Install pyswisseph (pip install -r requirements.txt)."
        )
    return chart


def recording_path(case: EvalCase) -> Path:
    return RECORDINGS_DIR / f"{case.id}.json"


def load_recording(case: EvalCase) -> Dict[str, Any]:
    path = recording_path(case)
    if not path.exists():
        raise FileNotFoundError(
            f"No recording for '{case.id}'. Run `python -m evals.run --record` "
            "with OPENAI_API_KEY set to create the baseline."
        )
    return json.loads(path.read_text(encoding="utf-8"))["analysis"]


def save_recording(case: EvalCase, chart: Dict[str, Any], analysis: Dict[str, Any]) -> None:
    RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)
    recording_path(case).write_text(
        json.dumps(
            {
                "case_id": case.id,
                "model": os.getenv("OPENAPI_MODEL", "gpt-5-chat-latest"),
                "ascendant_sign": chart.get("ascendant_sign"),
                "analysis": analysis,
            },
            indent=2,
        ),
        encoding="utf-8",
    )


async def generate_analysis(chart: Dict[str, Any]) -> Dict[str, Any]:
    from app.controller.astroController import run_chart_analysis

    return await run_chart_analysis(chart)


def mock_analysis(chart: Dict[str, Any]) -> Dict[str, Any]:
    """A faithful analysis derived directly from the chart.

    This is a self-test of the harness, not a measurement of any model: it
    exercises chart computation, the graders and the report end to end so the
    suite is runnable straight after a clone, with no API key and no spend.
    Real numbers come from --live or --record.
    """
    planets = chart.get("planets") or {}
    sun_sign = (planets.get("Sun") or {}).get("sign", "an unknown sign")
    moon_sign = (planets.get("Moon") or {}).get("sign", "an unknown sign")
    ascendant = chart.get("ascendant_sign", "an unknown sign")

    return {
        "summary": {
            "core_identity": f"{ascendant} rising shapes the outward manner.",
            "life_focus": f"The Sun in {sun_sign} points to the central theme.",
            "overall_tone": f"The Moon in {moon_sign} colours the emotional life.",
        },
        "personality": [f"{ascendant} rising sets the first impression."],
        "career": [f"The Sun in {sun_sign} suggests the working temperament."],
        "relationships": [f"The Moon in {moon_sign} shapes attachment style."],
        "strengths": ["Derived from the computed placements above."],
        "challenges": ["Derived from the computed placements above."],
        "health_tendencies": [],
        "spiritual_path": [],
        "key_yogas": [],
        "key_doshas": [],
    }


async def evaluate_case(
    case: EvalCase, mode: str
) -> Tuple[Dict[str, Any], List[checks.CheckResult], Optional[str]]:
    chart = compute_chart(case)

    try:
        if mode == "mock":
            analysis = mock_analysis(chart)
        elif mode == "replay":
            analysis = load_recording(case)
        else:
            analysis = await generate_analysis(chart)
            if mode == "record":
                save_recording(case, chart, analysis)
    except Exception as exc:  # noqa: BLE001 - reported per case, not fatal
        return chart, [], str(exc)

    return chart, checks.run_all(chart, analysis), None


def print_report(rows: List[Tuple[EvalCase, List[checks.CheckResult], Optional[str]]]) -> bool:
    all_passed = True
    check_names = [check.__name__.replace("check_", "") for check in checks.ALL_CHECKS]
    width = max(len(name) for name in check_names) + 2

    for case, results, error in rows:
        print(f"\n{case.id}  ({case.place_of_birth})")
        print(f"  {case.note}")

        if error:
            all_passed = False
            print(f"  ERROR  {error}")
            continue

        for result in results:
            print(f"  {result.status:<5} {result.name:<{width}} {result.detail}")
            for failure in result.failures:
                all_passed = False
                print(f"           - {failure}")
            if not result.passed:
                all_passed = False

    total_checks = sum(len(results) for _, results, _ in rows)
    failed_checks = sum(
        1 for _, results, _ in rows for result in results if not result.passed
    )
    errored = sum(1 for _, _, error in rows if error)

    print(
        f"\n{len(rows)} case(s), {total_checks} check(s): "
        f"{total_checks - failed_checks} passed, {failed_checks} failed, {errored} errored"
    )
    return all_passed and not errored


async def main_async(args: argparse.Namespace) -> int:
    selected = [case for case in CASES if not args.case or case.id in args.case]
    if not selected:
        print(f"No cases matched {args.case}", file=sys.stderr)
        return 2

    if args.record:
        mode = "record"
    elif args.live:
        mode = "live"
    elif args.mock:
        mode = "mock"
    else:
        mode = "replay"

    print(f"Running chart-analysis evals in {mode} mode on {len(selected)} case(s)")
    if mode == "mock":
        print("NOTE: mock mode grades a chart-derived stub, not model output. "
              "It verifies the harness, not the model.")

    rows = []
    for case in selected:
        chart, results, error = await evaluate_case(case, mode)
        rows.append((case, results, error))

    passed = print_report(rows)
    return 0 if passed else 1


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--live", action="store_true", help="Call the model instead of replaying recordings"
    )
    group.add_argument(
        "--record", action="store_true", help="Call the model and overwrite the baseline"
    )
    group.add_argument(
        "--mock",
        action="store_true",
        help="Grade a chart-derived stub instead of model output (harness self-test)",
    )
    parser.add_argument(
        "--case", action="append", help="Run only this case id (repeatable)"
    )
    args = parser.parse_args()

    return asyncio.run(main_async(args))


if __name__ == "__main__":
    raise SystemExit(main())
