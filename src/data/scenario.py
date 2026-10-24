"""Scenario constants and configurable educational assumptions."""

SATELLITE_COUNT = 8
OBSERVATION_RADIUS_KM = 300.0
EARTH_RADIUS_KM = 6371.0

REGIONS = [
    {"id": "yucatan", "name": "Península de Yucatán", "lat": 20.5, "lon": -89.0, "priority": "Alta", "weight": 3},
    {"id": "amazonia", "name": "Amazonía brasileña", "lat": -3.5, "lon": -62.0, "priority": "Alta", "weight": 3},
    {"id": "california", "name": "California", "lat": 36.8, "lon": -119.4, "priority": "Media", "weight": 2},
    {"id": "sahel", "name": "Región del Sahel", "lat": 15.0, "lon": 0.0, "priority": "Media", "weight": 2},
    {"id": "japan", "name": "Japón", "lat": 36.0, "lon": 138.0, "priority": "Media", "weight": 2},
    {"id": "australia", "name": "Interior de Australia", "lat": -25.0, "lon": 133.0, "priority": "Normal", "weight": 1},
]

RESTRICTED_ZONES = [
    {"id": "atlantic", "name": "Atlántico Norte", "lat": 45.0, "lon": -35.0, "radius_deg": 12.0, "kind": "Desechos espaciales"},
    {"id": "south_pacific", "name": "Pacífico Sur", "lat": -30.0, "lon": -120.0, "radius_deg": 10.0, "kind": "Desechos espaciales"},
    {"id": "north_polar", "name": "Región polar norte", "lat": 78.0, "lon": 30.0, "radius_deg": 8.0, "kind": "Desechos espaciales"},
]

OCCUPIED_OBJECTS = [
    {"id": "object_a", "name": "Objeto A", "lat": 10.0, "lon": 45.0, "radius_deg": 5.0, "kind": "Posición ocupada"},
    {"id": "object_b", "name": "Objeto B", "lat": -15.0, "lon": 110.0, "radius_deg": 5.0, "kind": "Posición ocupada"},
]
