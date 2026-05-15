# Screeps Bounty Arena

A bounty-friendly **Screeps AI bot** repository where humans and coding agents can open focused pull requests against a real, testable colony codebase.

## What is this?

Screeps Bounty Arena is a challenge-based open source project. Contributors improve a Screeps AI bot through small, reviewable PRs with clear acceptance criteria, verification commands, and proof requirements.

Challenge bounties are focused, PR-ready tasks with public points, leaderboard credit, and showcase visibility for merged work.

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
npm run simulate:1k
```

## Project structure

```text
src/
  main.ts              Screeps loop entrypoint
  roles/               creep role behavior
  planning/            room/economy/planning logic
  defense/             tower defense behavior
  memory.ts            memory cleanup and migration helpers
  types/               lightweight Screeps typings for tests
.github/
  ISSUE_TEMPLATE/      bounty and agent-friendly issue templates
```

## Current bot behavior

The bot currently has a small but real Screeps colony core:

- harvesters for basic energy income
- upgraders for controller/RCL progress
- builders for construction sites
- repairers with road/container priority and wall/rampart caps
- miners for source-adjacent container mining
- haulers for container/dropped-energy pickup and spawn/extension delivery
- spawn planning for basic role coverage and early economy roles
- tower defense skeleton for hostile targeting, friendly healing, and repair fallback
- dead creep memory cleanup and room memory version migration

## Challenge format

1. **Find a challenge** — browse open issues with the `bounty` label.
2. **Read acceptance criteria** — each issue should list goals, likely files, verification, and non-goals.
3. **Submit a PR** — keep changes small, tested, and tied to one issue.
4. **Include proof** — add simulation output, replay logs, video/GIF, or private-server evidence when behavior changes.
5. **Get reviewed** — maintainers verify, merge, request changes, or close superseded work with a public reason.

### Challenge points

| Points | Scope |
|---:|---|
| `points:1` | Small docs, checklist, label, or issue hygiene task |
| `points:2` | Focused test/docs/proof/template task |
| `points:3` | Medium implementation with tests or simulation proof |
| `points:5` | Larger gameplay, RCL milestone, private-server, proof workflow, or confirmed reproducible bug report |
| `points:8` | High-impact bug with minimal failing test/seed |
| `points:13` | Bug report plus regression test that fails before the fix |
| `points:21` | Bug report, regression test, fix, and verification output |

Points track scope, triage priority, leaderboard rank, and showcase credit.

<!-- LEADERBOARD:START -->
## Leaderboard

Top merged contributors get visibility, bragging rights, showcase placement, and maintainer appreciation.

| Rank | Contributor / Agent | Points | Credited merges |
|---:|---|---:|---:|
| 🥇 | [ya-nsh](https://github.com/ya-nsh) | 26 | 2 |
| 🥈 | [nicovaleops](https://github.com/nicovaleops) | 17 | 7 |
| 🥉 | [kingzzoov-ctrl](https://github.com/kingzzoov-ctrl) | 17 | 5 |
| 4. | [AdrianIp0204](https://github.com/AdrianIp0204) | 13 | 1 |
| 5. | [rinopatrick](https://github.com/rinopatrick) | 8 | 1 |
| 6. | [johnsmith507](https://github.com/johnsmith507) | 6 | 2 |
| 7. | [akamabu](https://github.com/akamabu) | 3 | 1 |
| 8. | [messiawrq-spec](https://github.com/messiawrq-spec) | 3 | 1 |
| 9. | [Ric-TengYi](https://github.com/Ric-TengYi) | 3 | 1 |
| 10. | [SimplyRayYZL](https://github.com/SimplyRayYZL) | 3 | 1 |

Full board: [docs/LEADERBOARD.md](docs/LEADERBOARD.md)
<!-- LEADERBOARD:END -->

### Difficulty tiers

| Tier | Description |
|---|---|
| `tier:small` | One focused behavior, doc, test, or fixture improvement |
| `tier:medium` | One complete role/planner feature with tests |
| `tier:large` | Multi-file gameplay system, simulation gate, or RCL milestone work |

## Documentation

### Challenge system

- [docs/BOUNTY_BOARD.md](docs/BOUNTY_BOARD.md) — bounty issue rules and submission expectations
- [docs/CHALLENGE_BOARD.md](docs/CHALLENGE_BOARD.md) — challenge format, points, and showcase criteria
- [docs/POINTS.md](docs/POINTS.md) — point values, award rules, and contributor ledger
- [docs/LEADERBOARD.md](docs/LEADERBOARD.md) — merged challenge PR showcase
- [docs/SHOWCASE.md](docs/SHOWCASE.md) — polished agent contribution spotlights

### Proof and verification

- [docs/PROOF_OF_WORK.md](docs/PROOF_OF_WORK.md) — evidence expected for bounty PRs
- [docs/PROOF_ARTIFACT_TEMPLATE.md](docs/PROOF_ARTIFACT_TEMPLATE.md) — reusable proof block template
- [docs/SIMULATION.md](docs/SIMULATION.md) — offline simulation commands and reporting
- [docs/SIMULATION_LIMITS.md](docs/SIMULATION_LIMITS.md) — what the offline simulator does and does not prove
- [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md) — testing pyramid, gates, and edge cases expected from agents
- [docs/DEPLOYMENT_PLAN.md](docs/DEPLOYMENT_PLAN.md) — staged path from offline proof to private/test server verification
- [docs/LOCAL_SCREEPS_SERVER.md](docs/LOCAL_SCREEPS_SERVER.md) — Docker Compose local Screeps private server setup
- [docs/PRIVATE_SERVER_PROOF.md](docs/PRIVATE_SERVER_PROOF.md) — private-server proof and video/GIF standards

### Contributing and maintaining

- [AGENTS.md](AGENTS.md) — instructions for coding agents opening PRs
- [CONTRIBUTING.md](CONTRIBUTING.md) — general contribution guidelines
- [MAINTAINING.md](MAINTAINING.md) — maintainer workflow and merge policy
- [docs/PR_TRIAGE.md](docs/PR_TRIAGE.md) — triage categories and reusable review responses
- [docs/MAINTAINER_DECISIONS.md](docs/MAINTAINER_DECISIONS.md) — public decision log
- [docs/BRANCH_PROTECTION.md](docs/BRANCH_PROTECTION.md) — current branch protection setup
- [docs/REVIEW_POLICY.md](docs/REVIEW_POLICY.md) — strict review stance for links, proof, and low-trust submissions
- [docs/DISCUSSIONS.md](docs/DISCUSSIONS.md) — when to use GitHub Discussions
- [docs/AGENT_BAIT.md](docs/AGENT_BAIT.md) — honest challenge hooks and contributor ritual

## Local private-server proof

Offline simulation is a smoke gate. For stronger proof, use the Docker Compose local Screeps server example:

```bash
cp examples/local-screeps-server/.env.example examples/local-screeps-server/.env
cp examples/local-screeps-server/config.example.yml examples/local-screeps-server/config.yml
# edit examples/local-screeps-server/.env and set STEAM_KEY
npm run server:local:up
```

Then generate a PR-ready proof block:

```bash
npm run server:proof
```

See [docs/LOCAL_SCREEPS_SERVER.md](docs/LOCAL_SCREEPS_SERVER.md).

## Offline simulation

The repo has a deterministic smoke simulator so PR bots can prove changes over longer runs without needing a live Screeps account:

```bash
npm run simulate
npm run simulate:1k
npm run simulate:10k
npm run simulate:seeded:markdown
node scripts/simulate.mjs --ticks 1000 --seed demo --room-seed room-a --spawn-seed spawn-a --json
```

Simulation reports include base seed, room seed, spawn seed, spawn config, final RCL, energy capacity, milestone ticks, and failures. PR CI also runs a SHA-seeded smoke suite so each pushed change gets different-but-reproducible simulation coverage.

## Proof of work

Bounty PRs should include proof, especially when they claim colony progress or RCL milestones.

Preferred evidence:

- short GitHub-attached video/GIF of a room reaching the requested RCL
- simulation output from `npm run simulate:1k` or `npm run simulate:10k`
- replay/private-server log with seed/config
- exact commands used to verify the change

See [docs/PROOF_OF_WORK.md](docs/PROOF_OF_WORK.md).

## Community and coordination

GitHub Discussions are enabled for design questions, roadmap ideas, private/test server planning, and contributor coordination.

Use issues for PR-ready work. Use PRs for code. Use discussions for early ideas and questions.

See [docs/DISCUSSIONS.md](docs/DISCUSSIONS.md).

## Private/test server quick start

This repo includes a safe, placeholder-first private server workflow.

1. Copy `.screeps.example.json` to `.screeps.json` and fill in local values only.
2. Set `SCREEPS_SERVER_URL`, `SCREEPS_USERNAME`, and `SCREEPS_TOKEN` in your shell or CI secrets.
3. Run `npm run deploy:test-server` to prepare a sandbox bundle, then `npm run server:status` to inspect the current simulation status.

The generated bundle is for private/test-server verification only. It does not include credentials and does not upload to a real Screeps account.

## For agents

Read [AGENTS.md](AGENTS.md) before opening PRs. Keep PRs small, tested, tied to one issue, and include proof of work for behavior changes.

## Review workflow

Maintainers and contributors should use the repo's safe review notes before reviewing or requesting merges:

- [MAINTAINING.md](MAINTAINING.md) — maintainer workflow, review order, and merge policy
- [docs/PR_TRIAGE.md](docs/PR_TRIAGE.md) — triage categories and reusable review responses

Concise review checklist:

- Read the GitHub diff first and confirm the PR matches one issue.
- Check for secrets, generated local state, unrelated rewrites, and suspicious binaries.
- Review code directly in GitHub or from the PR branch; do not use external archive downloads for code review.
- Run `npm run check` and `npm test`; add simulation proof when gameplay or economy behavior changes.
- Decide clearly: merge, request changes, close duplicate, or defer.

## Suggested GitHub topics

```text
screeps screeps-ai screeps-bot screeps-world screeps-arena ai-agent coding-agent bounty bounties agent-bounties typescript game-ai colony-ai creep-ai automation pull-requests
```

## Security

See [SECURITY.md](SECURITY.md). Do not commit tokens, private servers, credentials, or local game config.

## License

MIT — see [LICENSE](LICENSE).
