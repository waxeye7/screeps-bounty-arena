# Deployment Plan

This repo should not deploy directly to a real Screeps account yet.

The safe path is:

1. offline tests and simulation
2. private/local Screeps server
3. staging deploy target
4. manual real-account deploy

## Phase 0 — current state

The repo currently has:

- TypeScript checks
- unit tests
- offline simulation smoke tests
- challenge/bounty PR workflow

This is enough for early PR review, but not enough to trust code on a live account.

## Phase 1 — offline gate

Every PR should pass:

```bash
npm run check
npm test
npm run simulate:1k
```

Gameplay/economy/RCL PRs should also pass:

```bash
npm run simulate:10k
```

## Phase 2 — private/test Screeps server

Set up a private Screeps server or local test environment that is separate from any real account.

Goals:

- deploy code from `main` or a PR branch to a sandbox room
- run for a fixed number of ticks
- collect logs/RCL progress
- optionally capture a short video/GIF

Important constraints:

- no real Screeps account token
- no production credentials
- resettable world state
- documented seed/config

Implemented private/test-server tasks:

- `npm run deploy:test-server` prepares a sandbox deploy bundle in `dist/main.js` without embedding credentials.
- `.screeps.example.json` documents a local/private server shape and keeps real `.screeps.json` ignored.
- `SCREEPS_SERVER_URL`, `SCREEPS_USERNAME`, `SCREEPS_TOKEN`, and `SCREEPS_BRANCH` are read from the environment.
- `npm run server:status` prints the current private/test-server smoke status and deterministic RCL/tick progress.

Still future work:

- wire the generated bundle to the maintainer's preferred Screeps upload CLI/API
- add a script to export private-server proof logs

## Phase 3 — staging account or staging branch

Only after Phase 2 works:

- create a separate Screeps account or private server user for staging
- store token outside the repo
- deploy only from reviewed branches
- deploy manually, not automatically on every PR

Suggested environment variables:

```text
SCREEPS_SERVER_URL=
SCREEPS_USERNAME=
SCREEPS_TOKEN=
SCREEPS_BRANCH=staging
```

Do not commit these values.

## Phase 4 — real account deploy

Use the real Screeps account only when:

- the code has passed CI
- the code has passed private/test server checks
- the maintainer manually triggers deployment
- rollback is documented

Suggested command shape:

```bash
npm run deploy:staging
npm run deploy:production # manual only, later
```

## Secrets policy

Never commit:

- Screeps auth tokens
- `.screepsrc`
- `.screeps.json`
- private server credentials
- account email/password
- memory dumps containing private data

Use local env files or GitHub Actions secrets.

## What to build next

Open issues should be created for:

1. Add `.screeps.example.json`.
2. Add a manual deploy script for a private server.
3. Add documentation for running a private Screeps server.
4. Add a smoke-test command that reports RCL/tick progress.
5. Add video/GIF proof workflow for milestone runs.

## Decision

Until this plan is implemented, the repo is a challenge/simulation project — not a live Screeps bot deployment pipeline.
