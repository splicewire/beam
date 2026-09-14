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
    const fetcher = transport ?? docsConfiguration().transport ?? fetchDocs;
    const client = useMemo(() => createDocsPublicationsClient(endpoint, fetcher), [endpoint, fetcher]);
    const inputId = useId();
    const [version, setVersion] = useState<PublishInputData['version']>('');
    const [attempts, setAttempts] = useState<PublicationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);
    const [announcement, setAnnouncement] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [reload, setReload] = useState(0);
    const request = useRef<AbortController | null>(null);

    useEffect(() => {
        request.current?.abort();
        request.current = null;
        setAttempts([]);
        setActionError(null);
        setAnnouncement('');
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
            let failure: string | null = null;
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
            setActionError('Enter a release version.');
            return;
        }
        const controller = new AbortController();
        request.current = controller;
        setSubmitting(true);
        setActionError(null);
        setAnnouncement('');
        try {
            const row = retry ? await client.retry(retry.id, controller.signal)
                : await client.publish(release, controller.signal);
            if (controller.signal.aborted) return;
            setAttempts((current) => mergeAttempts(current, [row]));
            setAnnouncement(`Publication ${row.status} for ${row.version}.`);
            if (!retry) setVersion('');
        } catch (error) {
            if (!controller.signal.aborted) setActionError(publicationRequestMessage(error));
        } finally {
            if (request.current === controller) request.current = null;
            if (!controller.signal.aborted) setSubmitting(false);
        }
    };

    return (
        <section className={['beam-docs-publishing', className].filter(Boolean).join(' ')} aria-label="Documentation publishing">
            <style>{PUBLISHING_CSS}</style>
            <div className="beam-docs-publish-form">
                <h2>Publish a release</h2>
                <p className="beam-docs-help">Publish the current API specification to Scalar Registry under a release version.</p>
                <SchemaForm
                    idPrefix={inputId}
                    className="beam-docs-publish-controls"
                    schema={publishInputSchema}
                    formData={{ version }}
                    uiSchema={{ version: { 'ui:placeholder': 'e.g. v1.2.0', 'ui:autocomplete': 'off' } }}
                    templates={{ ObjectFieldTemplate: PublishFields }}
                    disabled={submitting}
                    showErrorList={false}
                    noHtml5Validate
                    transformErrors={(errors) => errors.map((error) => error.name === 'pattern'
                        ? { ...error, message: 'Enter a release version such as v1.2.3 or 1.2.3+build.4.' }
                        : error)}
                    onChange={({ formData }) => setVersion(String(formData.version ?? '').trim())}
                    onSubmit={() => void submit()}
                >
                    <button type="submit" disabled={submitting || !version.trim()}>
                        {submitting ? 'Submitting…' : 'Publish release'}
                    </button>
                </SchemaForm>
                <p className="beam-docs-help">Existing Registry versions are never overwritten.</p>
                {actionError && <p role="alert" className="beam-docs-error">{actionError}</p>}
                <p role="status" className="beam-docs-announcement">{announcement}</p>
            </div>

            <div className="beam-docs-attempts-heading">
                <h2>Recent publications</h2>
                <button type="button" className="beam-docs-secondary" disabled={loading} onClick={() => setReload((value) => value + 1)}>
                    {loading ? 'Refreshing…' : 'Refresh status'}
                </button>
            </div>
            {loadError && <p role="alert" className="beam-docs-error">{loadError}</p>}
            {loading && attempts.length === 0 && <p role="status">Loading publications…</p>}
            {!loading && !loadError && attempts.length === 0 && (
                <p className="beam-docs-empty">No releases have been published yet. Enter a version to publish the first one.</p>
            )}
            <ol className="beam-docs-attempts" aria-label="Publication attempts" aria-live="polite">
                {attempts.map((attempt) => {
                    const registryUrl = attempt.status === 'succeeded' ? scalarRegistryUrl(attempt.registryUrl) : null;
                    return (
                        <li key={attempt.id} className="beam-docs-attempt" data-publication-id={attempt.id}>
                            <div className="beam-docs-attempt-summary">
                                <h3>{attempt.version}</h3>
                                <p className="beam-docs-help">{attempt.namespace} / {attempt.slug}</p>
                                <p className="beam-docs-attempt-meta">
                                    <span>{attempt.isPrivate ? 'Private' : 'Public'}</span>
                                    {attempt.createdAt && <time dateTime={attempt.createdAt}>{formatDate(attempt.createdAt)}</time>}
                                    <code title={`SHA-256: ${attempt.sha256}`}>{attempt.sha256.slice(0, 12)}</code>
                                </p>
                            </div>
                            <div className="beam-docs-attempt-actions">
                                <span className="beam-docs-attempt-status" data-status={attempt.status}>{attempt.status}</span>
                                {registryUrl && <a href={registryUrl} target="_blank" rel="noopener noreferrer">View in Scalar Registry</a>}
                                {attempt.status === 'failed' && (
                                    <button type="button" className="beam-docs-secondary" disabled={submitting}
                                        aria-label={`Retry ${attempt.version}`} onClick={() => void submit(attempt)}>Retry publication</button>
                                )}
                            </div>
                            {attempt.status === 'failed' && (
                                <div className="beam-docs-attempt-error">
                                    <p>{attempt.error?.slice(0, 2000) || 'The publication failed. Check the publishing service before retrying.'}</p>
                                    <p className="beam-docs-help">Retry uses the same captured specification and destination.</p>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

function formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
