import type { DocsTransport } from './publications.js';

type DocsConfiguration = { registryLinkEndpoint: string | null; transport?: DocsTransport };
let configuration: DocsConfiguration = { registryLinkEndpoint: null };

export function docsConfiguration(): DocsConfiguration {
    return configuration;
}

export function setDocsConfiguration(next: DocsConfiguration): void {
    configuration = next;
}
