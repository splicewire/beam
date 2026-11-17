import { SchemaForm } from '@schemastud/seam';
import type { ObjectFieldTemplateProps } from '@rjsf/utils';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { docsConfiguration } from './config.js';
import {
    createDocsPublicationsClient, fetchDocs, publicationRequestMessage, scalarRegistryUrl,
    type DocsTransport, type PublicationData, type PublishInputData,
} from './publications.js';
import { PUBLISHING_CSS } from './publishing-css.js';
import publishInputSchema from './generated/publish-input.schema.json';
import { notice, say, type Notice } from './message-descriptor.js';
import { useBeamDocsMessages } from './messages.js';

export type DocsPublishingPanelProps = {
    endpoint?: string;
    transport?: DocsTransport;
    pollIntervalMs?: number;
    className?: string;
};

const active = (attempt: PublicationData) => attempt.status === 'queued' || attempt.status === 'running';

function mergeAttempts(current: PublicationData[], incoming: PublicationData[]): PublicationData[] {
    const rows = new Map(current.map((row) => [row.id, row]));
    for (const row of incoming) {
        const previous = rows.get(row.id);
        // An older list response cannot regress a terminal attempt or put a running job back in queue.
        if (previous && (!active(previous) || (previous.status === 'running' && row.status === 'queued'))) continue;
        rows.set(row.id, row);
    }
    return [...rows.values()].sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '') || b.id.localeCompare(a.id));
}

function PublishFields({ properties }: ObjectFieldTemplateProps) {
    return <div className="beam-docs-version-field">{properties.map((property) => property.content)}</div>;
}

