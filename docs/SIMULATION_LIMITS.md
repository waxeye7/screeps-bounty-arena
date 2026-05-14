# Simulation Limits and Proof Levels

The offline simulator is useful, but it is **not Screeps**.

It is a deterministic smoke model. It checks that a PR does not obviously break high-level economy progression, seed reporting, milestone tracking, and pass/fail gates. It does **not** execute real Screeps room physics.

## Proof levels

| Level | Name | What it proves | What it does not prove |
|---|---|---|---|
| 0 | Static review | Diff is scoped, no secrets, no obvious bad files | Runtime behavior |
| 1 | Unit tests | Role/planner functions behave against mocks | Real Screeps engine compatibility |
| 2 | Offline smoke simulation | Economy trends do not regress in this repo's deterministic model | Real pathfinding, CPU, intents, terrain, spawn timing, server quirks |
| 3 | Private/test server | Code can run in a resettable Screeps-like server with real ticks/logs | Production account safety |
| 4 | Staging branch/account | Reviewed code works in a controlled live-ish setup | Main account safety without manual rollout |
| 5 | Real account deploy | Manual, reviewed, rollback-aware deployment | Automatic trust for future PRs |

Current CI reaches **Level 2**. RCL milestone claims should aim for **Level 3** or better.

When filling out PR proof, use these labels consistently:

- `unit` for Level 1 test-only evidence
- `offline-smoke` for Level 2 simulator evidence
- `private-server` for Level 3 resettable server evidence
- `video-replay` for GitHub-attached clips, GIFs, or replay logs that show the milestone
- `staging` for Level 4 controlled live-ish validation

Do not describe `simulate:1k`, `simulate:10k`, or seeded simulator output as live Screeps proof. They are offline-smoke checks unless paired with private-server, video/replay, or staging evidence.

## What the offline simulator models

The simulator currently models:

- tick count
- rough harvest income
- rough creep growth
- rough controller progress
- rough construction progress
- energy capacity growth
- RCL milestone ticks
- seeded room/spawn randomness
- explicit pass/fail gates such as required RCL by tick

It intentionally does not model:

- real Screeps terrain
- real pathfinding
- creep fatigue
- body-part action rates
- intent resolution
- CPU limits/bucket
- hostile players/invaders beyond simple future extensions
- spawn/extension exact energy refills
- construction placement failures beyond mocked planner tests
- private server API upload/log retrieval

## Why keep it?

Because it catches cheap regressions quickly:

- simulator output stays reproducible
- RCL milestone reporting does not disappear
- proof blocks include seeds/config
- obvious economy failures fail CI before maintainers spend review time

It is a **gate**, not proof of real gameplay.

## Current gates

```bash
npm run simulate:1k
npm run simulate:10k
```

These run with explicit milestone requirements:

- `simulate:1k`: require RCL 2 by tick 1000
- `simulate:10k`: require RCL 4 by tick 10000

You can also run explicit gates:

```bash
node scripts/simulate.mjs --ticks 1000 --require-rcl 2 --require-rcl-by 1000 --json
node scripts/simulate.mjs --ticks 3000 --require-rcl 3 --require-rcl-by 3000 --markdown
```

If a gate fails, the command exits non-zero.

## What better proof looks like

For serious RCL/economy claims, include one of:

- private/test-server log with seed/config and tick reached
- replay output
- short accelerated video/GIF
- GitHub-attached short clip/GIF
- exact commit SHA and commands

The next quality step for this repo is to turn the private/test-server placeholder into a real upload + log export workflow that still keeps credentials outside the repo.
