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

## W-20261103-02 — Quick next-steps page and completion workflow

- Date: 2026-11-03, America/New_York. Task: T-015. Milestone: M0 foundation maintenance.
- Tool: ChatGPT / Codex Desktop. Model: GPT-6 family reported by runtime instructions; exact model version unavailable.
- Changed: added root `NEXT.md` with five plain-language steps toward M1a and the source-account setup needed from the user. Linked it from the README and detailed plan. Updated `AGENTS.md` so every contributor checks it before the final response for every completed task, including documentation work, and records the review even if unchanged.
- Decision: D-010 captures the user's confirmed format and update cadence. T-015 records the completed documentation task.
- NEXT review: checked against current status and T-001..T-005; this task creates the initial summary. Implementation has not started; local setup can proceed while ERA5 access is arranged.
- Validation: `python tools/check_specs.py` passed (19 required paths, five JSON files, four candidate products); `git diff --check` passed. The skeleton checker now requires `NEXT.md` and checks its local file links with the existing Markdown checks.
- Limitations: this is a documentation/workflow change; no app code or provider integrations were added.
- Next: T-002 local setup checks and T-001 bounded source retrieval, with user source setup needed for the latter.

## W-20261103-03 — Publish local history to Weather/CliMaps

- Date: 2026-11-03, America/New_York. Task: T-016. Milestone: M0 foundation maintenance.
- Tool: ChatGPT / Codex Desktop. Model: GPT-6 family reported by runtime instructions; exact model version unavailable.
- Authorization: user requested a new branch named `CliMaps` in `https://github.com/mdiaz4052/Weather` and a push of this local repository.
- Result: confirmed the branch name was available, created local `CliMaps`, configured `origin` as `https://github.com/mdiaz4052/Weather.git`, and pushed the three existing local commits. Local `CliMaps` now tracks `origin/CliMaps`. GitHub independently reported the matching initial tip `f721ca078cca1fba002009bad77f1658092cda76`.
- History: preserved the local repository's own ancestry; no merge into the remote default branch, force push, or pull request was performed. Only the new `CliMaps` branch was pushed.
- Documentation: updated README/current status and the completed-task record. This follow-up record is committed and pushed to the same branch after the initial history upload.
- NEXT.md review: checked; no changes needed. Publishing the repository does not change the next implementation steps or required source setup.
- Validation: initial push succeeded and its commit ID was confirmed through GitHub. Documentation checks and whitespace checks are run before the follow-up commit; the remote tip and clean/upstream-tracking state are verified after its push.
- Next: T-002 local setup and T-001 bounded source retrieval.

## Template for later work

```text
W-YYYYMMDD-NN — concise outcome
Date / tool / actual model ID or unavailable:
Task and milestone:
Changed and why:
Evidence actually collected:
Limitations or failed attempts:
Decisions / experiments / feedback IDs:
NEXT.md review (updated, or checked; no changes needed):
Next action and dependencies:
Commit reference if useful (avoid requiring a self-referential commit hash):
```
