# @splicewire/beam-docs

Optional documentation presentation and Scalar publication controls for `splicewire/laravel-beam-docs`.
Generic entries, chrome registration and prose remain in `@splicewire/beam-ux`.

Call `configureDocs()` after the host configures its entry page. It registers `DocsLayout` and
`ApiReference`, preserving an existing host layout or themed Scalar wrapper. The call is explicit
so it survives tree shaking.

```tsx
import { configureDocs } from '@splicewire/beam-docs';
import { beamDocsPages } from '@splicewire/beam-docs/pages';

const options = beamInertiaOptions({ pages: { ...beamDocsPages, ...ownPages } });
configureDocs();
createInertiaApp(options);
```

The page map exposes `beam-docs/publishing`, with server props `publicationsEndpoint` and optional
`docsUrl`. The host applies its operator layout and the server authorizes the route. A host can also
embed `DocsPublishingPanel` in an existing authorized operator page.

`ApiReference` retains `createApiReference`, `scriptUrl`, theme CSS and renderer configuration.
Update imports from `@splicewire/beam-ux/site` to `@splicewire/beam-docs`. `DocsLayout` and
`DOCS_LAYOUT_CSS` also move here; other exports from `@splicewire/beam-ux/docs` stay in place.

Standalone `ApiReference` makes no Registry-link request. `configureDocs()` enables
`/beam/docs/registry-link`; that server endpoint returns `{ data: { url: string | null } }` according
to successful publication and current display/access policy. Set `registryLinkEndpoint: null` to
disable discovery. An explicit `registryUrl` prop overrides discovery; `null` hides the link.
Only HTTPS links on `registry.scalar.com` are rendered.

The publishing panel reads `/beam/docs/publications`, submits `{ version }`, polls active attempts,
and retries a failed attempt through `/{id}/retry`. It retains previous successes. Destination,
visibility and immutable artifact selection belong to the server.

All requests accept an injected `DocsTransport`, either through component props or
`configureDocs({ transport })`. It receives `(url, RequestInit)` and returns decoded JSON with the
server's `{ data: ... }` envelope. The default transport sends same-origin credentials and Laravel's
XSRF cookie or CSRF meta token. It never exposes raw HTTP error bodies. Publication error messages
must already be sanitized by the server.

```tsx
<DocsPublishingPanel endpoint="/beam/docs/publications" transport={hostJsonTransport} />
```

Run `npm run test --workspace @splicewire/beam-docs`, `npm run typecheck --workspace
@splicewire/beam-docs`, and `npm run build --workspace @splicewire/beam-docs` from the workspace root.
The build also compiles a consumer fixture against the emitted Docs page map and the published
Inertia 0.1.2 contract. Its pinned development alias keeps later workspace changes out of that check.

## Generated contracts

The publishing form uses `@schemastud/seam`'s `SchemaForm` with the PHP `PublishInputData` schema. Types and publication response validation also consume the committed producer output under `src/generated`; do not edit that directory by hand.

With `splicewire/laravel-beam-docs` development dependencies installed, point the wrapper at its package runner (or a prepared host's `artisan`):

```sh
export BEAM_DOCS_ARTISAN="$HOME/Workspaces/php/packages/splicewire/laravel-beam-docs/vendor/bin/testbench"
npm run contracts:generate --workspace @splicewire/beam-docs -- --write
npm run contracts:check --workspace @splicewire/beam-docs
```

`BEAM_DOCS_PHP` optionally selects a PHP executable. Generation without `--write` only prints the proposed artifacts. The check calls the producer without writing and compares exact bytes; missing producer configuration, missing artifacts and stale artifacts all fail. Both `test` and `prepublishOnly` run this check, so CI and publishing must install the matching PHP package revision and set the producer path.
