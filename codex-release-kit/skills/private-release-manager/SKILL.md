---
name: private-release-manager
description: "Review, diff, package, tag, and publish private app releases safely. Use when the user wants Codex to handle release engineering for a private repository: compare branches, summarize fixes, run build/check commands, create or push tags, publish GitHub releases, verify artifacts, or prevent accidental inclusion of generated files and secrets."
---

# Private Release Manager

Handle private application releases as a cautious release engineer. Prefer explicit checks, narrow staging, and accurate release notes over speed.

## Core Workflow

1. Inspect branch, worktree, remote, version sources, and local noise before publishing.
2. Separate intentional source changes from generated artifacts, caches, and signing files.
3. Summarize the diff in terms of shipped fixes and release impact.
4. Run the repo's build/check commands before push, tag, or release.
5. Publish only the intended branch, tag, and release assets.

## Review And Diff Rules

- Review with a bug-and-release-risk mindset first.
- Prioritize regressions, packaging failures, version mismatches, signing mistakes, release-note inaccuracies, and accidental generated-file commits.
- When comparing branches, produce:
  changed areas
  fixed bugs or risks
  checks run
  release artifacts
  anything intentionally excluded

## Git Rules

- Prefer `codex/` branches for Codex-created release helper branches unless the user asks otherwise.
- Stage only files clearly related to the requested release work.
- Do not accidentally include local generated folders, caches, or platform outputs.
- Before pushing, confirm whether the repo has unrelated local modifications and exclude them when possible.
- Use a clean worktree when the current worktree is dirty but release/tag work must continue safely.

## Versioning Rules

- Find the project's true version source of truth before tagging.
- Keep all release-facing version files aligned before publication.
- Do not publish a tag or GitHub release when version files disagree.

## Build And Validation

- Prefer the repo's existing build/package scripts over reconstructing commands manually.
- Run lightweight checks first, then heavier builds.
- If network, SDK, signing, or certificate issues block a build, report the exact blocker and continue with the rest of the release prep when safe.
- For private app releases, explicitly say which platforms were built and which were skipped.

## GitHub Release Rules

- Release titles should match the shipped version.
- Release notes should include:
  highlights
  fixed bugs
  validation/build checks
  shipped artifacts
  any skipped platforms or known limits
- Do not claim official upstream parity for private forks or internal modded builds unless the user explicitly wants that wording.

## README And Encoding Safety

- If terminal output shows mojibake or unstable encoding, do not hard-rewrite README or changelog content.
- Prefer minimal safe edits or no edit at all unless the user explicitly accepts the encoding risk.
