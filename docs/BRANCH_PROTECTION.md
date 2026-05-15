# Branch Protection

The `main` branch is protected.

## Current settings

- Required status check: `Typecheck, tests, and simulation smoke`
  - This CI job runs lint, typecheck, unit tests, and simulation smoke gates.
- Require branches to be up to date before merging: yes
- Force pushes: disabled
- Branch deletion: disabled
- Admin enforcement: disabled, so the owner can still recover the repo if configuration breaks
- Required approving review count: 0 for now

## Why this setup

This repo receives bot/agent PRs. The most important immediate guardrail is making sure the main CI smoke gate passes before merge.

Admin enforcement is intentionally off for now to avoid locking the maintainer out while the project is still stabilizing.

## Future tightening

Once the repo is calmer, consider:

- require one approving review
- require conversation resolution
- enable stale review dismissal
- add CODEOWNERS
- require private/test-server proof for RCL milestone PRs

Do not enable stricter settings until there is a reliable recovery path and CI is stable.
