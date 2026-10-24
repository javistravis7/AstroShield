from src.core.constraints import angular_distance_deg, is_valid_position, validate_constellation
from src.data.scenario import RESTRICTED_ZONES, OCCUPIED_OBJECTS


def test_same_point_has_zero_angular_distance():
    assert angular_distance_deg(20, -89, 20, -89) < 1e-6


def test_restricted_zone_center_is_invalid():
    zone = RESTRICTED_ZONES[0]
    assert not is_valid_position({"lat": zone["lat"], "lon": zone["lon"]})


def test_occupied_object_center_is_invalid():
    obj = OCCUPIED_OBJECTS[0]
    assert not is_valid_position({"lat": obj["lat"], "lon": obj["lon"]})


def test_yucatan_center_is_valid():
    assert is_valid_position({"lat": 20.5, "lon": -89.0})


def test_validation_reports_violations():
    zone = RESTRICTED_ZONES[0]
    result = validate_constellation([{"id": "SAT-01", "lat": zone["lat"], "lon": zone["lon"]}])
    assert not result["valid"]
    assert result["violation_count"] == 1
