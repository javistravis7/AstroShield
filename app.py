"""Flask API and static web server for AstroShield."""
from flask import Flask, jsonify, request, send_from_directory
from src.core.genetic_algorithm import optimize, GenerationFailure
from threading import Lock
from werkzeug.exceptions import RequestEntityTooLarge
from src.data.scenario import REGIONS, RESTRICTED_ZONES, OCCUPIED_OBJECTS, SATELLITE_COUNT, OBSERVATION_RADIUS_KM
from src.visualization.exporter import save_result

app = Flask(__name__, static_folder="web", static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 256 * 1024
optimization_lock = Lock()

@app.get("/")
def index():
    return send_from_directory("web", "index.html")

@app.get("/api/scenario")
def scenario():
    return jsonify({"satellite_count": SATELLITE_COUNT, "observation_radius_km": OBSERVATION_RADIUS_KM,
                    "regions": REGIONS, "restricted_zones": RESTRICTED_ZONES, "occupied_objects": OCCUPIED_OBJECTS})

@app.post("/api/optimize")
def run_optimizer():
    if not optimization_lock.acquire(blocking=False):
        return jsonify({"error": "Ya hay una optimización en curso. Espera a que termine."}), 409
    try:
        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            raise ValueError("Envía un objeto JSON válido; usa {} para los parámetros predeterminados.")
        allowed = {"generations", "population_size", "mutation_rate", "seed", "regions",
                   "restricted_zones", "occupied_objects"}
        if set(data) - allowed:
            raise ValueError("Campos desconocidos: " + ", ".join(sorted(set(data) - allowed)))
        for field in ("regions", "restricted_zones", "occupied_objects"):
            if field in data and data[field] is None:
                raise ValueError(f"{field}: usa una lista, no null.")
        generations = data.get("generations", 120)
        population = data.get("population_size", 70)
        mutation = data.get("mutation_rate", 0.22)
        seed = data.get("seed")
        regions = data.get("regions")
        restricted_zones = data.get("restricted_zones")
        occupied_objects = data.get("occupied_objects")
        result = optimize(generations=generations, population_size=population, mutation_rate=mutation, seed=seed,
                          regions=regions, restricted_zones=restricted_zones, occupied_objects=occupied_objects)
        result["saved_to"] = save_result(result)
        return jsonify(result)
    except RequestEntityTooLarge as exc:
        return too_large(exc)
    except GenerationFailure as exc:
        return jsonify(exc.result), 422
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception:
        app.logger.exception("Error inesperado al optimizar")
        return jsonify({"error": "Ocurrió un error interno. Revisa la terminal del servidor."}), 500
    finally:
        optimization_lock.release()


@app.errorhandler(413)
def too_large(_error):
    return jsonify({"error": "El JSON supera el límite admitido de 256 KiB."}), 400

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
