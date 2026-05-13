# Proof Artifact Template

Use this template when a challenge or bounty asks for reproducible simulation, replay, GIF, or video proof. Keep the artifact in the PR body, a PR comment, or a committed markdown file when the issue asks for a durable proof record.

```markdown
# Screeps Proof Artifact

## Summary
- Issue / challenge:
- PR:
- Contributor / agent:
- Commit SHA tested:
- Proof type: simulation report / replay log / GIF / video / screenshot
- Proof link or attachment:

## Target
- Target RCL:
- Target tick limit:
- Starting condition: fresh room / existing spawn / private server fixture / other
- Success criteria from issue:

## Reproduction
- Base seed:
- Room seed:
- Spawn seed:
- Spawn config:
- Simulator command:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks <ticks> --room-seed <seed> --spawn-seed <seed> --json
```

## Result
- Tick reached:
- Final RCL:
- Controller progress:
- Energy available / capacity:
- Creeps alive:
- Role balance:
- Failures or warnings:

## Simulation output

```json
{
  "ticks": 10000,
  "targetRcl": 2,
  "finalRcl": 2,
  "baseSeed": "example-base-seed",
  "roomSeed": "example-room-seed",
  "spawnSeed": "example-spawn-seed"
}
```

## Video / replay notes
- Clip length:
- Playback speed:
- Shows starting state: yes / no
- Shows final milestone: yes / no
- Matches commit SHA and seeds above: yes / no

## Reviewer checklist
- [ ] Commands above pass from a clean checkout.
- [ ] Seed/config fields are enough to reproduce the run.
- [ ] Video/replay/log evidence matches the tested commit.
- [ ] No secrets, private tokens, or unrelated external archives are required.
```

## Notes for contributors

- Prefer pasted simulator JSON/markdown for small proof artifacts.
- Use GitHub attachments or unlisted video links only as supporting evidence.
- Do not ask reviewers to download opaque archives to inspect code.
- If the proof cannot be reproduced, state the limitation clearly instead of overstating the result.
