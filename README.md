# abdulwahhabkhan/device-auth-react

Inertia + React pages for [`abdulwahhabkhan/device-auth`](https://github.com/abdulwahhabkhan/device-auth): the "verify this device" screen shown after the password, the device confirmation screen for sensitive actions, and the administrator's device review screens.

The core package holds all the logic (actions, routes, middleware, WebAuthn). This package only renders its pages with Inertia and shares the device-auth state with every page.

## Requirements

- PHP 8.3+, Laravel 13
- `abdulwahhabkhan/device-auth` ^0.1
- Inertia (Laravel adapter 2 or 3) with React 18/19, `@inertiajs/react` and Tailwind CSS
- https (or `localhost` during development), because WebAuthn requires a secure context

## Installation

```bash
composer require abdulwahhabkhan/device-auth abdulwahhabkhan/device-auth-react
php artisan device-auth:install         # core: config, migrations, actions, service provider
php artisan device-auth:react-install   # this package: React pages and config
php artisan migrate
npm run build
```

The pages are published into your app so you own them:

```
resources/js/pages/device-auth/   verify, confirm, admin/index, admin/show
resources/js/device-auth/         shared components, hooks, WebAuthn and HTTP helpers, types
```

They use plain Tailwind utilities (neutral palette with `dark:` variants), React and `@inertiajs/react` only. The browser's own WebAuthn API is used, so no npm WebAuthn package is needed.

### Page resolution

Pages are named `device-auth/verify`, `device-auth/confirm`, `device-auth/admin/index` and `device-auth/admin/show`. If your app resolves pages from `resources/js/pages` (the Laravel starter kits do), nothing else is needed. Otherwise publish the config and change the component names:

```bash
php artisan vendor:publish --tag=device-auth-react-config
```

```php
// config/device-auth-react.php
'pages' => [
    'verify' => 'auth/verify-device',
    // ...
],
```

### Layout

The verify and confirm pages draw their own full-screen layout. If your `createInertiaApp` assigns a default layout, exclude them:

```tsx
layout: (name) => {
    if (name === 'device-auth/verify' || name === 'device-auth/confirm') return null;
    // ...your existing rules
},
```

## Using it in your own pages

Every Inertia page receives `props.deviceAuth` (or `null` for guests):

```tsx
import { useDeviceAuth, ConfirmsDevice, DeviceConfirmPrompt } from '@/device-auth';

const deviceAuth = useDeviceAuth();
deviceAuth?.device?.name;        // the device this session verified with
deviceAuth?.isAdmin;             // may review devices
deviceAuth?.pendingCount;        // requests waiting (admins only)
```

- `<ConfirmsDevice>` / `useDeviceConfirmation()` ask the device to confirm before a sensitive action, the device version of `password.confirm`. Routes behind the `device.confirm` middleware need it.
- `<DeviceConfirmPrompt />` opens the confirmation dialog automatically when the server redirected back because confirmation was required.

The prop name is configurable (`shared_prop` in `config/device-auth-react.php`; `null` shares nothing). The shape is the core's `DeviceAuthState` (see `resources/js/device-auth/types.ts`).

## Customizing

| What | How |
|---|---|
| Markup, copy, styling | Edit the published files in `resources/js/pages/device-auth` and `resources/js/device-auth` |
| Component names / location | `pages` in `config/device-auth-react.php` |
| Behaviour (validation, approval rules, notifications) | The core's published actions in `app/Actions/DeviceAuth` |
| A page rendered differently | Call `DeviceAuth::verifyView(fn (Request $request, VerifyPageData $data) => ...)` (and `confirmView`, `deviceIndexView`, `deviceShowView`) in your own service provider; it runs after this package's provider |

### Publish tags

| Tag | Files |
|---|---|
| `device-auth-react` | `resources/js/pages/device-auth`, `resources/js/device-auth` |
| `device-auth-react-config` | `config/device-auth-react.php` |

`php artisan device-auth:react-install --force` republishes both, overwriting your copies (useful after upgrading if you haven't edited them).

## Development

```bash
composer install
composer test          # pint --test, rector --dry-run, phpstan (level 7), phpunit
composer lint          # fix code style
composer refactor      # apply rector

npm install
npm run types          # tsc --noEmit (strict, noUncheckedIndexedAccess)
npm run format         # prettier
```

During development the core is linked from `../laravel-device-auth` through a Composer path repository.

### Developing against a local core

The package installs `abdulwahhabkhan/device-auth` from Packagist. To work on both side by side, point Composer at your checkout (don't commit this):

```bash
composer config repositories.core '{"type": "path", "url": "../laravel-device-auth", "options": {"versions": {"abdulwahhabkhan/device-auth": "0.2.0"}}}'
composer update abdulwahhabkhan/device-auth
```

## License

MIT. See [LICENSE](LICENSE).
