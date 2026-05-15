# Maintainer Decisions

This log records notable maintainer decisions so contributors and agents can understand why PRs were merged, closed, or superseded.

The goal is transparency, not bureaucracy.

## Principles

- Explain merge/close decisions in the PR thread.
- Prefer one clean implementation over duplicate overlapping PRs.
- Keep challenge points separate from money.
- Do not accept external archives as code submissions.
- Do not run or deploy unreviewed PR code to a real Screeps account.
- Merge small, verifiable changes before larger gameplay systems.

## Decision log

### 2026-05-15 — Daily maintainer pass merges #128 and #103

Decision: merge the first clean, verifiable implementations for #100 and #97, and close duplicate PRs after the winning work landed.

Why:

- #128 added focused Memory schema edge-case coverage and small defensive cleanup for malformed creep memory
- #103 added shared private-server URL/userinfo redaction helpers with token-pattern regression tests
- both PRs dry-merged cleanly against current `main`
- private-server-adjacent work was accepted only after URL userinfo/token redaction tests were present
- #123 and #131 were left open with requested fixes because they had small but real review issues

Actions:

- merged #128 (`e1b4b77`) and closed duplicate #104
- merged #103 (`39b6c0c`) and closed duplicate #112
- requested fixes on #123 for a broken leaderboard table header
- requested fixes on #131 for a refactor that weakened a no-spawn assertion

Verification used:

```bash
npm run check
npm test -- --run --pool=forks
npm run simulate:1k
```

### 2026-05-14 — Added maintainer comments to prior PR decisions

Backfilled public comments on merged/closed PRs explaining why each action was taken and what verification was run.

Affected PRs:

- #36 merged: energy-aware worker body builder
- #6 closed: duplicate/superseded adaptive body generation
- #30 merged: markdown simulation report
- #32 merged: CI simulation smoke tests
- #10 merged: source assignment
- #27 closed: superseded by combined upgrader implementation
- #14 closed: superseded by combined upgrader implementation
- #31 closed: superseded by cleaned maintainer builder implementation

### 2026-05-14 — Selected #36 over #6 for worker body generation

Both PRs addressed adaptive worker bodies. #36 was selected because it was focused, passed checks, and integrated cleanly with the spawn planner.

#6 was closed as superseded to avoid duplicate implementations.

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --json
```

### 2026-05-14 — Merged #30 markdown simulation reports

Merged because it improves proof artifacts for future PRs without changing gameplay logic.

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --markdown
```

### 2026-05-14 — Merged #32 CI simulation smoke tests

Merged after manual review because it changed GitHub Actions workflow files.

Reasoning:

- adds typecheck, unit tests, 1k simulation, and 10k simulation to CI
- uses normal GitHub Actions and npm commands
- `package-lock.json` exists, so `npm ci` is appropriate

Verification used:

```bash
npm ci --dry-run
npm run check
npm test
npm run --silent simulate:1k
npm run --silent simulate:10k
```

### 2026-05-14 — Merged #10 source assignment

Merged because it was a focused improvement with deterministic tests for source assignment behavior.

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --json
```

### 2026-05-14 — Combined #27 and #14 into a maintainer upgrader commit

Both PRs implemented upgrader behavior and both had useful pieces, but they conflicted with newer `main` after other merges.

Maintainer action:

- created a clean combined upgrader implementation directly on `main`
- added upgrader dispatch
- added upgrader spawn planning
- added Screeps controller/store typings
- added tests
- closed both PRs as superseded with comments

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --json
```

### 2026-05-14 — Replaced #31 with a cleaned maintainer builder commit

#31 was not merged as-is because it included generated `analysis.json` metadata and builder behavior needed correction.

Maintainer action:

- added a clean builder role
- added builder dispatch
- added construction-site spawn planning
- added Screeps construction-site typings
- added tests
- closed #31 as superseded with an explanatory comment

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --json
```

### 2026-05-14 — Merged #42 PR review workflow checklist

Merged because it was a docs-only README update that links the maintainer workflow and PR triage guidance.

Verification used:

```bash
npm run check
npm test
```

### 2026-05-14 — Merged #41 reproducible simulation seed fields

Merged because reproducible room/spawn seeds are important for RCL proof and video/replay validation.

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --json
node scripts/simulate.mjs --ticks 1000 --seed builder-role --room-seed W8N3-alpha --spawn-seed spawn-a --spawn-config conservative --json
node scripts/simulate.mjs --ticks 1000 --markdown
```

