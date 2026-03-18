# Codex Release Kit

Portable templates for building a repeatable Codex workflow around:

- project-level `AGENTS.md`
- reusable release/review skills
- code review with subagents
- safe build/tag/release flow

## What This Project Contains

- `skills/private-release-manager/`
  A reusable skill for private repository review, packaging, tagging, and release work.
- `templates/AGENTS.project-template.md`
  A generic in-repo `AGENTS.md` starting point.
- `examples/mindroom/AGENTS.md`
  A project-specific example for Tauri/desktop release work.
- `examples/localsend/AGENTS.md`
  A project-specific example for Flutter/private multi-platform release work.
- `docs/workflow.md`
  A compact end-to-end workflow for review, build, and release.

## Recommended Pattern

1. Put a project-specific `AGENTS.md` inside the target repository.
2. Keep global, reusable logic in a Codex skill.
3. Use subagents for focused review passes:
   frontend/runtime
   platform/config/security
   git/diff/release summary
4. Use clean worktrees when the main worktree is dirty but release work must continue.

## Good Fit

Use this kit when you want Codex to:

- review changes before shipping
- compare branches and summarize fixes
- avoid committing generated files or secrets
- run build/check commands consistently
- publish branches, tags, and GitHub releases with accurate notes

## Notes

- Prefer project-local `AGENTS.md` for repo-specific constraints.
- Prefer reusable skills for cross-project release workflows.
- Do not hard-rewrite README files when terminal encoding is unstable.
