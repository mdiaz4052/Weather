# What's next

Updated: 2026-11-03. The specification and project skeleton are ready; the app has not been built yet.

**Next milestone:** a globe that plays real daily temperatures for a 31-day period, with clear sources and values you can inspect. [Detailed plan](docs/PLAN.md#m1a-first-real-daily-temperature-globe)

## Next steps

- [ ] **Check the local setup** (T-002). Confirm the computer and software can handle the planned globe and climate files. [Architecture](docs/ARCHITECTURE.md#11-implementation-setup-gate)
- [ ] **Try a small real-data download** (T-001). Check one day of ERA5 temperature data, then a 31-day window, including its size and meaning. [Source details](docs/SOURCES.md#initial-sequence)
- [ ] **Build the first usable globe** (T-003). Add daily playback, date controls, and a value/source card when you select a place. [Interface and requirements](docs/SPECIFICATION.md#5-interface-contract)
- [ ] **Make it dependable** (T-004). Handle interrupted downloads, missing data, and storage limits clearly. [Engineering plan](docs/ARCHITECTURE.md)
- [ ] **Try it together** (T-005). Record what feels useful or confusing, then adjust the next milestone. [Feedback record](docs/FEEDBACK.md)

## Needs your input

Before the ERA5 download, you'll need a free Climate Data Store account, acceptance of the dataset terms, and an access token stored locally. We'll walk through setup when that task starts. [Access details](docs/SOURCES.md#initial-sequence)

The local setup checks can proceed while source access is being arranged.

## Keeping this page current

Every contributor must check this page before the final response for each completed task, updating it when needed. Keep it to roughly one screen: 3-5 next steps, the milestone they advance, and anything needed from you. The [rolling plan](docs/PLAN.md) holds the detail; the [worklog](docs/WORKLOG.md) records each review, even when no update is needed.
