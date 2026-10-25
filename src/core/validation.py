"""Shared, bounded input domain for the API, CLI and educational model."""
import math


def number(value, label, low, high, *, integer=False, positive=False):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise ValueError(f"{label}: debe ser un número{' entero' if integer else ''}.")
    if (integer and not isinstance(value, int)):
        raise ValueError(f"{label}: debe ser finito{' y entero' if integer else ''}.")
    if not low <= value <= high or (positive and value == 0) or not math.isfinite(value):
        interval = f"mayor que {low} y hasta {high}" if positive else f"entre {low} y {high}"
        raise ValueError(f"{label}: debe estar {interval}.")
    return value


def text(value, label):
    if not isinstance(value, str) or not value.strip() or len(value) > 100:
        raise ValueError(f"{label}: usa texto no vacío de hasta 100 caracteres.")


def position(point, label="Posición"):
    if not isinstance(point, dict):
        raise ValueError(f"{label}: debe ser un objeto con lat y lon.")
    number(point.get("lat"), f"{label}.lat", -90, 90)
    number(point.get("lon"), f"{label}.lon", -180, 180)


def records(items, label, minimum=0):
    if not isinstance(items, list) or not minimum <= len(items) <= 64:
        raise ValueError(f"{label}: debe ser una lista de {minimum} a 64 elementos.")
    ids = set()
    for item in items:
        position(item, label)
        for key in ("id", "name"):
            text(item.get(key), f"{label}.{key}")
        if item["id"] in ids:
            raise ValueError(f"{label}: identificador duplicado {item['id']}.")
        ids.add(item["id"])


def validate_scenario(regions, restricted_zones, occupied_objects):
    records(regions, "Regiones", 1)
    for region in regions:
        if region.get("priority") not in ("Alta", "Media", "Normal"):
            raise ValueError("Prioridad: usa Alta, Media o Normal.")
        number(region.get("weight"), "Peso", 0, 1000, positive=True)
    validate_exclusions(restricted_zones, occupied_objects)
    all_ids = [r["id"] for r in regions + restricted_zones + occupied_objects]
    if len(all_ids) != len(set(all_ids)):
        raise ValueError("Los identificadores del escenario deben ser únicos.")


def validate_exclusions(restricted_zones, occupied_objects):
    for label, items in (("Zonas restringidas", restricted_zones), ("Objetos ocupados", occupied_objects)):
        records(items, label)
        for item in items:
            number(item.get("radius_deg"), "Radio angular", 0, 180, positive=True)
    ids = [r["id"] for r in restricted_zones + occupied_objects]
    if len(ids) != len(set(ids)):
        raise ValueError("Los identificadores de las exclusiones deben ser únicos.")


def validate_parameters(generations, population_size, mutation_rate, seed, satellite_count):
    number(generations, "Generaciones", 1, 1000, integer=True)
    number(population_size, "Población", 4, 300, integer=True)
    number(mutation_rate, "Mutación", 0, 1)
    number(satellite_count, "Satélites", 8, 8, integer=True)
    if seed is not None:
        number(seed, "Semilla", 0, 2**32 - 1, integer=True)
