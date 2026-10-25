"""JSON-safe output helpers."""
import json
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4


def save_result(result, output_dir="results"):
    path = Path(output_dir)
    path.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S_%f")
    destination = path / f"astroshield_{stamp}_{uuid4().hex}.json"
    payload = json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False)
    with destination.open("x", encoding="utf-8") as stream:
        stream.write(payload)
    return str(destination)
