# Project Notes

## Scope

These instructions apply only to this repository.
Use them for code review, diff summaries, build checks, packaging, tags, and releases.

## Review Rules

- Review with a bug-first and release-risk-first mindset.
- Prioritize regressions, build breakage, version mismatches, packaging mistakes, generated file noise, and release-note inaccuracies.

## Version Rules

- Identify the real version source of truth.
- Align all release-facing version files before tagging.

## Build Rules

- Prefer existing project scripts over ad-hoc commands.
- Run lightweight validation before heavy builds.
- State exactly which platforms or artifacts were built.

## Git Rules

- Stage only files related to the requested work.
- Do not include generated files or local caches unless intentional.
- Use a clean worktree when the active worktree is dirty.

## Sensitive Files

- Never commit secrets, signing files, or local machine config unless explicitly requested.

## README Safety

- If README content appears garbled in the current environment, do not do broad rewrites.
