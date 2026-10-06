import {
    configureEntryPage, entryPageConfig, registerLayout, resolveLayout, type ChromeComponent,
} from '@splicewire/beam-ux/docs';
import { initializeTheme } from '@splicewire/beam-ux/appearance';
import {
    Callout, Card, CardGrid, DoctorOutput, Figure, FileTree, SectionLanding, Step, Steps, Terminal,
} from '@splicewire/beam-mdx/kit';
import { ApiReference, type ApiReferenceFactory, type ApiReferenceLoader } from './ApiReference.js';
import { DocsLayout } from './DocsLayout.js';
import { setDocsConfiguration } from './config.js';
import type { DocsTransport } from './publications.js';

export type DocsConfig = {
    /** Set null to disable Registry-link requests. Server policy still decides whether to return a link. */
    registryLinkEndpoint?: string | null;
    transport?: DocsTransport;
    layout?: ChromeComponent;
    /** `docs.search` (DOCS-14, DM6). Null turns the packaged header's search box off; a host `search` slot replaces it. */
    searchEndpoint?: string | null;
    /** The host's ONE Scalar lever (DM5): a factory, or a lazy loader (e.g. the flagship's code-split patched build). */
    createApiReference?: ApiReferenceFactory;
    loadApiReference?: ApiReferenceLoader;
};

/** Call after host entry-page configuration. Explicit invocation survives tree shaking. */
export function configureDocs(options: DocsConfig = {}): void {
    // The ONE appearance (DM5): applied at boot from the stored choice, so a host with no controller of its own (the
    // flagship's docs bundle) follows it too. Idempotent with a host that also initializes it (beam-inertia).
    initializeTheme();
    setDocsConfiguration({
        registryLinkEndpoint: options.registryLinkEndpoint === undefined
            ? '/beam/docs/registry-link' : options.registryLinkEndpoint,
        searchEndpoint: options.searchEndpoint === undefined ? '/beam/docs/search' : options.searchEndpoint,
        createApiReference: options.createApiReference,
        loadApiReference: options.loadApiReference,
        transport: options.transport,
    });
    if (options.layout || !resolveLayout('DocsLayout')) {
        registerLayout('DocsLayout', options.layout ?? DocsLayout);
    }
    // The guide kit a docs body is authored against, contributed like ApiReference so no host re-types it (D-A4 §1,
    // DOCS-12). Host entries come last and win. The kit's stylesheet stays the host's import (`@splicewire/beam-mdx/kit/css`).
    const kit = { Figure, FileTree, Terminal, Callout, Steps, Step, DoctorOutput, SectionLanding, CardGrid, Card };
    configureEntryPage({ components: { ApiReference, ...kit, ...entryPageConfig().components } });
}
