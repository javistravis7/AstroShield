"""Fitness scoring: weighted coverage is maximized; invalid points are penalized."""
from src.core.constraints import distance_km, validate_constellation
from src.data.scenario import REGIONS, OBSERVATION_RADIUS_KM


def evaluate_constellation(satellites, regions=None, observation_radius_km=OBSERVATION_RADIUS_KM,
                           restricted_zones=None, occupied_objects=None):
    regions = REGIONS if regions is None else regions
    total_weight = sum(r["weight"] for r in regions) or 1
    covered = []
    uncovered = []
    region_details = []
    for region in regions:
        closest = min(
            ((distance_km(s["lat"], s["lon"], region["lat"], region["lon"]), s.get("id", "Satélite")) for s in satellites),
            default=(float("inf"), None),
        )
        is_covered = closest[0] <= observation_radius_km
        detail = {"id": region["id"], "name": region["name"], "priority": region["priority"],
                  "weight": region["weight"], "covered": is_covered,
                  "nearest_distance_km": round(closest[0], 2), "nearest_satellite": closest[1],
                  "radius_km": observation_radius_km, "lat": region["lat"], "lon": region["lon"]}
        region_details.append(detail)
        (covered if is_covered else uncovered).append(region["id"])
    weighted_coverage = sum(r["weight"] for r in region_details if r["covered"]) / total_weight
    validation = validate_constellation(satellites, restricted_zones, occupied_objects)
    # A hard validity flag is kept separate from fitness: high coverage never makes an invalid result valid.
    fitness = 100.0 * weighted_coverage - 20.0 * validation["violation_count"]
    return {"fitness": round(fitness, 4), "weighted_coverage_pct": round(100 * weighted_coverage, 2),
            "covered_count": len(covered), "total_regions": len(regions), "covered_region_ids": covered,
            "uncovered_region_ids": uncovered, "regions": region_details, "validation": validation,
            "valid": validation["valid"], "observation_radius_km": observation_radius_km}
