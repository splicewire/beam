import type { DocsTransport } from './publications.js';

type DocsConfiguration = {
    registryLinkEndpoint: string | null;
    /** `docs.search` (DOCS-14); null turns the packaged header's search box off. */
    searchEndpoint?: string | null;
    transport?: DocsTransport;
};
let configuration: DocsConfiguration = { registryLinkEndpoint: null, searchEndpoint: null };

export function docsConfiguration(): DocsConfiguration {
    return configuration;
}

export function setDocsConfiguration(next: DocsConfiguration): void {
    configuration = next;
}
