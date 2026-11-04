# Contributor entry point (all tools and people)

Read `README.md`, `NEXT.md`, `docs/STATUS.md`, `docs/PLAN.md`, and the relevant specification before changing the project. The current deliverable is a specification and skeleton, not a running app.

## Working agreement

- Respect the user's most recent choices. Daily temperature is the preferred first experience; hourly exploration is an intended capability. Monthly is an overview option, not a replacement for that preference.
- Keep work small and reversible. Implement the active milestone; treat later horizons as hypotheses. Update the plan when evidence changes it.
- Record consequential decisions in `docs/DECISIONS.md`, experiments (including failures) in `docs/EXPERIMENTS.md`, and a concise handoff in `docs/WORKLOG.md`. Small changes need only a worklog entry. Do not copy chat transcripts.
- Before providing the final response for every completed work task, check root `NEXT.md` against the actual project state and plan; update it if needed. This applies to every contributor, including documentation-only tasks. Keep it in plain language, roughly one screen, with 3-5 next steps, one sentence about their milestone, links to details, and a "Needs your input" section for user actions or decisions. Record the review in the task's worklog entry, including "checked; no changes needed" when appropriate. Change the page's update date when its content changes; avoid edits made only to show that it was checked.
- Use one stable task ID across the plan, work record, and commit. Include relevant paths, checks actually run, limitations, and next steps.
- Preserve native scientific metadata. Never silently mix sources, substitute a variable, fill missing values, change baselines, or present rendered colors as measurements.
- Keep data, secrets, and large generated files out of Git. Never print or commit API credentials. Do not change the user's global Git settings or author identity.
- Do not buy services, publish, upload personal data, or create accounts without the user's instructions. Routine local implementation, checks, and commits are within this project's authorized scope.
- No mandatory committee or standing agent hierarchy. Use optional task roles only when useful. This file does not request parallel agents.

## Attribution

Keep the existing human Git author configuration. Add ordinary commit trailers:

```text
Agent-Tool: ChatGPT/Codex Desktop
Agent-Model: <exact runtime model identifier, or unknown with reported family>
Work-Record: W-YYYYMMDD-NN
Task: T-NNN
```

Other tools use their own labels, such as Claude or Gemini, and their actually reported model IDs. Never guess a model version or impersonate another contributor. Add repeated trailers for actual collaborators if needed. Work records must state when exact model metadata is unavailable. Cryptographic signing is not required; preserve existing signing preferences unless the user instructs otherwise. This session used a command-local signing override to produce ordinary commits.

## Checks available in the skeleton

`python tools/check_specs.py` checks the documented skeleton invariants, JSON, local Markdown links, and storage report reproducibility. It is not a full JSON Schema validator or an application test.

`python tools/estimate_storage.py` prints the reproducible capacity model. No dependency installation is needed for either command.

Future application dependencies and checks must be documented and locked when implementation starts. Do not claim an integration is working merely because its provider documentation is available.
