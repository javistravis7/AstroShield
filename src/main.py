"""Command-line entry point: python -m src.main"""
import argparse
import json
from src.core.genetic_algorithm import optimize, GenerationFailure
from src.visualization.exporter import save_result


def main():
    parser = argparse.ArgumentParser(description="AstroShield: optimizador educativo de constelaciones")
    parser.add_argument("--generations", type=int, default=120)
    parser.add_argument("--population", type=int, default=70)
    parser.add_argument("--mutation", type=float, default=0.22)
    parser.add_argument("--seed", type=int, default=None)
    args = parser.parse_args()
    try:
        result = optimize(args.generations, args.population, args.mutation, args.seed)
    except ValueError as exc:
        parser.error(str(exc))
    except GenerationFailure as exc:
        print(json.dumps(exc.result, ensure_ascii=False, indent=2))
        raise SystemExit(2)
    path = save_result(result)
    print(json.dumps({"status": result["status"], "seed": result["parameters"]["seed"],
                      "fitness": result["metrics"]["fitness"], "coverage_pct": result["metrics"]["weighted_coverage_pct"],
                      "covered": result["metrics"]["covered_count"], "valid": result["metrics"]["valid"],
                      "result_file": path}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
