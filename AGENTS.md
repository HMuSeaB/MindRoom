# MindRoom Project Notes

## Scope

These instructions are specific to `D:\4rchive\MindRoom`.
Use them for code review, diff summaries, build checks, and release work in this repository.

## Review Rules

- Review with a bug-first mindset.
- Prioritize regressions, persistence bugs, lifecycle leaks, config risks, and build/release mistakes.
- Summaries should explain:
  changed areas
  fixed bugs or risks
  checks that passed
  anything intentionally excluded

## Frontend Structure

- Keep the frontend modularized under `src/modules/`.
- Prefer extending existing modules instead of pushing logic back into one large `src/main.js`.
- Treat timer, stream, canvas, and persistence behavior as sensitive paths; avoid regressions there.

## Build And Check Commands

Run these before push, tag, or release:

```powershell
node scripts/check-frontend.mjs
cargo check --manifest-path src-tauri/Cargo.toml
```

Useful package scripts:

```powershell
npm run check
npm run check:frontend
npm run check:rust
npm run dev
npm run build
```

## Git And Release Rules

- Compare against `origin/main` unless the user names another base branch.
- Stage only files related to the requested work.
- Do not accidentally include unrelated worktree changes.
- Use `codex/` branches for Codex-created branches unless the user asks otherwise.
- Before release, align versions across:
  `package.json`
  `src-tauri/Cargo.toml`
  `src-tauri/tauri.conf.json`

## Important Local Change Boundary

- Treat `src-tauri/gen/android/**` deletions as a separate change set.
- Do not include those deletions in normal frontend/review/release commits unless the user explicitly asks for it.

## README Safety

- `README.md` may display unstable encoding depending on the environment.
- Do not do broad README rewrites when the file appears garbled.
- Only make README edits when the content is clearly readable or the user explicitly accepts the risk.

## Release Output

When publishing a branch, tag, or release, report:

- branch name
- version
- key fixes
- checks run
- links created