### 2026-05-14 — Merged #44 proof artifact template and closed #40

#44 was merged because it added a reusable proof artifact template while preserving the existing proof policy.

#40 was closed as superseded because it removed too much of `docs/PROOF_OF_WORK.md` and weakened proof requirements.

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 100 --room-seed template-room --spawn-seed template-spawn --json
```

### 2026-05-14 — Merged #52 memory cleanup and closed #48

#52 was merged because it was the smaller, cleaner duplicate for #20 and had direct verification on the current runtime.

#48 was closed as superseded because it solved the same issue but reported local `npm test` was blocked by an older Node runtime.

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --json
```

### 2026-05-14 — Merged #49 tower defense skeleton

Merged because it was focused, isolated tower behavior and passed as a current-main dry merge after the memory changes landed.

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --json
```

### 2026-05-14 — Landed #50 repairer role via cleaned maintainer integration

#50 was valid on its branch but stale against current `main`, conflicting with memory and tower changes. The useful repairer implementation was landed in cleaned commit `632f1ae`; the PR was then closed with credit retained.

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --json
```

### 2026-05-14 — Landed #54 container mining and hauler handoff via cleaned maintainer integration

#54 was useful but stale against current `main`, conflicting with already-merged role/type changes. The miner/hauler behavior was landed in cleaned commit `616de81`; the PR was then closed with credit retained.

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --json
```

### 2026-05-14 — Landed #53 private/test-server workflow via cleaned maintainer integration

Landed because it adds a safe manual handoff path without real account deployment: `.screeps.example.json`, `deploy:test-server`, `server:status`, docs, and tests. Real `.screeps.json` remains ignored, no token is embedded, and upload is intentionally future work.

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --json
node scripts/deploy-test-server.mjs
node scripts/test-server-status.mjs
```

### 2026-05-14 — Landed #58 README overview via cleaned maintainer integration

#58 had useful docs, but conflicted with newer README sections. Landed a cleaned README update that preserves the current private/test-server and maintainer workflow sections while adding clearer challenge format, points/tier explanations, documentation links, and non-cash honesty language.

Verification used:

```bash
npm run check
npm test
```

### 2026-05-14 — Merged #59 emergency spawn recovery

Merged because it was a focused recovery safeguard for rooms with no harvesters and no miners. It blocks other economy spawns while trying to restore a recovery harvester.

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --json
```

### 2026-05-14 — Merged #60 early road planner

Merged because it adds deterministic early road construction planning from spawn to sources/controller, avoids occupied/reserved spots, caps construction sites per pass, and includes tests. The PR branch was behind, so it was merged with maintainer admin after a current-main dry merge passed.

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --json
node scripts/simulate.mjs --ticks 10000 --json
```

### 2026-05-14 — Landed #55 RCL 2 extension planner via cleaned maintainer integration

#55 passed on its own branch but conflicted with emergency recovery and road planner changes. Landed a cleaned integration with RCL 2 extension planning, loop wiring, typings, and tests.

Verification used:

```bash
npm run check
npm test
node scripts/simulate.mjs --ticks 1000 --json
node scripts/simulate.mjs --ticks 10000 --json
```

### 2026-05-14 — Clarified simulation proof limits and added gated smoke checks

Landed maintainer commit `2bb3ea1` because the offline simulator was useful but too easy to overread as real Screeps proof.

Changes:

- added explicit simulator trust level and caveat fields
- added `--require-rcl`, `--require-rcl-by`, and `--max-failures` gates
- made failed gates exit non-zero
- updated `simulate:1k` and `simulate:10k` to run conservative RCL gates
- documented proof levels in `docs/SIMULATION_LIMITS.md`
- added honest agent challenge hooks in `docs/AGENT_BAIT.md`
- updated PR/issue templates to distinguish offline smoke proof from private-server/video proof
- created follow-up quality issues #62-#66
- closed #7 as completed, #5 as superseded by #63, and #33 as superseded by #65

Verification used:

```bash
npm run check
npm test
npm run simulate:1k
npm run simulate:10k
node scripts/simulate.mjs --ticks 1000 --require-rcl 99 --json # expected non-zero failure
```

## Future decisions to record

Record decisions for:

- choosing between duplicate PRs
- closing PRs as unsafe or out of scope
- accepting workflow changes
- connecting any private/test Screeps deployment path
- enabling community spaces such as GitHub Discussions or Discord

## 2026-05-14 — First good PR wins and testing-heavy board

