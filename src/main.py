"""Command-line entry point: python -m src.main"""
import argparse
import json
from src.core.genetic_algorithm import optimize
from src.visualization.exporter import save_result


def main():
    parser = argparse.ArgumentParser(description="AstroShield: optimizador educativo de constelaciones")
    parser.add_argument("--generations", type=int, default=120)
    parser.add_argument("--population", type=int, default=70)
    parser.add_argument("--mutation", type=float, default=0.22)
    parser.add_argument("--seed", type=int, default=None)
    args = parser.parse_args()
    result = optimize(args.generations, args.population, args.mutation, args.seed)
    path = save_result(result)
    print(json.dumps({"fitness": result["metrics"]["fitness"], "coverage_pct": result["metrics"]["weighted_coverage_pct"],
                      "covered": result["metrics"]["covered_count"], "valid": result["metrics"]["valid"],
                      "result_file": path}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
