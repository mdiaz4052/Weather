"""Check session-zero invariants without dependencies or network access.

This deliberately checks a documented subset of catalog invariants, not the
complete JSON Schema vocabulary. Full schema validation joins M1 tooling.
"""

import ast
import json
import re
import sys
from datetime import date
from pathlib import Path
from urllib.parse import unquote

from estimate_storage import build_report

ROOT = Path(__file__).resolve().parents[1]


def main():
    errors = []

    def require(condition, message):
        if not condition:
            errors.append(message)

    required_paths = [
        "README.md", "AGENTS.md", "docs/STATUS.md", "docs/SPECIFICATION.md",
        "docs/ARCHITECTURE.md", "docs/SCIENCE.md", "docs/SOURCES.md",
        "docs/PLAN.md", "docs/DECISIONS.md", "docs/EXPERIMENTS.md",
        "docs/FEEDBACK.md", "docs/WORKLOG.md", "docs/PSEUDOCODE.md",
        "catalog/datasets.json", "packages/contracts/catalog.schema.json",
        "packages/contracts/adapter.py", "apps/web/src/map/MapAdapter.ts",
        "experiments/storage-estimates.json",
    ]
    for relative in required_paths:
        require((ROOT / relative).is_file(), f"Missing required file: {relative}")

    files = [p for p in ROOT.rglob("*") if p.is_file() and not any(
        part in {".git", ".venv", "node_modules", "__pycache__", "data"}
        for part in p.relative_to(ROOT).parts
    )]
    parsed = {}
    for path in files:
        relative = path.relative_to(ROOT).as_posix()
        try:
            if path.suffix == ".json":
                parsed[relative] = json.loads(path.read_text(encoding="utf-8"))
            if path.suffix == ".py":
                ast.parse(path.read_text(encoding="utf-8"), filename=relative)
            if path.suffix == ".md":
                # Check ordinary local Markdown file links; external links/anchors
                # are intentionally outside this offline check.
                for target in re.findall(r"\]\(([^)]+)\)", path.read_text(encoding="utf-8")):
                    target = target.strip().split("#", 1)[0]
                    if not target or re.match(r"[a-zA-Z][a-zA-Z0-9+.-]*:", target):
                        continue
                    target = unquote(target.strip("<>"))
                    require((path.parent / target).exists(), f"Broken local link in {relative}: {target}")
        except (ValueError, SyntaxError, UnicodeError, OSError) as exc:
            errors.append(f"Cannot validate {relative}: {exc}")

    catalog = parsed.get("catalog/datasets.json", {})
    entries = catalog.get("datasets", [])
    ids = [entry.get("id") for entry in entries]
    require(len(ids) == len(set(ids)), "Dataset IDs must be unique")
    require(len(entries) == 4, "Session-zero catalog must contain four candidate products")
    require(catalog.get("schema_version") == "0.1", "Unexpected catalog version")
    schema = parsed.get("packages/contracts/catalog.schema.json", {})
    required_fields = schema.get("$defs", {}).get("dataset", {}).get("required", [])
    for entry in entries:
        identity = entry.get("id", "<missing id>")
        require(all(field in entry for field in required_fields), f"Missing descriptor field: {identity}")
        require(entry.get("readiness") == "candidate", f"Unproven integration marked ready: {identity}")
        require(entry.get("discovered_availability") is None, f"Unverified runtime availability: {identity}")
        require(entry.get("native_metadata_validated") is False, f"Unverified native metadata: {identity}")
        capabilities = entry.get("capabilities", {})
        require(not capabilities.get("implemented") and not capabilities.get("tested"), f"Unproven capabilities: {identity}")
        evidence = entry.get("evidence", {})
        require(evidence.get("retrieval_test") == "not_run", f"Unproven retrieval evidence: {identity}")
        require(evidence.get("numeric_validation") == "not_run", f"Unproven numeric evidence: {identity}")

    request = parsed.get("packages/contracts/examples/plan-request.json", {})
    require(request.get("dataset_id") in ids, "Example request references unknown dataset")
    require(request.get("example_only") is True, "Request example must be labeled illustrative")
    try:
        span = (date.fromisoformat(request["end_exclusive"]) - date.fromisoformat(request["start_inclusive"])).days
        require(span == 31 and request.get("support") == "daily", "Example must show the proposed 31-day daily slice")
    except (KeyError, ValueError, TypeError) as exc:
        errors.append(f"Invalid example interval: {exc}")
    sample = parsed.get("packages/contracts/examples/sample-response.json", {})
    require(sample.get("example_only") is True and sample.get("value") is None and sample.get("status") == "not_prepared", "Sample example must not imply retrieved climate data")

    report = parsed.get("experiments/storage-estimates.json")
    require(report == build_report(), "Storage report differs from reproducible model; run python tools/estimate_storage.py --write")
    if report:
        budget = report["budget_bytes"]
        require(budget["managed_cap"] + budget["headroom"] == budget["user_approximate"], "Capacity allocations exceed stated total")

    if errors:
        print("Session-zero checks FAILED:")
        for error in errors:
            print(f"- {error}")
        return 1
    print(f"Session-zero checks passed: {len(required_paths)} required paths, {len(parsed)} JSON files, {len(entries)} candidate products; Python syntax, local Markdown links, illustrative contracts and storage reproducibility.")
    print("Not checked: full JSON Schema validation, TypeScript compilation, live providers, scientific values, browser rendering or application behavior.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
