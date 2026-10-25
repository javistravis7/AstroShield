from copy import deepcopy
import json

import pytest

import app as server
from src.core.constraints import validate_constellation
from src.core.fitness import evaluate_constellation
from src.data.scenario import REGIONS, RESTRICTED_ZONES
from src.visualization.exporter import save_result


def satellites():
    return [dict(id=f"SAT-{i+1:02d}", lat=r["lat"], lon=r["lon"])
            for i, r in enumerate(REGIONS + REGIONS[:2])]


@pytest.mark.parametrize("value", [None, {}, [], satellites()[:6], satellites()+satellites()[:1]])
def test_exactly_eight_satellites(value):
    assert not validate_constellation(value)["valid"]


@pytest.mark.parametrize("change", [dict(id=""), dict(id=None), dict(lat=float("nan")),
                                      dict(lon=float("inf")), dict(lat=91), dict(lon=-181),
                                      dict(lat=True), dict(lon="0")])
def test_bad_satellite_structure(change):
    sats = satellites()
    sats[0].update(change)
    assert not validate_constellation(sats)["valid"]
    with pytest.raises(ValueError):
        evaluate_constellation(sats)


def test_duplicate_ids_and_invalid_configuration_status():
    sats = satellites()
    sats[1]["id"] = sats[0]["id"]
    assert not validate_constellation(sats)["valid"]
    sats = satellites()
    sats[0].update(lat=45, lon=-35)
    result = evaluate_constellation(sats)
    assert result["status"] == "invalid"
    assert not result["valid"]
    assert result["validation"]["violation_count"] == 1


@pytest.mark.parametrize("payload", [None, [], "bad", {"regions": []}, {"regions": None},
    {"generations": 0}, {"generations": 1001}, {"generations": 1.5}, {"generations": True},
    {"population_size": 3}, {"population_size": 301}, {"mutation_rate": -1},
    {"mutation_rate": float("nan")}, {"mutation_rate": float("inf")},
    {"seed": -1}, {"seed": 2**32}, {"seed": "42"}, {"seed": 1.2}, {"unknown": 0},
    {"restricted_zones": None}, {"occupied_objects": {}}, {"regions": [None]},
    {"regions": REGIONS * 11}, {"mutation_rate": 10**400}])
def test_api_rejects_bad_input_without_saving(payload, monkeypatch):
    def forbidden(*args, **kwargs):
        pytest.fail("Invalid input must not be saved")
    monkeypatch.setattr(server, "save_result", forbidden)
    response = server.app.test_client().post("/api/optimize", data=json.dumps(payload), content_type="application/json")
    assert response.status_code == 400
    assert response.json["error"]


@pytest.mark.parametrize("field,value", [("lat", 91), ("lon", -181), ("weight", 0),
    ("weight", -2), ("weight", float("nan")), ("priority", "Urgente"), ("name", ""), ("id", "")])
def test_api_rejects_bad_region(field, value):
    regions = deepcopy(REGIONS)
    regions[0][field] = value
    response = server.app.test_client().post("/api/optimize", json={"regions": regions})
    assert response.status_code == 400


@pytest.mark.parametrize("radius", [0, -1, 181, float("inf"), True, "12"])
def test_api_rejects_invalid_exclusion_radius(radius):
    zones = deepcopy(RESTRICTED_ZONES)
    zones[0]["radius_deg"] = radius
    assert server.app.test_client().post("/api/optimize", json={"restricted_zones": zones}).status_code == 400


def test_api_duplicate_ids_malformed_json_and_body_limit():
    client = server.app.test_client()
    assert client.post("/api/optimize", json={"regions": [REGIONS[0], REGIONS[0]]}).status_code == 400
    assert client.post("/api/optimize", data="{", content_type="application/json").status_code == 400
    assert client.post("/api/optimize", data="x" * (256*1024+1), content_type="application/json").status_code == 400


def blocked_sphere():
    return [dict(id=f"block-{lon}", name=f"Hemisferio {lon}", lat=0, lon=lon, radius_deg=100)
            for lon in (0, 180)]


def test_api_sampling_failure_and_lock_recovery(tmp_path, monkeypatch):
    monkeypatch.setattr(server, "save_result", lambda r: save_result(r, tmp_path))
    client = server.app.test_client()
    response = client.post("/api/optimize", json={"generations": 1, "population_size": 4,
        "seed": 42, "restricted_zones": blocked_sphere()})
    assert response.status_code == 422
    assert response.json["status"] == "generation_failed"
    assert response.json["parameters"]["seed"] == 42
    assert "inviabilidad matemática" in response.json["error"]
    with server.optimization_lock:
        assert client.post("/api/optimize", json={}).status_code == 409
    response = client.post("/api/optimize", json={"generations": 2, "population_size": 4, "seed": 42})
    assert response.status_code == 200
    r = response.json
    saved = json.loads(next(tmp_path.glob("*.json")).read_text(encoding="utf-8"))
    assert saved["scenario"] == r["scenario"]
    assert r["initial_metrics"]["fitness"] == r["history"][0]["best_so_far"]
    assert r["status"] in ("complete", "partial")


def test_export_twice_preserves_both(tmp_path):
    first = save_result({"run": 1}, tmp_path)
    second = save_result({"run": 2}, tmp_path)
    assert first != second
    assert sorted(json.loads(p.read_text())["run"] for p in tmp_path.glob("*.json")) == [1, 2]


def test_constellation_validation_checks_exclusion_structure():
    assert not validate_constellation(satellites(), restricted_zones=[{}])["valid"]


def test_admitted_geographical_boundaries_and_radii():
    sats = satellites()
    sats[0].update(lat=90, lon=180)
    sats[1].update(lat=-90, lon=-180)
    assert validate_constellation(sats, [], [])["valid"]
    from src.core.validation import validate_scenario
    validate_scenario(REGIONS, [dict(id="max-radius", name="Máximo", lat=90, lon=180, radius_deg=180)], [])
