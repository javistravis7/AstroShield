"""Spherical distance and hard spatial constraints."""
import math
from src.core.validation import position as validate_position, text, validate_exclusions
from src.data.scenario import EARTH_RADIUS_KM, RESTRICTED_ZONES, OCCUPIED_OBJECTS


def angular_distance_deg(lat1, lon1, lat2, lon2):
    """Great-circle central angle in degrees, robust near poles/dateline."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lon2 - lon1)
    cosang = math.sin(p1) * math.sin(p2) + math.cos(p1) * math.cos(p2) * math.cos(dl)
    return math.degrees(math.acos(max(-1.0, min(1.0, cosang))))


def distance_km(lat1, lon1, lat2, lon2):
    return math.radians(angular_distance_deg(lat1, lon1, lat2, lon2)) * EARTH_RADIUS_KM


def violation_for_position(position, restricted_zones=None, occupied_objects=None):
    """Return list of exclusion-zone names intersected by a satellite position."""
    lat, lon = position["lat"], position["lon"]
    zones = RESTRICTED_ZONES if restricted_zones is None else restricted_zones
    objects = OCCUPIED_OBJECTS if occupied_objects is None else occupied_objects
    violations = []
    for zone in zones:
        if angular_distance_deg(lat, lon, zone["lat"], zone["lon"]) < zone["radius_deg"]:
            violations.append(zone["name"])
    for obj in objects:
        if angular_distance_deg(lat, lon, obj["lat"], obj["lon"]) < obj["radius_deg"]:
            violations.append(obj["name"])
    return violations


def is_valid_position(position, restricted_zones=None, occupied_objects=None):
    try:
        validate_position(position)
    except ValueError:
        return False
    return not violation_for_position(position, restricted_zones, occupied_objects)


def validate_constellation(satellites, restricted_zones=None, occupied_objects=None):
    violations = []
    errors = []
    restricted_zones = RESTRICTED_ZONES if restricted_zones is None else restricted_zones
    occupied_objects = OCCUPIED_OBJECTS if occupied_objects is None else occupied_objects
    try:
        validate_exclusions(restricted_zones, occupied_objects)
    except ValueError as exc:
        return {"valid": False, "violations": [], "violation_count": 0, "errors": [str(exc)]}
    if not isinstance(satellites, list):
        return {"valid": False, "violations": [], "violation_count": 0,
                "errors": ["La constelación debe ser una lista de exactamente ocho satélites."]}
    if len(satellites) != 8:
        errors.append("La constelación debe tener exactamente ocho satélites.")
    ids = set()
    for sat in satellites:
        try:
            validate_position(sat, "Satélite")
            text(sat.get("id"), "Identificador del satélite")
            if sat["id"] in ids:
                raise ValueError(f"Identificador duplicado: {sat['id']}.")
            ids.add(sat["id"])
        except ValueError as exc:
            errors.append(str(exc))
            continue
        names = violation_for_position(sat, restricted_zones, occupied_objects)
        if names:
            violations.append({"satellite": sat.get("id", "Satélite"), "zones": names})
    return {"valid": not violations and not errors, "violations": violations,
            "violation_count": len(violations), "errors": errors}
