from src.core.fitness import evaluate_constellation
from src.data.scenario import REGIONS


def test_satellites_at_region_centers_cover_all_regions():
    satellites = [{"id": f"SAT-{i+1:02d}", "lat": r["lat"], "lon": r["lon"]} for i, r in enumerate(REGIONS)]
    result = evaluate_constellation(satellites)
    assert result["covered_count"] == 6
    assert result["weighted_coverage_pct"] == 100.0
    assert result["valid"]


def test_far_satellites_do_not_cover_every_region():
    satellites = [{"id": f"SAT-{i+1:02d}", "lat": 0, "lon": 0} for i in range(8)]
    result = evaluate_constellation(satellites)
    assert result["covered_count"] < 6
