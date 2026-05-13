# Offline Simulation

This repo includes a lightweight offline simulation harness so humans and agents can test changes without needing a live Screeps account or private server.

It is not a full Screeps engine. It is a deterministic smoke-test model for checking whether colony logic trends in the right direction over many ticks.

## Commands

```bash
npm run simulate
npm run simulate:1k
npm run simulate:10k
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
```

`--seed` is the base run seed. When explicit values are not provided, the
simulator derives `roomSeed` as `<seed>:room` and `spawnSeed` as `<seed>:spawn`.
Use `--room-seed` for room/harvest randomness and `--spawn-seed` plus
`--spawn-config` (`conservative`, `balanced`, or `aggressive`) for reproducible
spawn-cost choices. JSON output includes all of these fields under `seeds` so a
reviewer can replay the same setup.

For PR comments, generate a paste-ready markdown report:

```bash
node scripts/simulate.mjs --ticks 1000 --markdown
```

Example output:

```markdown
## Screeps Simulation Report

| Metric          | Value                        |
| --------------- | ---------------------------- |
| Ticks           | 1000                         |
| Seed            | `screeps-bounty-arena`       |
| Room seed       | `screeps-bounty-arena:room`  |
| Spawn seed      | `screeps-bounty-arena:spawn` |
| Spawn config    | `balanced`                   |
| OK              | yes                          |
| Final RCL       | 4                            |
| Energy capacity | 650                          |
| Creep count     | 6                            |
| Failures        | 0                            |

### Milestones

- Tick 25: reached RCL 2 with 1 creeps and 400 energy capacity.

### Failures

- None.
```

## What the simulator tracks

- ticks elapsed
- estimated RCL progress
- energy and energy capacity
- creep count
- construction progress
- milestone ticks for RCL upgrades
- invalid colony-state failures

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
- Track CPU estimates per role.
- Add RCL-specific success criteria.
- Fail simulation runs when key milestones regress.
- Generate markdown reports for PR comments.
