# LocalSend VPN Project Notes

## Scope

These instructions apply only to `D:\4rchive\openVPN\apps\localsend`.

## Review Rules

- Review with a release-risk mindset first.
- Prioritize build breakage, signing mistakes, version mismatches, packaging regressions, generated file noise, and private release mistakes.

## Version Source Of Truth

- Primary app version is in `app/pubspec.yaml`.
- Keep `scripts/compile_windows_exe-inno.iss` aligned before publishing.

## Build And Packaging Commands

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\compile_windows_zip.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\compile_windows_exe.ps1
```

Android release:

```powershell
Set-Location app
flutter build apk --release --target-platform android-arm64 --split-per-abi
```

## Safety Rules

- Do not expose or commit signing secrets.
- Do not include `app/android/.kotlin/` or generated Windows Flutter files unless intentional.
- Avoid broad README rewrites when encoding is unstable.
