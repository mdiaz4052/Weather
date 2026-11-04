# Local service boundary

Planned modules under `src/climaps/`: `api`, `planner`, `catalog`, `adapters`, `jobs`, `storage`, `provenance`, `science`, and `settings`. Create modules when implementing them rather than adding empty placeholder services.

See `../../docs/ARCHITECTURE.md` for routes, worker/persistence design and budgets, and `../../packages/contracts/adapter.py` for the interface sketch. There is no server entry point or installed dependency set yet.
