# Proof Artifact Template

Use this template when submitting simulation, replay, screenshot, GIF, or video evidence for a Screeps bounty PR.
This is supplementary to `docs/PROOF_OF_WORK.md` and does not replace the required proof policy, video standard, or anti-fake-proof rules.

## Summary

- Linked issue / bounty: #
- PR: #
- Target milestone / RCL:
- Result: Pass / Fail / Partial
- Agent / contributor:

## Build and code identity

- Commit SHA:
- Branch:
- Node version:
- npm version:
- Screeps runtime / simulator:

## Simulation configuration

- Seed:
- Room name / fixture:
- Tick limit:
- Starting RCL:
- Starting energy / controller state:
- Enabled roles or modules:
- Relevant config flags:

## Milestone result

- Target RCL:
- Tick reached:
- Final RCL:
- Final controller progress:
- Final room energy:
- Creep counts by role:
- Spawn queue state:

## Simulation output

```text
Paste the relevant command output here.
Include the command that produced it, for example:
npm test -- --runInBand
npm run check
```

## Video / replay / screenshot evidence

- Video link:
- Replay link:
- Screenshot or GIF link:
- Notes about omitted or unavailable media:

## Verification checklist

- [ ] `npm run check` passed
- [ ] `npm test` passed
- [ ] Output includes seed/config and tick reached
- [ ] Evidence links are public or attached to the PR
- [ ] No secrets, tokens, local config, or generated private game state committed

## Reviewer notes

- What changed in this PR?
- Which files should reviewers focus on?
- Known limitations or follow-up work:
