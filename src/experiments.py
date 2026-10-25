"""Generate a fresh, self-contained evidence bundle: python -m src.experiments."""
import argparse
from copy import deepcopy
from datetime import datetime, timezone
from importlib.metadata import version
import json
from pathlib import Path
import platform
import subprocess
from time import perf_counter
from uuid import uuid4

from src.core.constraints import angular_distance_deg
from src.core.fitness import evaluate_constellation
from src.core.genetic_algorithm import optimize, GenerationFailure
from src.data.scenario import REGIONS, RESTRICTED_ZONES
from src.visualization.exporter import save_result


def run_experiments(output_root="results"):
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    destination = Path(output_root) / f"evidence_{stamp}_{uuid4().hex[:8]}"
    destination.mkdir(parents=True, exist_ok=False)
    summary = {"created_at_utc": datetime.now(timezone.utc).isoformat(),
               "environment": {"python": platform.python_version(), "Flask": version("Flask"),
                               "pytest": version("pytest"), "platform": platform.platform()},
               "cases": [], "checks": {}}
    for label, command in (("git_head", ["git", "rev-parse", "HEAD"]),
                           ("git_status", ["git", "status", "--short"])):
        try:
            summary[label] = subprocess.check_output(command, text=True).strip()
        except (OSError, subprocess.CalledProcessError):
            summary[label] = "No disponible"

    def execute(label, **options):
        start = perf_counter()
        try:
            result = optimize(**options)
        except GenerationFailure as exc:
            result = exc.result
        result["experiment"] = {"label": label, "duration_seconds": round(perf_counter()-start, 6),
                                "executed_at_utc": datetime.now(timezone.utc).isoformat()}
        saved = save_result(result, destination)
        row = {"label": label, "file": Path(saved).name, "status": result["status"],
               "duration_seconds": result["experiment"]["duration_seconds"], "parameters": result["parameters"]}
        if "metrics" in result:
            row.update(initial_fitness=result["initial_metrics"]["fitness"], fitness=result["metrics"]["fitness"],
                       coverage_pct=result["metrics"]["weighted_coverage_pct"], covered=result["metrics"]["covered_count"],
                       valid=result["metrics"]["valid"],
                       first_complete_generation=next((h["generation"] for h in result["history"]
                                                      if h["covered_regions"] == len(result["scenario"]["regions"]) and h["valid"]), None))
        summary["cases"].append(row)
        print(json.dumps(row, ensure_ascii=False), flush=True)
        return result

    baseline = [execute(f"base_seed_{seed}", seed=seed) for seed in range(42, 47)]
    repeat = execute("repeat_seed_42", seed=42)
    summary["checks"]["repeat_seed_42_identical"] = all(
        repeat[key] == baseline[0][key] for key in ("best", "initial", "metrics", "initial_metrics", "history", "scenario", "parameters"))
    summary["checks"]["distinct_baseline_configurations"] = len({json.dumps(r["best"], sort_keys=True) for r in baseline})
    summary["checks"]["monotonic_baselines"] = all(
        all(a["best_so_far"] <= b["best_so_far"] for a, b in zip(r["history"], r["history"][1:])) for r in baseline)
    zones = deepcopy(RESTRICTED_ZONES) + [dict(id="stress_yucatan", name="Zona experimental sobre Yucatán",
                                             lat=20.5, lon=-89., radius_deg=6., kind="Restricción experimental")]
    reduced = [execute(f"reduced_seed_{seed}", seed=seed, restricted_zones=zones) for seed in range(42, 47)]
    regions = deepcopy(REGIONS)
    regions[0].update(priority="Normal", weight=1)
    regions[-1].update(priority="Alta", weight=3)
    priority = execute("changed_priorities_reduced_seed_42", seed=42, regions=regions, restricted_zones=zones)
    summary["checks"]["same_positions_rescored_changed_priorities"] = evaluate_constellation(
        reduced[0]["best"], regions, restricted_zones=zones)["weighted_coverage_pct"]
    summary["checks"]["priority_run_same_positions"] = priority["best"] == reduced[0]["best"]
    for mutation in (0.05, 0.40):
        execute(f"mutation_{mutation}_seed_42", seed=42, mutation_rate=mutation)
    blocked = [dict(id=f"block-{i}", name=f"Bloqueo hemisférico {i}", lat=0, lon=lon, radius_deg=100)
               for i, lon in enumerate((0, 180))]
    execute("blocked_sphere_admitted_radii", seed=42, generations=2, population_size=4, restricted_zones=blocked)
    summary["checks"]["dateline_distance_deg"] = angular_distance_deg(0, 179, 0, -179)
    summary_path = destination / "summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2, allow_nan=False), encoding="utf-8")
    print(f"Evidencias: {summary_path}", flush=True)
    return summary_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output-root", default="results")
    run_experiments(parser.parse_args().output_root)
