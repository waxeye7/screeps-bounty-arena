# Seeded Time-Lapse Proof Workflow

Use this workflow when a challenge or bounty claims an RCL milestone and reviewers need visual proof plus enough seed/config detail to reproduce the run.

A good proof clip is short, specific, and tied to the exact code under review.

## When to use this

Use a seeded time-lapse for RCL milestone claims, economy progression changes, or any PR where the result is easier to verify visually than from a unit test alone.

Docs-only, unit-test-only, or small refactor PRs do not need video proof unless the issue asks for it.

## Required evidence

Every seeded time-lapse proof should include:

- **Commit SHA tested**: the exact commit used for the run.
- **Proof environment**: offline simulation, local/private Screeps server, replay, or staging.
- **Simulation/private-server seed**: the base seed or server reset/config identifier.
- **Room seed or room name**: enough detail to reproduce terrain/room setup when applicable.
- **Spawn seed/config**: spawn body policy, starting spawn details, or random seed used by the simulator.
- **Target milestone**: target RCL and tick limit from the issue.
- **Result**: tick reached, final RCL, and whether the milestone passed.
- **Video attachment/link**: a GitHub-attached clip/GIF or an unlisted YouTube link.

External video links are supporting proof. Keep the code, commands, seeds, and summary visible in the GitHub PR.

## Capture workflow

1. Check out the exact commit to test.
2. Run the simulator or private-server scenario with explicit seeds/config.
3. Record the run from the start state through the target milestone.
4. Speed the clip up so the final video is **10-60 seconds**.
5. Make sure the clip shows:
   - starting room/spawn state
   - target RCL or milestone marker
   - final result or failure state
6. Attach the clip/GIF to GitHub, or link an unlisted YouTube video.
7. Paste the evidence block below in the PR body or a PR comment.

## Suggested commands

```bash
npm run check
npm test
npm run simulate:seeded:markdown
node scripts/simulate.mjs --ticks 10000 --require-rcl 4 --require-rcl-by 10000 --json
```

If using a private server, include the server reset/config details and redact any tokens or private URLs before posting logs.

## Example PR Evidence Block

````markdown
## Seeded time-lapse proof

Proof level: video/replay + offline-smoke
Commit SHA tested: abc1234
Target: reach RCL 4 by tick 10,000
Environment: offline simulation
Base seed: rcl4-proof-2026-05-14
Room seed/name: W0N0-demo-room
Spawn seed/config: balanced / spawn-seed-42
Command:

```bash
npm run simulate:seeded:markdown
node scripts/simulate.mjs --ticks 10000 --require-rcl 4 --require-rcl-by 10000 --json
```

Result: reached RCL 4 at tick 8,742
Clip: <GitHub attachment or unlisted YouTube URL>
Notes: offline simulation is smoke proof only; no real Screeps server behavior is claimed.
````

## Reviewer checklist

- [ ] Clip is 10-60 seconds and shows the start state plus milestone/result.
- [ ] Commit SHA, seed/config, target RCL, tick reached, and command are included.
- [ ] Offline simulation is labeled as smoke proof only.
- [ ] Private-server logs or URLs do not leak tokens, credentials, or private userinfo.
