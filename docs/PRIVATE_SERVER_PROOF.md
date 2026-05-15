# Private Server Proof Standard

Use this for PRs that claim behavior beyond offline smoke simulation.

## Minimum private-server proof

Paste a proof block with:

- commit SHA tested
- local server setup path, e.g. `examples/local-screeps-server`
- reset/setup command used
- branch deployed
- seed/config used
- tick count observed
- final RCL or behavior observed
- server log tail
- exact local commands run

Generate a starter block:

```bash
npm run server:proof
```

## Strong bug-fix proof

For bug-hunt PRs, include:

- actual behavior before the fix
- expected behavior
- minimal reproduction
- failing regression test before the fix
- passing regression test after the fix
- local/private-server logs when the bug depends on Screeps engine behavior

Heavy point tiers require this kind of proof:

- `points:13` — bug + regression test
- `points:21` — bug + regression test + fix + verification output

## Strong RCL/economy proof

For RCL or economy claims, include:

- `npm run check`
- `npm test`
- `npm run simulate:1k`
- `npm run simulate:10k`
- private-server log or proof block
- seed/config
- tick reached
- final room/RCL summary
- optional GitHub-attached clip/GIF

## Video/GIF rules

Please refer to the [Seeded Time-Lapse Video Proof Workflow](VIDEO_PROOF_WORKFLOW.md) for the standard procedure on providing video evidence.

In general, video is supporting evidence, not primary proof.

Good clips:

- attached directly to the GitHub PR
- 10–60 seconds
- show starting state and final behavior/milestone
- match the commit SHA and seed/config in the PR

Rejected proof:

- external archive/download links
- external video as the only evidence
- screenshots without reproduction steps
- committed video files in the repo
- logs that omit seed/config/commit SHA

## Security

Never paste or commit:

- Steam API key
- Screeps token
- `.env`
- `.screeps.json`
- `.screepsrc`
- private server password
- Mongo/Redis dumps
- local memory dumps containing private info
