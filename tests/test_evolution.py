from copy import deepcopy
import math
import random

import pytest

from src.core.constraints import angular_distance_deg, is_valid_position, validate_constellation
from src.core.fitness import evaluate_constellation
from src.core.genetic_algorithm import optimize, random_position, crossover, mutate, make_individual, GenerationFailure
from src.data.scenario import REGIONS, RESTRICTED_ZONES, OCCUPIED_OBJECTS


@pytest.mark.parametrize("zone", RESTRICTED_ZONES + OCCUPIED_OBJECTS, ids=lambda z: z["id"])
def test_each_exclusion_affects_generation_and_validation(zone):
    point = dict(lat=zone["lat"], lon=zone["lon"])
    assert not is_valid_position(point)
    target = [dict(REGIONS[0], **point)]
    rng = random.Random(42)
    generated = [random_position(rng, target) for _ in range(25)]
    assert all(is_valid_position(p) for p in generated)
    assert len({(p["lat"], p["lon"]) for p in generated}) > 1


def test_reproducibility_evolution_and_snapshot():
    regions = deepcopy(REGIONS)
    a = optimize(generations=12, population_size=20, seed=42, regions=regions)
    b = optimize(generations=12, population_size=20, seed=42)
    assert a == b
    assert len(a["history"]) == 13
    assert a["history"][0]["best_so_far"] == a["initial_metrics"]["fitness"]
    assert a["history"][-1]["best_so_far"] == a["metrics"]["fitness"]
    assert all(x["best_so_far"] <= y["best_so_far"] for x, y in zip(a["history"], a["history"][1:]))
    assert validate_constellation(a["best"])["valid"]
    regions[0]["weight"] = 100
    assert a["scenario"]["regions"][0]["weight"] == 3
    c = optimize(generations=12, population_size=20, seed=43)
    assert a["best"] != c["best"]


def test_resolved_random_seed_can_be_replayed():
    a = optimize(generations=2, population_size=4)
    b = optimize(generations=2, population_size=4, seed=a["parameters"]["seed"])
    assert a["best"] == b["best"]
    assert a["history"] == b["history"]


def test_operators_explore_without_mutating_parents():
    rng = random.Random(42)
    a, b = make_individual(rng), make_individual(rng)
    original = deepcopy(a)
    child = crossover(a, b, rng)
    assert child != a and child != b
    mutated = mutate(child, rng, 1, REGIONS, RESTRICTED_ZONES, OCCUPIED_OBJECTS)
    assert mutated != child
    assert a == original
    assert validate_constellation(mutated)["valid"]


def test_reduced_space_and_priority_scoring():
    zones = RESTRICTED_ZONES + [dict(id="stress", name="Yucatán bloqueado", lat=20.5, lon=-89., radius_deg=6)]
    r = optimize(generations=12, population_size=20, seed=42, restricted_zones=zones)
    assert r["status"] == "partial"
    assert "yucatan" in r["metrics"]["uncovered_region_ids"]
    assert r["metrics"]["valid"]
    regions = deepcopy(REGIONS)
    regions[0].update(weight=1, priority="Normal")
    regions[-1].update(weight=3, priority="Alta")
    rescore = evaluate_constellation(r["best"], regions, restricted_zones=zones)
    assert rescore["weighted_coverage_pct"] > r["metrics"]["weighted_coverage_pct"]


def test_admitted_spatially_blocked_scenario_stops():
    zones = [dict(id=f"z{i}", name=f"Bloqueo {i}", lat=0, lon=lon, radius_deg=100)
             for i, lon in enumerate((0, 180))]
    with pytest.raises(GenerationFailure) as failure:
        optimize(generations=2, population_size=4, seed=42, restricted_zones=zones)
    assert failure.value.result["status"] == "generation_failed"
    assert failure.value.result["scenario"]["restricted_zones"] == zones


def test_dateline_and_coverage_threshold_additional():
    assert angular_distance_deg(0, 179, 0, -179) == pytest.approx(2)
    region = [dict(id="equator", name="Ecuador", lat=0, lon=0, priority="Normal", weight=1)]
    for km, expected in [(299.999, True), (300.001, False)]:
        sats = [dict(id=f"s{i}", lat=0, lon=math.degrees(km / 6371)) for i in range(8)]
        assert evaluate_constellation(sats, region)["regions"][0]["covered"] == expected
