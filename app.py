"""Flask API and static web server for AstroShield."""
from flask import Flask, jsonify, request, send_from_directory
from src.core.genetic_algorithm import optimize
from src.data.scenario import REGIONS, RESTRICTED_ZONES, OCCUPIED_OBJECTS, SATELLITE_COUNT, OBSERVATION_RADIUS_KM
from src.visualization.exporter import save_result

app = Flask(__name__, static_folder="web", static_url_path="")

@app.get("/")
def index():
    return send_from_directory("web", "index.html")

@app.get("/api/scenario")
def scenario():
    return jsonify({"satellite_count": SATELLITE_COUNT, "observation_radius_km": OBSERVATION_RADIUS_KM,
                    "regions": REGIONS, "restricted_zones": RESTRICTED_ZONES, "occupied_objects": OCCUPIED_OBJECTS})

@app.post("/api/optimize")
def run_optimizer():
    data = request.get_json(silent=True) or {}
    try:
        generations = int(data.get("generations", 120))
        population = int(data.get("population_size", 70))
        mutation = float(data.get("mutation_rate", 0.22))
        seed_value = data.get("seed", None)
        seed = None if seed_value in (None, "") else int(seed_value)
        if not 1 <= generations <= 1000:
            raise ValueError("Las generaciones deben estar entre 1 y 1000.")
        if not 4 <= population <= 300:
            raise ValueError("La población debe estar entre 4 y 300.")
        if not 0 <= mutation <= 1:
            raise ValueError("La mutación debe estar entre 0 y 1.")
        regions = data.get("regions")
        restricted_zones = data.get("restricted_zones")
        occupied_objects = data.get("occupied_objects")
        result = optimize(generations=generations, population_size=population, mutation_rate=mutation, seed=seed,
                          regions=regions, restricted_zones=restricted_zones, occupied_objects=occupied_objects)
        result["saved_to"] = save_result(result)
        return jsonify(result)
    except (ValueError, RuntimeError) as exc:
        return jsonify({"error": str(exc)}), 400
    except Exception:
        app.logger.exception("Error inesperado al optimizar")
        return jsonify({"error": "Ocurrió un error interno. Revisa la terminal del servidor."}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
