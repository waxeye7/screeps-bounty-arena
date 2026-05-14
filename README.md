# Screeps Bounty Arena

A bounty-friendly **Screeps AI bot** repository designed for humans and coding agents to open focused pull requests.

## What is this?

Screeps Bounty Arena is a challenge-based open source project where contributors improve a Screeps AI bot through small, reviewable pull requests. Each challenge has clear acceptance criteria, verification commands, and proof requirements.

**Important:** Challenge bounties are **not cash rewards** unless a specific issue explicitly says so. They are PR-ready tasks with clear scope for recognition and learning.

## Challenge Format

### How it works

1. **Find a challenge** — Browse [open bounty issues](../../issues?q=is%3Aopen+label%3Abounty)
2. **Read acceptance criteria** — Each issue lists specific goals and verification steps
3. **Submit a PR** — Keep changes small, tested, and tied to one issue
4. **Include proof** — Add video/GIF, simulation output, or replay logs for behavior changes
5. **Get reviewed** — Maintainers verify and merge qualifying PRs

### Challenge points

Issues carry suggested point values to estimate scope:

| Points | Scope |
|--------|-------|
| `points:1` | Small docs, checklist, or test improvement |
| `points:2` | Focused role/planner change with tests |
| `points:3` | Multi-file behavior with simulation proof |
| `points:5` | RCL milestone, video/replay proof, or CI automation |

Points are for fun and triage. They are **not money**.

### Difficulty tiers

| Tier | Description |
|------|-------------|
| `tier:small` | One focused behavior, doc, test, or fixture improvement |
| `tier:medium` | One complete role/planner feature with tests |
| `tier:large` | Multi-file gameplay system, simulation gate, or RCL milestone work |

## Documentation

### Challenge system

- [Bounty Board](docs/BOUNTY_BOARD.md) — How bounty issues work and what makes a good submission
- [Challenge Board](docs/CHALLENGE_BOARD.md) — Challenge format, points, and showcase criteria
- [Points](docs/POINTS.md) — Point values, award rules, and contributor ledger
- [Leaderboard](docs/LEADERBOARD.md) — Merged challenge PRs showcase

### Proof and verification

- [Proof of Work](docs/PROOF_OF_WORK.md) — What evidence to include with bounty PRs
- [Proof Artifact Template](docs/PROOF_ARTIFACT_TEMPLATE.md) — Reusable template for PR proof blocks
- [Simulation](docs/SIMULATION.md) — Offline simulation commands and reporting

### Contributing

- [AGENTS.md](AGENTS.md) — Instructions for coding agents opening PRs
- [CONTRIBUTING.md](CONTRIBUTING.md) — General contribution guidelines
- [MAINTAINING.md](MAINTAINING.md) — Maintainer workflow and merge policy
- [PR Triage](docs/PR_TRIAGE.md) — Triage categories and review responses

## Quick start

```bash
npm install
npm run check
npm test
```

## Project structure

```text
src/
  main.ts              Screeps loop entrypoint
  roles/               creep role behavior
  planning/            room/economy/planning logic
  utils/               shared helpers
.github/
  ISSUE_TEMPLATE/      bounty and agent-friendly issue templates
```

## Current starter behavior

The initial code is deliberately small:

- one `harvester` role
- simple spawn logic
- basic room energy loop
- TypeScript types ready for expansion
- offline simulation commands for 1,000 and 10,000 tick smoke tests

## Offline simulation

The repo has a deterministic smoke simulator so PR bots can prove changes over longer runs without needing a live Screeps account:

```bash
npm run simulate
npm run simulate:1k
npm run simulate:10k
```

See [docs/SIMULATION.md](docs/SIMULATION.md) for what it tracks and how agents should report results.

## Good issues for bots

Each bounty issue should include:

1. a small goal
2. likely files
3. acceptance criteria
4. verification command
5. non-goals
6. suggested challenge points
7. simulation output when behavior affects economy, roles, or RCL progression

Example:

> Add a `builder` role that builds construction sites after energy sources are serviced. Verify with `npm run check` and a unit test for role selection.

## Proof of work

Bounty PRs should include proof, especially when they claim colony progress or RCL milestones.

Preferred evidence:

- short video/GIF of a room reaching the requested RCL
- simulation output from `npm run simulate:1k` or `npm run simulate:10k`
- replay/private-server log with seed/config
- exact commands used to verify the change

See [docs/PROOF_OF_WORK.md](docs/PROOF_OF_WORK.md).

## Community and coordination

GitHub Discussions are enabled for design questions, roadmap ideas, private/test server planning, and contributor coordination.

Use issues for PR-ready work. Use PRs for code. Use discussions for early ideas and questions.

See [docs/DISCUSSIONS.md](docs/DISCUSSIONS.md).

## Review workflow

Maintainers and contributors should use the repo's safe review notes before reviewing or requesting merges:

- [MAINTAINING.md](MAINTAINING.md) — maintainer workflow, review order, and merge policy.
- [docs/PR_TRIAGE.md](docs/PR_TRIAGE.md) — triage categories and reusable review responses.

Concise review checklist:

- Read the GitHub diff first and confirm the PR matches one issue.
- Check for secrets, generated local state, unrelated rewrites, and suspicious binaries.
- Review code directly in GitHub or from the PR branch; do not use external archive downloads for code review.
- Run `npm run check` and `npm test`; add simulation proof when gameplay or economy behavior changes.
- Decide clearly: merge, request changes, close duplicate, or defer.

## Suggested GitHub topics

Add these topics after publishing:

```text
screeps screeps-ai screeps-bot screeps-world screeps-arena ai-agent coding-agent bounty bounties agent-bounties typescript game-ai colony-ai creep-ai automation pull-requests
```

## Security

See [SECURITY.md](SECURITY.md). Do not commit tokens, private servers, credentials, or local game config.

## License

MIT — see [LICENSE](LICENSE).
