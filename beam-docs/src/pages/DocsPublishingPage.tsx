import { Head } from '@inertiajs/react';
import { DocsPublishingPanel } from '../DocsPublishingPanel.js';
import type { DocsPublishingPageData } from '../generated/types.js';

export type DocsPublishingPageProps = Partial<DocsPublishingPageData>;

export default function DocsPublishingPage({ publicationsEndpoint, docsUrl }: DocsPublishingPageProps) {
    const back = docsUrl?.startsWith('/') && !docsUrl.startsWith('//') ? docsUrl : null;
    return (
        <main className="beam-docs-publishing-page">
            <Head title="Documentation publishing" />
            <header>
                {back && <a className="beam-docs-back" href={back}>Back to documentation</a>}
                <h1>Documentation publishing</h1>
                <p>Publish a release to Scalar Registry and track each attempt.</p>
            </header>
            <DocsPublishingPanel endpoint={publicationsEndpoint} />
        </main>
    );
}
