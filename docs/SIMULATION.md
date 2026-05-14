# Offline Simulation

This repo includes a lightweight offline simulation harness so humans and agents can test changes without needing a live Screeps account or private server.

It is **not** a full Screeps engine. It is a deterministic smoke-test model for checking whether colony logic trends in the right direction over many ticks. Treat it as **Level 2 proof**, not real gameplay proof. See [SIMULATION_LIMITS.md](SIMULATION_LIMITS.md) for the full honesty note.

## Commands

```bash
npm run simulate
npm run simulate:1k
npm run simulate:10k
npm run simulate:gate:rcl2
npm run simulate:gate:rcl3
npm run simulate:seeded
npm run simulate:seeded:markdown
```

For machine-readable JSON in scripts, call the simulator directly or run npm with `--silent` so npm does not prepend lifecycle output:

```bash
node scripts/simulate.mjs --ticks 1000 --json
npm run --silent simulate:10k
```

Or pass custom options:

```bash
node scripts/simulate.mjs --ticks 2500 --seed builder-role --json
node scripts/simulate.mjs --ticks 2500 --seed builder-role --room-seed W8N3-alpha --spawn-seed spawn-a --spawn-config conservative --json
node scripts/simulate.mjs --ticks 1000 --require-rcl 2 --require-rcl-by 1000 --json
node scripts/simulate.mjs --list-fixtures
node scripts/simulate.mjs --fixture spawn-recovery-no-workers --ticks 1000 --require-rcl 2 --require-rcl-by 1000 --markdown
```

`--seed` is the base run seed. When explicit values are not provided, the simulator derives `roomSeed` as `<seed>:room` and `spawnSeed` as `<seed>:spawn`.

Use `--room-seed` for room/harvest randomness and `--spawn-seed` plus `--spawn-config` (`conservative`, `balanced`, or `aggressive`) for reproducible spawn-cost choices. JSON output includes all of these fields under `seeds` so a reviewer can replay the same setup.

Use `--require-rcl` and `--require-rcl-by` to turn simulation claims into pass/fail gates. Failed gates exit non-zero, which lets CI catch regressions.

## Named fixtures

Named fixtures provide reusable bad-start and recovery scenarios for agents and maintainers. List them with:

```bash
node scripts/simulate.mjs --list-fixtures
```

Current fixtures:

- `fresh-room-low-energy` — fresh RCL1 room with one worker and low starting energy; useful for checking early economy recovery.
- `spawn-recovery-no-workers` — zero active workers but enough emergency energy to spawn; useful for validating bootstrap recovery from a wiped worker pool.
- `controller-rush-few-sources` — constrained-income controller rush; useful for checking early RCL progress with fewer source-equivalent harvest opportunities.
- `road-planner-site-cap` — RCL2 room with construction progress near capacity; useful for smoke-testing build/capacity behavior under road-planning pressure.

Run a fixture by name:

```bash
node scripts/simulate.mjs --fixture fresh-room-low-energy --ticks 1000 --json
node scripts/simulate.mjs --fixture spawn-recovery-no-workers --ticks 1000 --require-rcl 2 --require-rcl-by 1000 --markdown
```

Fixture defaults set deterministic seeds and a spawn profile, but explicit CLI options such as `--room-seed`, `--spawn-seed`, and gates can still be provided for replay or stricter proof.

## Seeded CI smoke

The fixed `simulate:1k` and `simulate:10k` gates are stable baseline checks. CI also runs a seeded smoke suite:

```bash
npm run simulate:seeded:markdown
```

On GitHub Actions, the seed base is the PR head SHA or push SHA, so each pushed change gets a different deterministic mini-suite. The output prints the seed base and each exact run seed, making failures reproducible locally:

```bash
npm run simulate:seeded -- --seed-base <paste-seed-base-from-CI>
node scripts/simulate-seeded.mjs --seed-base <paste-seed-base-from-CI> --json
```

By default this runs three 3k-tick simulations across conservative, balanced, and aggressive spawn configs and requires RCL 3 by tick 3000.

For PR comments, generate a paste-ready markdown report:

```bash
node scripts/simulate.mjs --ticks 1000 --require-rcl 2 --require-rcl-by 1000 --markdown
```

Example output:

```markdown
## Screeps Simulation Report

> Trust level: **smoke**. Deterministic approximation only; not a full Screeps engine or private-server proof.

| Metric          | Value                        |
| --------------- | ---------------------------- |
| Ticks           | 1000                         |
| Seed            | `screeps-bounty-arena`       |
| Room seed       | `screeps-bounty-arena:room`  |
| Spawn seed      | `screeps-bounty-arena:spawn` |
| Spawn config    | `balanced`                   |
| Model           | `offline-smoke-v1`           |
| OK              | yes                          |
| Final RCL       | 7                            |
| Energy capacity | 1000                         |
| Creep count     | 2                            |
| Failures        | 0                            |

### Gates

- PASS max-failures: expected 0, actual 0.
- PASS required-rcl: expected RCL 2 by tick 1000, actual tick 13.

### Milestones

- Tick 13: reached RCL 2 with 2 creeps and 400 energy capacity.
```

## Current CI gates

The npm scripts now include conservative pass/fail gates:

- `npm run simulate:1k` requires RCL 2 by tick 1000.
- `npm run simulate:10k` requires RCL 4 by tick 10000.
- `npm run simulate:seeded:markdown` runs three SHA-seeded 3k simulations across different spawn configs and requires RCL 3 by tick 3000.

The model often reaches higher RCLs, but the gates are intentionally conservative so they catch major regressions without pretending to be real Screeps validation.

## What the simulator tracks

- ticks elapsed
- estimated RCL progress
- energy and energy capacity
- creep count
- construction progress
- milestone ticks for RCL upgrades
- invalid colony-state failures
- explicit gates such as required RCL by tick
- proof caveat/trust level in JSON and markdown output

## What it does not prove

The simulator does not prove real Screeps compatibility. It does not model terrain, real pathfinding, intents, CPU, fatigue, exact spawn/extension refill behavior, hostile players, or private-server upload/log retrieval.

Use it to catch cheap regressions. Use private/test-server proof for serious RCL/economy claims.

## How agents should use it

For bounty PRs, include simulation output when relevant:

```bash
npm run check
npm test
npm run simulate:1k
```

For larger economy/pathing changes, run:

```bash
npm run simulate:10k
```

If an agent needs to parse the output, use:

```bash
npm run --silent simulate:10k
```

## Future bounty ideas

- Replace the smoke model with a richer room fixture system.
- Add deterministic source, spawn, controller, and construction-site mocks.
- Add private/test-server upload and log export.
- Add CPU/action-count estimates per role.
- Generate richer markdown reports for PR comments.
