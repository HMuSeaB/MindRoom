# MindRoom Project Notes

## Scope

These instructions apply only to `D:\4rchive\MindRoom`.

## Review Rules

- Review with a bug-first mindset.
- Prioritize regressions, persistence bugs, lifecycle leaks, config risks, and build/release mistakes.

## Frontend Structure

- Keep the frontend modularized under `src/modules/`.
- Prefer extending modules instead of pushing logic back into one large `src/main.js`.

## Build And Check Commands

```powershell
node scripts/check-frontend.mjs
cargo check --manifest-path src-tauri/Cargo.toml
```

## Release Rules

- Align:
  `package.json`
  `src-tauri/Cargo.toml`
  `src-tauri/tauri.conf.json`
- Treat `src-tauri/gen/android/**` deletions as a separate change set unless explicitly included.
- Avoid broad README rewrites when encoding is unstable.
