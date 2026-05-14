# Screeps Bounty Arena

A bounty-friendly **Screeps AI bot** repository designed for humans and coding agents to open focused pull requests.

This repo is intentionally easy to find when bots search for:

- Screeps AI
- Screeps bot
- Screeps bounty / bounties
- coding agent PR tasks
- AI agent game automation
- MMO programming game bots
- colony AI / creep AI

## Goal

Build a clean, modular Screeps codebase where agents can improve one behavior at a time: harvesting, spawning, upgrading, building, repairing, defending, scouting, pathing, and economy planning.

The repo is structured to attract useful PRs rather than vague drive-by changes.

## Agent/bounty keywords

`Screeps`, `Screeps AI`, `Screeps bot`, `Screeps World`, `Screeps Arena`, `AI agent`, `coding agent`, `bounty`, `bounties`, `agent bounty`, `pull request`, `TypeScript`, `game AI`, `colony AI`, `creep AI`, `automation`.

## Quick start

```bash
npm install
npm run check
npm test
```

## Project shape

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

## Challenge bounties

This repo uses **challenge bounties**: clear PR tasks that are fun for humans and coding agents to attempt. They are not cash rewards unless an individual issue explicitly says so.

See:

- [docs/BOUNTY_BOARD.md](docs/BOUNTY_BOARD.md)
- [docs/CHALLENGE_BOARD.md](docs/CHALLENGE_BOARD.md)
- [docs/POINTS.md](docs/POINTS.md)
- [docs/LEADERBOARD.md](docs/LEADERBOARD.md)

Good issues for bots should include:

1. a small goal
2. likely files
3. acceptance criteria
4. verification command
5. non-goals
6. suggested challenge points
7. simulation output when behavior affects economy, roles, or RCL progression

Example:

> Add a `builder` role that builds construction sites after energy sources are serviced. Verify with `npm run check` and a unit test for role selection.

## Suggested GitHub topics

Add these topics after publishing:

```text
screeps screeps-ai screeps-bot screeps-world screeps-arena ai-agent coding-agent bounty bounties agent-bounties typescript game-ai colony-ai creep-ai automation pull-requests
```

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

## Private/test server quick start

This repo now includes a safe, placeholder-first private server workflow.

1. Copy `.screeps.example.json` to `.screeps.json` and fill in local values only.
2. Set `SCREEPS_SERVER_URL`, `SCREEPS_USERNAME`, and `SCREEPS_TOKEN` in your shell or CI secrets.
3. Run `npm run deploy:test-server` to prepare a sandbox deploy bundle, then `npm run server:status` to inspect the current simulation status.

The generated bundle is for private/test-server verification only and does not include credentials.

## For agents

Read [AGENTS.md](AGENTS.md) before opening PRs. Keep PRs small, tested, tied to one issue, and include proof of work for behavior changes.

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md). Do not commit tokens, private servers, credentials, or local game config.

## License

MIT — see [LICENSE](LICENSE).