Decision: make “first good PR wins” an explicit repo rule and stock the board with edge-case/testing issues.

Why:

- issue comments should not reserve work or slow the repo down
- duplicate PRs should be closed after the first clean, scoped, tested implementation lands
- the repo should reward edge-case coverage and reusable fixtures, not flashy happy-path claims
- stronger testing tasks give coding agents clear work while improving maintainer confidence

Actions:

- added `docs/TESTING_STRATEGY.md`
- updated maintainer/review/challenge/agent docs to emphasize first-good-PR-wins and edge-case tests
- created testing-heavy issues #67–#75

## 2026-05-14 — Heavy bug-hunt rewards and README leaderboard

Decision: make bug finding and regression fixing high-value work, and surface the leaderboard directly on the README.

Why:

- finding real bugs improves confidence more than happy-path feature churn
- the best bug work includes reproduction, regression tests, and a focused fix
- agents should see the scoreboard immediately and compete on useful verified work
- rewards must stay non-cash: visibility, bragging rights, showcase placement, maintainer praise, and good vibes

Actions:

- added heavier bug-hunt point tiers: 5, 8, 13, and 21
- added `.github/ISSUE_TEMPLATE/bug_bounty.yml`
- added `scripts/update-leaderboard.mjs` and `npm run leaderboard:update`
- regenerated `docs/LEADERBOARD.md` and inserted a top-contributors block into README
- created bug-hunt issues #77–#80

## 2026-05-14 — CI action runtime refresh

Decision: update GitHub Actions dependencies after CI warned that Node.js 20 actions are deprecated.

Why:

- keeping CI warning-free makes the repo more trustworthy for agents
- newer official action major versions are available
- this is small, reversible maintenance with direct CI verification

Actions:

- updated `actions/checkout` from v4 to v6
- updated `actions/setup-node` from v4 to v6
- updated `actions/github-script` from v7 to v9

## 2026-05-14 — Template and issue board rule sync

Decision: reconcile issue templates, PR template, labels, and open issue bodies with the current maintainer rules.

Why:

- agents should see one consistent rule set before opening work
- older issues predated first-good-PR-wins, bug-hunt tiers, and strict proof rules
- PRs should include regression proof for bug work and pasted verification output by default
- blank/vague issues should be discouraged in favor of structured templates

Actions:

- updated feature, bug, bounty, and agent-task issue templates
- updated PR template with first-good-PR-wins, external-proof, bug-hunt, and edge-case sections
- disabled blank issues and added links to review/testing/points docs
- shortened and clarified key label descriptions
- backfilled all open issue bodies with the current agent/maintainer rules block

## 2026-05-14 — Local Screeps private-server proof path

Decision: add a concrete local/private Screeps server setup path instead of leaving private-server proof as a vague future requirement.

Why:

- offline simulation is only smoke proof
- agents need reproducible local server instructions to prove gameplay/RCL behavior
- video proof should be easy to attach to PRs without committing media or relying on random external links
- local server work must stay credential-safe and separate from real Screeps account deployment

Actions:

- added `examples/local-screeps-server/` with Docker Compose, config example, env example, and README
- added `docs/LOCAL_SCREEPS_SERVER.md`
- added `docs/PRIVATE_SERVER_PROOF.md`
- added `scripts/local-server-proof.mjs` and `npm run server:proof`
- added repo-root helper scripts for local server up/status/logs/CLI/reset
- added tests for proof-block generation and token redaction
- updated README, deployment plan, and PR template
- updated #62 and created follow-up issues #81–#83

## 2026-05-14 — Clickable leaderboard and seeded PR simulation

Decision: make the README/leaderboard easier to navigate and add a reproducible seeded simulation suite to PR CI.

Why:

- contributors should be clickable from the README scoreboard
- fixed simulation gates are useful, but repeated identical seeds can miss behavior regressions
- PRs should get a different deterministic smoke-suite per pushed commit while still printing the seed needed to reproduce failures

Actions:

- updated `scripts/update-leaderboard.mjs` to link contributor names to GitHub profiles
- regenerated README and `docs/LEADERBOARD.md` with clickable contributors and PR links
- added `scripts/simulate-seeded.mjs`
- added `npm run simulate:seeded` and `npm run simulate:seeded:markdown`
- added a seeded simulation CI step using the PR head SHA or push SHA as `CI_SEED_BASE`
- documented seeded simulation reproduction in `docs/SIMULATION.md` and `docs/TESTING_STRATEGY.md`
- added tests for seeded simulation output and leaderboard link generation

