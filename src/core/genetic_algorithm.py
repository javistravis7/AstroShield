"""A compact genetic algorithm for an educational constellation model."""
import random
from copy import deepcopy
from src.core.constraints import is_valid_position
from src.core.fitness import evaluate_constellation
from src.data.scenario import SATELLITE_COUNT, REGIONS, RESTRICTED_ZONES, OCCUPIED_OBJECTS


def random_position(rng, regions=REGIONS, restricted_zones=RESTRICTED_ZONES, occupied_objects=OCCUPIED_OBJECTS):
    """Generate a valid point, usually near a region to make 300-km coverage discoverable."""
    for _ in range(500):
        if rng.random() < 0.82:
            region = rng.choice(regions)
            lat = max(-89.5, min(89.5, rng.gauss(region["lat"], 2.0)))
            lon = ((rng.gauss(region["lon"], 2.0) + 180) % 360) - 180
        else:
            lat = rng.uniform(-85, 85)
            lon = rng.uniform(-180, 180)
        point = {"lat": lat, "lon": lon}
        if is_valid_position(point, restricted_zones, occupied_objects):
            return point
    # Safe deterministic fallback: region centers are checked against restrictions.
    for region in regions:
        point = {"lat": region["lat"], "lon": region["lon"]}
        if is_valid_position(point, restricted_zones, occupied_objects):
            return point
    raise RuntimeError("No se pudo generar una posición válida con las restricciones actuales.")


def make_individual(rng, satellite_count=SATELLITE_COUNT, regions=REGIONS,
                    restricted_zones=RESTRICTED_ZONES, occupied_objects=OCCUPIED_OBJECTS):
    points = [random_position(rng, regions, restricted_zones, occupied_objects) for _ in range(satellite_count)]
    return [{"id": f"SAT-{i+1:02d}", **p} for i, p in enumerate(points)]


def mutate(individual, rng, mutation_rate, regions, restricted_zones, occupied_objects):
    child = deepcopy(individual)
    for sat in child:
        if rng.random() < mutation_rate:
            p = random_position(rng, regions, restricted_zones, occupied_objects)
            sat["lat"], sat["lon"] = p["lat"], p["lon"]
    return child


def crossover(parent_a, parent_b, rng):
    cut = rng.randint(1, len(parent_a) - 1)
    raw = deepcopy(parent_a[:cut] + parent_b[cut:])
    for i, sat in enumerate(raw):
        sat["id"] = f"SAT-{i+1:02d}"
    return raw


def optimize(generations=120, population_size=70, mutation_rate=0.22, seed=None,
             satellite_count=SATELLITE_COUNT, regions=None, restricted_zones=None, occupied_objects=None):
    """Return best solution, generation history, initial solution and run parameters."""
    if generations < 1 or population_size < 4:
        raise ValueError("Usa al menos 1 generación y una población de 4 individuos.")
    if not 0 <= mutation_rate <= 1:
        raise ValueError("La tasa de mutación debe estar entre 0 y 1.")
    regions = deepcopy(REGIONS if regions is None else regions)
    restricted_zones = deepcopy(RESTRICTED_ZONES if restricted_zones is None else restricted_zones)
    occupied_objects = deepcopy(OCCUPIED_OBJECTS if occupied_objects is None else occupied_objects)
    rng = random.Random(seed)
    population = [make_individual(rng, satellite_count, regions, restricted_zones, occupied_objects)
                  for _ in range(population_size)]
    initial = deepcopy(max(population, key=lambda x: evaluate_constellation(x, regions, restricted_zones=restricted_zones, occupied_objects=occupied_objects)["fitness"]))
    history = []

    def score(ind):
        return evaluate_constellation(ind, regions, restricted_zones=restricted_zones, occupied_objects=occupied_objects)["fitness"]

    best = deepcopy(max(population, key=score))
    for generation in range(generations + 1):
        ranked = sorted(population, key=score, reverse=True)
        if score(ranked[0]) > score(best):
            best = deepcopy(ranked[0])
        detail = evaluate_constellation(best, regions, restricted_zones=restricted_zones, occupied_objects=occupied_objects)
        history.append({"generation": generation, "best_fitness": round(score(ranked[0]), 4),
                        "best_so_far": detail["fitness"], "coverage_pct": detail["weighted_coverage_pct"],
                        "covered_regions": detail["covered_count"], "valid": detail["valid"]})
        if generation == generations:
            break
        next_population = [deepcopy(ranked[0]), deepcopy(ranked[1])]  # elitism
        while len(next_population) < population_size:
            # Tournament selection
            candidates = rng.sample(ranked[:max(4, population_size // 2)], k=3)
            parent_a = max(candidates, key=score)
            candidates = rng.sample(ranked[:max(4, population_size // 2)], k=3)
            parent_b = max(candidates, key=score)
            child = crossover(parent_a, parent_b, rng)
            child = mutate(child, rng, mutation_rate, regions, restricted_zones, occupied_objects)
            next_population.append(child)
        population = next_population
    metrics = evaluate_constellation(best, regions, restricted_zones=restricted_zones, occupied_objects=occupied_objects)
    return {"best": best, "initial": initial, "metrics": metrics, "history": history,
            "parameters": {"generations": generations, "population_size": population_size,
                           "mutation_rate": mutation_rate, "seed": seed, "satellite_count": satellite_count},
            "scenario": {"regions": regions, "restricted_zones": restricted_zones, "occupied_objects": occupied_objects}}
