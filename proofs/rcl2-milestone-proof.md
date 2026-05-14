# RCL 2 Milestone Proof

> Closes #23

## Simulation Report

> Trust level: **smoke**. Deterministic approximation only; not a full Screeps engine or private-server proof.

| Metric | Value |
| --- | --- |
| Ticks | 3000 |
| Seed | `rcl2-proof` |
| Room seed | `rcl2-proof:room` |
| Spawn seed | `rcl2-proof:spawn` |
| Spawn config | `balanced` |
| Model | `offline-smoke-v1` |
| OK | yes |
| Final RCL | 8 |
| Energy capacity | 1250 |
| Creep count | 2 |
| Failures | 0 |

### Gates
- PASS max-failures: expected 0, actual 0.
- PASS required-rcl: expected RCL 2 by tick 2000, actual tick 13.

### Milestones
- Tick 13: reached RCL 2 with 2 creeps and 400 energy capacity.
- Tick 41: reached RCL 3 with 2 creeps and 500 energy capacity.
- Tick 97: reached RCL 4 with 2 creeps and 600 energy capacity.
- Tick 197: reached RCL 5 with 2 creeps and 700 energy capacity.
- Tick 372: reached RCL 6 with 2 creeps and 850 energy capacity.
- Tick 685: reached RCL 7 with 2 creeps and 950 energy capacity.
- Tick 1247: reached RCL 8 with 2 creeps and 1100 energy capacity.

### Failures
- None.

## Reproduction

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 3000 --seed rcl2-proof --require-rcl 2 --require-rcl-by 2000 --markdown
```

## Summary

The bot reaches RCL 2 at **tick 13** from a fresh-room starting point with the `balanced` spawn config. The simulation completes with 0 failures across 3000 ticks, and the bot continues growing well beyond RCL 2 (reaching RCL 8 by tick 1247).