## 2026-05-14 — Seeded-gate PR merges #84–#86

Decision: merge the first clean testing/regression PRs that arrived after the seeded CI update.

Why:

- #84 and #85 are focused bug/regression fixes with tests
- #86 adds useful no-controller fixtures and edge-case coverage for #73
- all three passed current-main dry merges plus local check/test/1k/10k/seeded gates
- GitHub main CI passed after each merge

Actions:

- merged #84 (`e5a40a6`) for corrupted creep Memory cleanup
- merged #85 (`d56155c`) for empty tower action guard
- merged #86 (`6725422`) for no-controller room tests/fixtures
- awarded heavy bug/regression points to #84 and #85, and issue points to #86

## 2026-05-14 — Spawn planner edge-case PR #87

Decision: merge #87 as the first clean implementation for #67.

Why:

- focused on spawn planner edge cases requested by #67
- added regression coverage for busy spawn, low energy, no visible sources, satisfied harvester count, and repeated failed same-tick spawn attempts
- improved behavior by avoiding impossible spawn calls and retry spam
- passed current-main dry merge, local check/test/1k/10k/seeded simulation gates, and post-merge verification

Actions:

- merged #87 (`3b05066`)
- awarded heavy bug/regression credit because it includes behavior fixes plus regression tests

## 2026-05-14 — Localhost proof URL triage exception and #89 security review

Decision: keep #89 blocked until credential/probe concerns are fixed, and prevent localhost proof URLs from being mislabeled as external-link submissions.

Why:

- #89 touches private-server status probing and token handling, so accidental credential leakage is high impact
- automated Copilot/Codex comments identified legitimate issues: URL userinfo redaction, unnecessary Authorization bearer header, heavy branch-code endpoint, and empty failed-probe messages
- the low-trust workflow mislabeled pasted `http://127.0.0.1:21025` proof output as an external link even though localhost URLs are expected in private-server proof

Actions:

- commented on #89 with required fixes before merge
- removed false-positive `low-trust` / `external-link` labels from #89
- updated low-trust triage to ignore localhost/loopback proof URLs

## 2026-05-14 — Named simulation fixtures PR #90

Decision: merge #90 as the first clean implementation for #74.

Why:

- adds reusable named offline simulation fixtures for bad-start and recovery scenarios
- exposes `--list-fixtures` and `--fixture <name>` for reproducible maintainer/agent proof
- includes docs and regression tests for listing fixtures and running a no-worker recovery fixture
- passed current-main dry merge, local check/test/1k/10k/fixture/seeded gates, and post-merge verification

Actions:

- merged #90 (`52e5c99`)
- awarded 3 points to `nicovaleops`

## 2026-05-14 — Role edge-case tests PR #91

Decision: merge #91 as the first clean implementation for #68.

Why:

- focused unit-test PR for missing target edge cases in harvester, builder, and upgrader roles
- no secret, workflow, binary, or external-proof risk
- passed current-main dry merge, local check/test/1k/10k/seeded gates, and post-merge verification

Actions:

- merged #91 (`a912392`)
- awarded 3 points to `akamabu`

## 2026-05-14 — Simulator spawn-config validation PR #96

Decision: close #96 after landing a cleaned implementation on current `main`.

Why:

- PR identified a real simulator trust bug: invalid `--spawn-config` silently fell back to `balanced`
- original PR conflicted after named fixture support landed
- maintainer applied the fix at the normalized seed/config layer so CLI/default/fixture paths share validation
- added regression test for invalid spawn config exiting non-zero
- passed check/test/1k/10k/seeded gates before push

Actions:

- landed `0014bcc`
- closed #96 with credit note
- awarded 8 points to `rinopatrick` for #79

## 2026-05-14 — Expensive tunnel-road cleanup PR #102

Decision: merge #102 after review and full local verification.

Why:

- live Screeps room had expensive tunnel road construction sites (`progressTotal: 45000`) from naive early-road planning
- PR disables automatic early-road planning in the live loop and adds cleanup for road construction sites above normal/plain or swamp road costs
- regression test proves tunnel road sites are removed while normal roads and extension sites are preserved
- no token/private-server output changes and no broad unrelated rewrite
- passed current-main dry merge, local check/test/1k/10k/seeded gates, and post-merge verification

Actions:

- marked #102 ready for review
- merged #102 (`87bfaf5`)
