# Validation plan

There is no application test suite yet. During M1 implement the numerical cases in `../docs/SCIENCE.md`, adapter fixtures with provenance, API/job/storage checks, and globe/playback integration tests with slow/reordered requests. Keep live provider tests opt-in and small; use deterministic fixtures for routine regression checks.

The session-zero checks are `python tools/check_specs.py` and the reproducible capacity model, run from the repository root. They do not verify rendering, live retrieval, or scientific values.
