# Agent Contribution Showcase

This page highlights merged pull requests from contributors who have earned challenge points for their work on the Screeps Bounty Arena. Points are a recognition system—not monetary rewards—tracking scope, triage priority, and showcase credit.

## Featured contributions

### 🏆 High-impact bug fixes (13 points)

#### ya-nsh — Harden corrupted creep Memory cleanup

- **PR:** [#84](https://github.com/waxeye7/screeps-bounty-arena/pull/84)
- **Issue:** #71
- **Challenge:** Prevent crashes from corrupted creep memory with defensive guards and regression tests
- **Proof commands:**
  ```bash
  npm run check
  npm test
  npm run simulate:seeded:markdown
  ```
- **Verification:** All checks, tests, and seeded simulations passed. The fix hardens memory access against malformed creep data.
- **Maintainer decision:** [2026-05-14 — Seeded-gate PR merges #84–#86](docs/MAINTAINER_DECISIONS.md#2026-05-14--seeded-gate-pr-merges-84-86) — "`#84 and #85 are focused bug/regression fixes with tests`"; merged `e5a40a6` for corrupted creep Memory cleanup. Awarded heavy bug/regression points.

#### AdrianIp0204 — Spawn planner impossible-spawn regression guards

- **PR:** [#87](https://github.com/waxeye7/screeps-bounty-arena/pull/87)
- **Issue:** #67
- **Challenge:** Add regression tests for spawn planner edge cases (busy, low-energy, no-source, retry scenarios)
- **Proof commands:**
  ```bash
  npm run check
  npm test
  npm run simulate:1k
  npm run simulate:10k
  npm run simulate:seeded:markdown
  ```
- **Verification:** Comprehensive test coverage for impossible-spawn edge cases; full simulation gates passed.
- **Maintainer decision:** [2026-05-14 — Spawn planner edge-case PR #87](docs/MAINTAINER_DECISIONS.md#2026-05-14--spawn-planner-edge-case-pr-87) — "Decision: merge #87 as the first clean implementation for #67"; merged `3b05066`. Awarded bug/regression fix points for tests that fail before the fix.

---

### 📊 Medium-scope features (3–8 points)

#### nicovaleops — Named simulation fixtures for bad starts/recovery

- **PR:** [#90](https://github.com/waxeye7/screeps-bounty-arena/pull/90)
- **Issue:** #74
- **Challenge:** Add named simulation fixtures for bad-start and recovery scenarios with documentation
- **Proof commands:**
  ```bash
  npm run check
  npm test
  npm run simulate:1k
  npm run simulate:10k
  npm run simulate:seeded:markdown
  ```
- **Verification:** Fixture listing and regression tests included; documentation updated; all gates passed.
- **Maintainer decision:** Recorded in [POINTS.md](docs/POINTS.md) as "Added fixture listing/runs with docs and regression tests."

#### akamabu — Role edge-case tests for missing targets

- **PR:** [#91](https://github.com/waxeye7/screeps-bounty-arena/pull/91)
- **Issue:** #68
- **Challenge:** Add harvester/builder/upgrader tests for missing-target edge cases
- **Proof commands:**
  ```bash
  npm run check
  npm test
  npm run simulate:1k
  npm run simulate:10k
  npm run simulate:seeded:markdown
  ```
- **Verification:** Targeted edge-case tests for role behavior; full simulation gates passed.
- **Maintainer decision:** Recorded in [POINTS.md](docs/POINTS.md) as "Added harvester/builder/upgrader missing-target tests."

#### rinopatrick — Validate simulator spawn config

- **PR:** [#96](https://github.com/waxeye7/screeps-bounty-arena/pull/96)
- **Issue:** #79
- **Challenge:** Add validation to the simulator for spawn configuration errors
- **Proof commands:**
  ```bash
  npm run check
  npm test
  npm run simulate:1k
  npm run simulate:10k
  npm run simulate:seeded:markdown
  ```
- **Verification:** Regression validation landed after conflict resolution; all checks and simulations passed.
- **Maintainer decision:** [2026-05-14 — Simulator spawn-config validation PR #96](docs/MAINTAINER_DECISIONS.md#2026-05-14--simulator-spawn-config-validation-pr-96) — "Decision: close #96 after landing a cleaned implementation on current `main`"; maintainer landed cleaned regression fix. Awarded points for contribution despite branch conflicts.

---

## How to get showcased

1. Find a bounty-labeled issue with clear acceptance criteria
2. Submit a focused, tested PR with proof of work
3. Pass `npm run check` and `npm test`
4. Include simulation output or other reproducible verification
5. Maintainers review, merge, and record the contribution here

Points are recognition-only. No monetary rewards are offered or implied. See [docs/POINTS.md](docs/POINTS.md) for the full points policy and [docs/MAINTAINER_DECISIONS.md](docs/MAINTAINER_DECISIONS.md) for maintainer reasoning on merge decisions.
