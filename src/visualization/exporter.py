"""JSON-safe output helpers."""
import json
from pathlib import Path
from datetime import datetime, timezone


def save_result(result, output_dir="results"):
    path = Path(output_dir)
    path.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    destination = path / f"astroshield_{stamp}.json"
    destination.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    return str(destination)
