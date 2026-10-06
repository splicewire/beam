import {
    configureEntryPage, entryPageConfig, registerLayout, resolveLayout, type ChromeComponent,
} from '@splicewire/beam-ux/docs';
import {
    Callout, Card, CardGrid, DoctorOutput, Figure, FileTree, SectionLanding, Step, Steps, Terminal,
} from '@splicewire/beam-mdx/kit';
import { ApiReference } from './ApiReference.js';
import { DocsLayout } from './DocsLayout.js';
import { setDocsConfiguration } from './config.js';
import type { DocsTransport } from './publications.js';

export type DocsConfig = {
    /** Set null to disable Registry-link requests. Server policy still decides whether to return a link. */
    registryLinkEndpoint?: string | null;
    transport?: DocsTransport;
    layout?: ChromeComponent;
};

/** Call after host entry-page configuration. Explicit invocation survives tree shaking. */
export function configureDocs(options: DocsConfig = {}): void {
    setDocsConfiguration({
        registryLinkEndpoint: options.registryLinkEndpoint === undefined
            ? '/beam/docs/registry-link' : options.registryLinkEndpoint,
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
