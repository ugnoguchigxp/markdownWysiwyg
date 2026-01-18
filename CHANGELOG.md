# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.4] - 2026-01-18

### Added

- SSG support via `StaticHtmlGenerator`.

## [0.3.3] - 2026-01-18

### Changed

- Unified heading translation keys to a single `markdown_editor.heading` key and compose the level in the UI.

## [0.2.2] - 2025-12-18

### Changed

- Fixed the toolbar download menu background styling to avoid transparency issues.
- Updated the example app to wire `I18nProvider` so `I18N_KEYS` translations resolve correctly.

## [0.2.1] - 2025-12-15

### Added

- Exported `I18nKey` type for typed translation keys.

### Changed

- Memoized `I18nProvider` context value to reduce unnecessary rerenders.
- Updated documentation to match host-driven i18n (`I18nProvider` + `t(key)`) and removed obsolete `texts`/`placeholder` references.
- Made `prepublishOnly` use `npm run` to improve compatibility when publishing.

## [0.2.0] - 2025-12-15

### Added

- Host-driven i18n via `I18nProvider` and injected `t(key)`.
- `I18N_KEYS` exported for defining all UI labels by translation keys.

### Changed

- All UI labels now resolve through `t(I18N_KEYS.*)`.

### Removed

- Removed `texts` prop, `DEFAULT_TEXTS`, and related types from the public API.
- Removed `placeholder` prop (placeholder is derived from `t(I18N_KEYS.placeholder)`).
