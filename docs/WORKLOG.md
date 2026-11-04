# Work records and handoffs

Concise development history, not a transcript. Git is the source-change history; these records explain intent, evidence, limits and the next step.

## W-20261103-01 — Session zero

- Date: 2026-11-03, America/New_York. Task: T-000. Milestone: M0.
- Tool: ChatGPT / Codex Desktop.
- Model: GPT-6 family as reported by the runtime instructions; exact model version unavailable. No model version was inferred from a product name.
- Git author: existing user configuration retained; tool/model labels appear in commit trailers. No remote or signing keys created.
- Inputs: user's initial vision, alignment answers and subsequent preference for daily/hourly temperature; primary research in `SOURCES.md`.
- Result: product specification, architecture and science policies, source register and four candidate descriptors, rolling plan, decisions, experiment/feedback records, interface sketches, pseudocode and capacity model. See the README navigation.
- Scope correction: monthly-first was a proposal; daily preference superseded it. SST was explicitly confirmed as the first ocean layer.
- Validation: `python tools/estimate_storage.py --write` generated the capacity report; `python tools/check_specs.py` checks local artifacts, documented catalog invariants and reproducibility. The final handoff records the actual check outcome in the completion entry below.
- Limitations: no browser app or backend, climate downloads, provider credential setup, live adapters, full schema validator, TypeScript compiler, numerical data checks or graphics benchmark. Package versions remain a spike deliverable.
- Findings to carry forward: NCEP/NCAR Reanalysis 1 is retired as an updating source; ERSST v6 supersedes a v5-only assumption; current source availability must be discovered, not guessed from a landing-page date range. See E-002.
- Next: T-001 bounded ERA5 retrieval and T-002 environment/dependency spike. CDS credentials/terms are needed only when that preferred source path is exercised. Keep daily playback and the hourly path visible in the plan.

### Completion evidence

`python tools/check_specs.py` passed: 18 required paths, 5 JSON files, four candidate products, Python syntax, local Markdown links, illustrative examples and exact capacity-report reproducibility. `git diff --check` also passed for tracked changes; the full staged tree is checked before committing. Final Git status is verified after the specification commit. M0 completion means the artifacts are delivered and checked; architecture proposals and provider integrations remain open to evidence and user review.

## Template for later work

```text
W-YYYYMMDD-NN — concise outcome
Date / tool / actual model ID or unavailable:
Task and milestone:
Changed and why:
Evidence actually collected:
Limitations or failed attempts:
Decisions / experiments / feedback IDs:
Next action and dependencies:
Commit reference if useful (avoid requiring a self-referential commit hash):
```
