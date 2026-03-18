# Workflow

## 1. Ground Truth

- Inspect branch, remote, status, version files, and local noise.
- Identify generated files, build artifacts, and secrets before staging anything.

## 2. Review

- Review with a bug-first and release-risk-first mindset.
- Spawn focused subagents when helpful:
  frontend/runtime
  platform/config/security
  git/diff/release summary

## 3. Prepare

- Align version files.
- Run the repo's lightweight checks first.
- Run build/package steps only for the intended targets.

## 4. Publish

- Push only the intended branch or tag.
- Create release notes that state:
  highlights
  fixed issues
  validation performed
  shipped artifacts
  skipped platforms or known limits

## 5. Guardrails

- Do not mix unrelated generated files into release commits.
- Use a clean worktree when the active worktree is dirty.
- Do not touch secrets or signing files unless explicitly asked.
- Do not broad-edit README content when encoding looks unstable.
