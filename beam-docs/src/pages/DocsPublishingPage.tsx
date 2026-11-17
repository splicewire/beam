import { Head } from '@inertiajs/react';
import { DocsPublishingPanel } from '../DocsPublishingPanel.js';
import type { DocsPublishingPageData } from '../generated/types.js';
import { useBeamDocsMessages } from '../messages.js';

export type DocsPublishingPageProps = Partial<DocsPublishingPageData>;

export default function DocsPublishingPage({ publicationsEndpoint, docsUrl }: DocsPublishingPageProps) {
    const m = useBeamDocsMessages();
    const back = docsUrl?.startsWith('/') && !docsUrl.startsWith('//') ? docsUrl : null;
    return (
        <main className="beam-docs-publishing-page">
            <Head title={m.t('splicewire-beam-docs::messages.publishing_title')} />
            <header>
                {back && <a className="beam-docs-back" href={back}>{m.t('splicewire-beam-docs::messages.page_back')}</a>}
                <h1>{m.t('splicewire-beam-docs::messages.publishing_title')}</h1>
                <p>{m.t('splicewire-beam-docs::messages.page_lead')}</p>
            </header>
            <DocsPublishingPanel endpoint={publicationsEndpoint} />
        </main>
    );
}