/** Mount only for an authorized operator; the server independently authorizes every request. */
export function DocsPublishingPanel({
    endpoint = '/beam/docs/publications', transport, pollIntervalMs = 2000, className,
}: DocsPublishingPanelProps) {
    const m = useBeamDocsMessages();
    const fetcher = transport ?? docsConfiguration().transport ?? fetchDocs;
    const client = useMemo(() => createDocsPublicationsClient(endpoint, fetcher), [endpoint, fetcher]);
    const inputId = useId();
    const [version, setVersion] = useState<PublishInputData['version']>('');
    const [attempts, setAttempts] = useState<PublicationData[]>([]);
    const [loading, setLoading] = useState(true);
    // Errors and the live announcement are kept as notices (catalog keys with their data) and translated where they
    // render, so a live locale switch re-renders them; never a translated string in state.
    const [loadError, setLoadError] = useState<Notice | null>(null);
    const [actionError, setActionError] = useState<Notice | null>(null);
    const [announcement, setAnnouncement] = useState<Notice | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [reload, setReload] = useState(0);
    const request = useRef<AbortController | null>(null);

    useEffect(() => {
        request.current?.abort();
        request.current = null;
        setAttempts([]);
        setActionError(null);
        setAnnouncement(null);
        setSubmitting(false);
    }, [client]);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadError(null);
        client.list(controller.signal)
            .then((rows) => {
                if (!controller.signal.aborted) setAttempts((current) => mergeAttempts(current, rows));
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted) setLoadError(publicationRequestMessage(error));
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [client, reload]);

    useEffect(() => () => request.current?.abort(), []);

    useEffect(() => {
        const pending = attempts.filter(active);
        if (pending.length === 0) return;
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        const delay = Math.max(250, pollIntervalMs);
        const poll = async () => {
            const results = await Promise.allSettled(pending.map((row) => client.get(row.id, controller.signal)));
            if (controller.signal.aborted) return;
            const updates: PublicationData[] = [];
            let failure: Notice | null = null;
            for (const result of results) {
                if (result.status === 'fulfilled') updates.push(result.value);
                else failure = publicationRequestMessage(result.reason);
            }
            setLoadError(failure);
            if (updates.length) setAttempts((current) => mergeAttempts(current, updates));
            timer = setTimeout(poll, delay);
        };
        timer = setTimeout(poll, delay);
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [attempts, client, pollIntervalMs]);

    const submit = async (retry?: PublicationData) => {
        if (request.current) return;
        const release = version.trim();
        if (!retry && release === '') {
            setActionError(notice('splicewire-beam-docs::messages.publish_version_required'));
            return;
        }
        const controller = new AbortController();
        request.current = controller;
        setSubmitting(true);
        setActionError(null);
        setAnnouncement(null);
        try {
            const row = retry ? await client.retry(retry.id, controller.signal)
                : await client.publish(release, controller.signal);
            if (controller.signal.aborted) return;
            setAttempts((current) => mergeAttempts(current, [row]));
            // The status and version are the server's values, passed as data into the translated sentence.
            setAnnouncement(notice('splicewire-beam-docs::messages.publish_announcement', { status: row.status, version: row.version }));
            if (!retry) setVersion('');
        } catch (error) {
            if (!controller.signal.aborted) setActionError(publicationRequestMessage(error));
        } finally {
            if (request.current === controller) request.current = null;
            if (!controller.signal.aborted) setSubmitting(false);
        }
    };

    return (
        <section className={['beam-docs-publishing', className].filter(Boolean).join(' ')} aria-label={m.t('splicewire-beam-docs::messages.publishing_title')}>
            <style>{PUBLISHING_CSS}</style>
            <div className="beam-docs-publish-form">
                <h2>{m.t('splicewire-beam-docs::messages.publish_heading')}</h2>
                <p className="beam-docs-help">{m.t('splicewire-beam-docs::messages.publish_help')}</p>
                <SchemaForm
                    idPrefix={inputId}
                    className="beam-docs-publish-controls"
                    schema={publishInputSchema}
                    formData={{ version }}
                    // The field's label is the generated schema's title ("Release version"); it reads the seam here, via ui:title, so
                    // src/generated stays the producer's.
                    uiSchema={{
                        version: {
                            'ui:title': m.t('splicewire-beam-docs::messages.publish_version_label'),
                            'ui:placeholder': m.t('splicewire-beam-docs::messages.publish_placeholder'),
                            'ui:autocomplete': 'off',
                        },
                    }}
                    templates={{ ObjectFieldTemplate: PublishFields }}
                    disabled={submitting}
                    showErrorList={false}
                    noHtml5Validate
                    // The pattern's own line is ours; every other validator message renders as the validator gave it.
                    transformErrors={(errors) => errors.map((error) => error.name === 'pattern'
                        ? { ...error, message: m.t('splicewire-beam-docs::messages.publish_pattern_error') }
                        : error)}
                    onChange={({ formData }) => setVersion(String(formData.version ?? '').trim())}
                    onSubmit={() => void submit()}
                >
                    <button type="submit" disabled={submitting || !version.trim()}>
                        {m.t(submitting ? 'splicewire-beam-docs::messages.publish_submitting' : 'splicewire-beam-docs::messages.publish_submit')}
                    </button>
                </SchemaForm>
                <p className="beam-docs-help">{m.t('splicewire-beam-docs::messages.publish_no_overwrite')}</p>
                {actionError && <p role="alert" className="beam-docs-error">{say(m, actionError)}</p>}
                <p role="status" className="beam-docs-announcement">{announcement ? say(m, announcement) : ''}</p>
            </div>

            <div className="beam-docs-attempts-heading">
                <h2>{m.t('splicewire-beam-docs::messages.attempts_heading')}</h2>
                <button type="button" className="beam-docs-secondary" disabled={loading} onClick={() => setReload((value) => value + 1)}>
                    {m.t(loading ? 'splicewire-beam-docs::messages.attempts_refreshing' : 'splicewire-beam-docs::messages.attempts_refresh')}
                </button>
            </div>
            {loadError && <p role="alert" className="beam-docs-error">{say(m, loadError)}</p>}
            {loading && attempts.length === 0 && <p role="status">{m.t('splicewire-beam-docs::messages.attempts_loading')}</p>}
            {!loading && !loadError && attempts.length === 0 && (
                <p className="beam-docs-empty">{m.t('splicewire-beam-docs::messages.attempts_empty')}</p>
            )}
            <ol className="beam-docs-attempts" aria-label={m.t('splicewire-beam-docs::messages.attempts_list')} aria-live="polite">
                {attempts.map((attempt) => {
                    const registryUrl = attempt.status === 'succeeded' ? scalarRegistryUrl(attempt.registryUrl) : null;
                    return (
                        <li key={attempt.id} className="beam-docs-attempt" data-publication-id={attempt.id}>
                            <div className="beam-docs-attempt-summary">
                                <h3>{attempt.version}</h3>
                                <p className="beam-docs-help">{attempt.namespace} / {attempt.slug}</p>
                                <p className="beam-docs-attempt-meta">
                                    <span>{m.t(attempt.isPrivate ? 'splicewire-beam-docs::messages.attempt_private' : 'splicewire-beam-docs::messages.attempt_public')}</span>
                                    {attempt.createdAt && <time dateTime={attempt.createdAt}>{formatDate(attempt.createdAt)}</time>}
                                    <code title={m.t('splicewire-beam-docs::messages.attempt_sha', { sha: attempt.sha256 })}>{attempt.sha256.slice(0, 12)}</code>
                                </p>
                            </div>
                            <div className="beam-docs-attempt-actions">
                                {/* The status is the server's value and renders as given. */}
                                <span className="beam-docs-attempt-status" data-status={attempt.status}>{attempt.status}</span>
                                {registryUrl && (
                                    <a href={registryUrl} target="_blank" rel="noopener noreferrer">
                                        {m.t('splicewire-beam-docs::messages.attempt_registry_link')}
                                    </a>
                                )}
                                {attempt.status === 'failed' && (
                                    <button type="button" className="beam-docs-secondary" disabled={submitting}
                                        aria-label={m.t('splicewire-beam-docs::messages.attempt_retry_label', { version: attempt.version })}
                                        onClick={() => void submit(attempt)}>{m.t('splicewire-beam-docs::messages.attempt_retry')}</button>
                                )}
                            </div>
                            {attempt.status === 'failed' && (
                                <div className="beam-docs-attempt-error">
                                    {/* The server's own failure renders as it arrived; our line only when it sent none. */}
                                    <p>{attempt.error?.slice(0, 2000) || m.t('splicewire-beam-docs::messages.attempt_failed')}</p>
                                    <p className="beam-docs-help">{m.t('splicewire-beam-docs::messages.attempt_retry_help')}</p>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

/**
 * The attempt's time in the RUNTIME's locale, as before (beam-ux PreviewBar, beam-inertia's platform connection panel and
 * beam-accounts' tokens roster keep `toLocaleString()` too): moving dates to the catalog's locale is a fleet decision,
 * localization 29's nomination (c), not this sweep's. An unparseable value renders as given.
 */
function formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
