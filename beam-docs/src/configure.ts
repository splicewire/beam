import {
    configureEntryPage, entryPageConfig, registerLayout, resolveLayout, type ChromeComponent,
} from '@splicewire/beam-ux/docs';
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
    configureEntryPage({ components: { ApiReference, ...entryPageConfig().components } });
}
