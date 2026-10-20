import * as react from 'react';
import { ComponentType } from 'react';
import { d as DocsPublishingPageData } from './types-BXgjOBm9.js';

type DocsPublishingPageProps = Partial<DocsPublishingPageData>;
declare function DocsPublishingPage({ publicationsEndpoint, docsUrl }: DocsPublishingPageProps): react.JSX.Element;

declare const beamDocsPages: Record<string, () => Promise<{
    default: ComponentType;
}>>;

export { DocsPublishingPage, type DocsPublishingPageProps, beamDocsPages };
