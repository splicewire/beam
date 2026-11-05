import {
    configureEntryPage, entryPageConfig, registerLayout, resolveLayout, type ChromeComponent,
} from '@splicewire/beam-ux/docs';
import { initializeTheme } from '@splicewire/beam-ux/appearance';
import {
    Callout, Card, CardGrid, DoctorOutput, Figure, FileTree, SectionLanding, Step, Steps, Terminal,
} from '@splicewire/beam-mdx/kit';
import { ApiReference, type ApiReferenceFactory, type ApiReferenceLoader } from './ApiReference.js';
import { DataExample } from './DataExample.js';
import { DocsLayout } from './DocsLayout.js';
import { RegistryRegistrants } from './RegistryRegistrants.js';
import { setDocsConfiguration } from './config.js';
import type { DocsTransport } from './publications.js';
import type { RealmNavKinds } from '@splicewire/beam-ux/nav';

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
    /** Base of the registry routes the registrant panel reads (`{base}/{root}/registrants`). Null turns the panel off. */
    registriesEndpoint?: string | null;
    /**
     * The docs rail's `kind → component` map (docs-feedback ticket 07), merged over the packaged one
     * (`beam-docs/registry-index` → `RegistryIndexNav`). A host entry wins, so a host can redraw a packaged kind.
     */
    navKinds?: RealmNavKinds;
    /** How a rail widget navigates (the registry index's search): e.g. Inertia's `router.visit`. Default: a full load. */
    navigate?: (href: string) => void;
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
        registriesEndpoint: options.registriesEndpoint === undefined ? '/beam/docs/registries' : options.registriesEndpoint,
        createApiReference: options.createApiReference,
        loadApiReference: options.loadApiReference,
        transport: options.transport,
        navKinds: options.navKinds,
        navigate: options.navigate,
    });
    if (options.layout || !resolveLayout('DocsLayout')) {
        registerLayout('DocsLayout', options.layout ?? DocsLayout);
    }
    // The guide kit a docs body is authored against, contributed like ApiReference so no host re-types it (D-A4 §1,
    // DOCS-12). Host entries come last and win. The kit's stylesheet stays the host's import (`@splicewire/beam-mdx/kit/css`).
    const kit = { Figure, FileTree, Terminal, Callout, Steps, Step, DoctorOutput, SectionLanding, CardGrid, Card };
    // The registry pages' registrant panel (`<RegistryRegistrants root="…" />`, registry-docs) and their captured data
    // examples (`<DataExample source="…">`, docs-feedback ticket 09), contributed the same way.
    configureEntryPage({ components: { ApiReference, RegistryRegistrants, DataExample, ...kit, ...entryPageConfig().components } });
}
