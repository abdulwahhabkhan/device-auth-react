# Changelog

All notable changes to `abdulwahhabkhan/device-auth-react` are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-11-15

### Added

- First release. The Inertia + React pages, split out of `abdulwahhabkhan/device-auth` 0.0.1:
  verify, confirm, admin index and admin show, plus the shared components and hooks.
- `DeviceAuthReactServiceProvider` registers the pages through the core's `DeviceAuth::*View()` hooks and shares the `deviceAuth` prop from `DeviceAuth::state()`.
- `config/device-auth-react.php` with the page component map (moved from the core's `pages` key) and the shared prop name.
- `php artisan device-auth:react-install` and the `device-auth-react` / `device-auth-react-config` publish tags.
- The admin show page displays `errors.device` (review conflicts, e.g. a device already approved by someone else).
- Strict TypeScript (`strict`, `noUncheckedIndexedAccess`) with `npm run types`, Prettier, and PHPStan level 7, Rector and Pint for the PHP side.

### Changed

- `Paginated<T>` gains `per_page`, matching the core's `DeviceIndexPageData`.
