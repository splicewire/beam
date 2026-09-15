import type { ComponentType } from 'react';

export const beamDocsPages: Record<string, () => Promise<{ default: ComponentType }>> = {
    'beam-docs/publishing': () => import('./DocsPublishingPage.js'),
};

export { default as DocsPublishingPage, type DocsPublishingPageProps } from './DocsPublishingPage.js';
