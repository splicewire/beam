import type { ApiReferenceFactory, ApiReferenceLoader } from './ApiReference.js';
import type { DocsTransport } from './publications.js';
import type { RealmNavKinds } from '@splicewire/beam-ux/nav';

type DocsConfiguration = {
    registryLinkEndpoint: string | null;
    /** Base of `beam/docs/registries/{root}/…` (registry-docs); null turns the registrant panel off. */
    registriesEndpoint?: string | null;
    /** `docs.search` (DOCS-14); null turns the packaged header's search box off. */
    searchEndpoint?: string | null;
    /** Which Scalar to run (DM5): a factory, or a lazy loader resolving one. Unset: the global, else the pinned CDN. */
    createApiReference?: ApiReferenceFactory;
    loadApiReference?: ApiReferenceLoader;
    transport?: DocsTransport;
    /** Extra rail kinds (docs-feedback ticket 07), merged over the packaged ones; a host entry wins. */
    navKinds?: RealmNavKinds;
    /** How a widget leaves the page for an href (the registry index's search). Unset: `window.location.assign`. */
    navigate?: (href: string) => void;
};
let configuration: DocsConfiguration = { registryLinkEndpoint: null, searchEndpoint: null };

export function docsConfiguration(): DocsConfiguration {
    return configuration;
}

export function setDocsConfiguration(next: DocsConfiguration): void {
    configuration = next;
}
