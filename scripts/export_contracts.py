"""Export the authoritative Pydantic contracts as JSON Schema."""

import json
from pathlib import Path

from weather_api.models import FieldDescriptor, Frame

root = Path(__file__).resolve().parents[1]
for name, model in [("field-descriptor", FieldDescriptor), ("weather-manifest", Frame)]:
    (root / "contracts" / f"{name}.schema.json").write_text(
        json.dumps(model.model_json_schema(), indent=2) + "\n"
    )
