# Proof of Work for Bounty PRs

Bounty PRs should include evidence that the bot behavior works, not just a code diff.

## Preferred proof

For repeatable submissions, start from the reusable [proof artifact template](./PROOF_ARTIFACT_TEMPLATE.md), then paste the completed artifact into the PR body or a PR comment.

For gameplay/economy changes, attach at least one of:

- a short video of a room reaching the requested RCL milestone
- a GIF or screen recording of the room behavior
- a simulation report showing the requested tick count and RCL milestone
- a replay/private-server log with the seed/config used
- an unlisted YouTube link or other stable video link, if the clip is too large for GitHub

## RCL milestone proof

If a bounty asks for `RCL X`, the PR should include:

1. target RCL, e.g. `RCL 3`
2. starting condition, e.g. fresh room / existing spawn / private server fixture
3. simulation seed or private-server seed/config
4. spawn/room seed details, including random seed if used
5. tick count reached
6. final room summary
7. video/GIF/screenshot evidence when available
8. exact verification commands

The reusable template includes all required fields: target RCL, tick reached, seed/config, commit SHA, video link, and simulation output.

Example PR evidence block:

```markdown
## Proof

Target: reach RCL 3
Environment: offline simulation + local private server
Ticks: 10,000
Result: reached RCL 4 at tick 2,944

Commands:

```bash
npm run check
npm test
npm run simulate:10k
```

Video: <attach mp4/gif or link>
Simulation report: <paste JSON/markdown summary>
```

## Video proof standard

For RCL milestone bounties, the best proof is a short accelerated clip:

- 10–60 seconds is ideal
- speed-up/time-lapse is allowed and encouraged
- show the starting room/spawn state
- show the final RCL milestone being reached
- include the seed/config in the PR text
- include the exact commit SHA tested
- post as a GitHub attachment, GIF, or unlisted YouTube link

A video without seed/config is weaker proof. A seed/config without video can still be acceptable if it is fully reproducible.

## Do not fake proof

Do not upload unrelated gameplay footage, edited results, fake logs, or screenshots that do not match the submitted code. Do not claim a run uses a seed/config unless reviewers can reproduce it. If video proof is not practical, explain why and provide reproducible logs instead.

## Future automation targets

Good future tasks:

- CI artifact containing simulation report
- markdown report generator for PR comments
- headless replay capture
- private-server smoke test
- automated GIF/video capture of milestone runs
