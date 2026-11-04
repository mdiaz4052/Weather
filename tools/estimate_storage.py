"""Reproducible capacity model, not measured storage or a data downloader.

Run from any directory with Python 3.11+. --write updates the fixed small JSON
report under experiments/. No third-party modules or network access are used.
"""

import argparse
import json
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPORT = ROOT / "experiments" / "storage-estimates.json"


def scenario(name, width, height, frames, variables=1):
    cells = width * height * frames * variables
    return {
        "name": name,
        "width": width,
        "height": height,
        "frames": frames,
        "variables": variables,
        "float32_bytes": cells * 4,
        "float32_plus_byte_mask_bytes": cells * 5,
        "float32_plus_byte_mask_GB": round(cells * 5 / 1_000_000_000, 6),
    }


def build_report():
    history_days = (date(2026, 1, 1) - date(1940, 1, 1)).days
    baseline_days = (date(2021, 1, 1) - date(1991, 1, 1)).days
    return {
        "model_version": "1",
        "assumptions": [
            "Decimal GB = 1,000,000,000 bytes; values are uncompressed float32",
            "One byte mask per scalar cell; real packing/masks/compression vary",
            "Quarter-degree illustrative pole-inclusive grid: 1440 by 721",
            "One-degree illustrative pole-inclusive grid: 360 by 181",
            "This is an array model, not a claim that each source uses these exact grids",
            "History is [1940-01-01, 2026-01-01), exactly 86 years",
            "Scenarios exclude coordinates, uncertainty, logs, tiles, copies and scratch",
            "Provider transfer volume, queue time and achievable performance are unmeasured",
            "Daily climatology can be streamed; full baseline retention is not required",
        ],
        "budget_bytes": {"user_approximate": 100_000_000_000, "managed_cap": 90_000_000_000, "headroom": 10_000_000_000},
        "scenarios": [
            scenario("global_quarter_degree_31_days_daily", 1440, 721, 31),
            scenario("global_quarter_degree_48_hours", 1440, 721, 48),
            scenario("global_quarter_degree_365_days_daily_three_variables", 1440, 721, 365, 3),
            scenario("global_quarter_degree_86_years_monthly", 1440, 721, 86 * 12),
            scenario("global_quarter_degree_86_years_daily", 1440, 721, history_days),
            scenario("global_quarter_degree_86_years_hourly", 1440, 721, history_days * 24),
            scenario("global_one_degree_86_years_daily", 360, 181, history_days),
            scenario("regional_20_degree_box_quarter_degree_31_days_hourly", 81, 81, 31 * 24),
            scenario("global_quarter_degree_baseline_1991_2020_daily_inputs", 1440, 721, baseline_days),
            scenario("global_quarter_degree_366_day_climatology", 1440, 721, 366),
        ],
        "display_buffer": {
            "overview_width": 1440,
            "overview_height": 720,
            "rgba_bytes_per_pixel": 4,
            "frames": 5,
            "decoded_bytes": 1440 * 720 * 4 * 5,
            "excludes": "GPU copies, map engine, browser, geometry, image decoder and other textures",
        },
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Update experiments/storage-estimates.json")
    args = parser.parse_args()
    report = json.dumps(build_report(), indent=2, ensure_ascii=False) + "\n"
    if args.write:
        REPORT.parent.mkdir(parents=True, exist_ok=True)
        REPORT.write_text(report, encoding="utf-8")
        print(f"Wrote {REPORT}")
    else:
        print(report, end="")


if __name__ == "__main__":
    main()
