# Seeded Time-Lapse Video Proof Workflow

When submitting a PR for a bounty or challenge, reviewers need to see that your bot actually reaches the claimed RCL and they need enough seed/config detail to reproduce your run exactly.

A seeded time-lapse video is the standard visual proof for RCL milestone bounties.

## 1. Record the Time-Lapse

- **Length:** 10 to 60 seconds.
- **Speed:** Sped-up enough to show the milestone progress without taking too long to review.
- **Content:** 
  - Must show the starting state (fresh room or starting conditions).
  - Must show the final milestone or behavior.
  - The recording MUST be from a run that uses the same seed and configurations you post in the PR evidence block.

## 2. Host the Video

You can provide the proof in one of two ways:
1. **GitHub Attachment:** Drag and drop the video directly into your GitHub PR description/comment.
2. **Unlisted YouTube Video:** Upload the video to YouTube as "Unlisted" and link it in the PR.

> [!WARNING]
> Do not use external download services (like Google Drive, Dropbox, or custom domains) or provide opaque archives. External links are not accepted as primary proof unless they are direct, streamable videos like YouTube.

## 3. Include the Evidence Block

Your Pull Request description or comment MUST include the exact seeds, configs, and commit SHA used to generate the video. Copy and paste the following template:

```markdown
### Time-Lapse Video Proof
- **Commit SHA tested:** `<commit-sha>`
- **Simulation/Server Seed:** `<base-seed>`
- **Room Seed / Config:** `<room-seed>` / `<spawn-config>`
- **Proof Video:** [GitHub Attachment or Unlisted YouTube Link]
```

## Reviewer Checklist

When reviewing a time-lapse proof, reviewers will verify:
- [ ] The video shows the stated starting state and final milestone.
- [ ] The PR evidence block contains the required `commit SHA` and all necessary `seeds`.
- [ ] The seed/config fields provided are enough to reproduce the run locally.
- [ ] No external archives or suspicious downloads are required.
