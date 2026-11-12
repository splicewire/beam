import * as react from 'react';
import { ComponentType } from 'react';
import { o as DocsPublishingPageData } from './types-D7hlpol3.js';

type DocsPublishingPageProps = Partial<DocsPublishingPageData>;
declare function DocsPublishingPage({ publicationsEndpoint, docsUrl }: DocsPublishingPageProps): react.JSX.Element;

declare const beamDocsPages: Record<string, () => Promise<{
    default: ComponentType;
}>>;

export { DocsPublishingPage, type DocsPublishingPageProps, beamDocsPages };
