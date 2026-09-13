# @splicewire/beam-inertia

The default Beam application for Laravel Inertia hosts: public entry pages, Fortify authentication,
account/settings pages, the resource console, operator dashboard, desktop and visual editor.
The page implementations and their shared chrome remain in this package; installation does not publish them.
It composes the portable Beam packages through an explicit Inertia dependency. `beam-ux` stays router-free.

```tsx
import { createInertiaApp } from '@inertiajs/react';
import { beamInertiaOptions, authFeaturesFrom, type PageModule } from '@splicewire/beam-inertia';

createInertiaApp(beamInertiaOptions({
    name: 'Example',
    pages: import.meta.glob<PageModule>('./pages/**/*.tsx'),
    features: authFeaturesFrom(['registration', 'email-verification', '2fa', 'passkeys', 'password-confirmation']),
}));
```

The optional `logo` component belongs to the host. CSS variables and server-shared theme props retain their
existing meanings. `development` is supplied by the host; no Vite-specific APIs occur in the package.

To override a default, create `resources/js/pages/<name>.tsx`. The host glob wins over the package map.
This also applies to auth islands and dashboard/account pages opened in desktop windows. An unknown or
feature-disabled page reports an explicit error. Feature configuration controls client affordances;
Fortify/server authorization remains the authority for every request.

The default transport uses the Beam starter's mounted same-origin endpoints. Hosts mounting entry operations
elsewhere can inject `entryClient`. The adapter's PHP page contracts are generated from
`Splicewire\Beam\Accounts\Data\Pages` into `@splicewire/beam-resources/types/accounts-pages`.

Scaffolding selects auth features by editing the host configuration and server configuration. It never edits
files inside this package or requires host copies of the forms. The package retains the feature code so another
host can select a different combination using the same installed version.

Run `npm run lint:imports`, `npm run typecheck`, `npm test`, and `npm run build` from this package.
A host must additionally build its actual application and exercise direct routes, authoring and authentication.

## Optional zero-prop desktop

`DefaultOsDesktop` is the optional manifest-driven desktop adapter, separate from the default `/os`
page and operator overlay. Import it and `DefaultOsDesktopProps` from `@splicewire/beam-inertia`
(previously exported from `@splicewire/beam-ux/shell`). It reads the current Inertia realm manifest,
opens the first three unlocked apps, and supplies Inertia navigation/error links to the portable
realm/window helpers. Its existing surfaceMap, exclude, brand, status, backdrop, onNavigate and
chrome overrides remain available.
