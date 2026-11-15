import { Button } from '@schemastud/ui';
import type { StripLabels, StripTake } from './types.js';

/** "just now", "3m ago", "2h ago", then a short date: the wording Studio's takes list uses. */
export function relativeWhen(iso: string | null, now: number = Date.now()): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const minutes = Math.round((now - then) / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export interface TakesStripProps {
    takes: StripTake[] | undefined;
    labels: StripLabels;
    /** The takes are loading. */
    pending?: boolean;
    /** The read failed: shown in place of the list, in the host's words. */
    error?: string | null;
    /** An action is out (or the node is held): no other one can start. */
    busy?: boolean;
    /** An action failed, in the host's words. */
    actionError?: string | null;
    onRevert?: (take: StripTake) => void;
    onKeep?: (take: StripTake) => void;
    className?: string;
}

/**
 * The takes of one node, newest first, drawn from the host's view model (node-actions-and-takes 06): what produced
 * each, when, an excerpt, a player for a rendered result, what steered it (or that nothing was recorded), and the
 * actions the host allows. It reads nothing and decides nothing: the host maps the shared take read to
 * {@link StripTake} and performs the actions.
 */
export function TakesStrip({ takes, labels, pending = false, error = null, busy = false, actionError = null, onRevert, onKeep, className }: TakesStripProps) {
    return (
        <section aria-label={labels.region} data-takes-strip="" className={className}>
            <div data-takes-strip-header="" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.75rem' }}>
                <h4>{labels.heading ?? 'Takes'}</h4>
                {labels.note ? <span data-takes-strip-note="">{labels.note}</span> : null}
            </div>
            {pending ? <p role="status">{labels.loading ?? 'Loading takes…'}</p> : null}
            {error ? <p role="alert">{error}</p> : null}
            {!pending && !error && takes?.length === 0 ? <p data-takes-strip-empty="">{labels.empty}</p> : null}
            {!error && takes && takes.length > 0 ? (
                <ol data-takes-strip-list="">
                    {takes.map((take) => (
                        <li key={take.key} data-take-kind={take.kind}>
                            <div style={{ minWidth: 0, flex: 1 }}>
                                <p data-take-title="">
                                    {take.title}
                                    {take.at ? <span data-take-when=""> · {relativeWhen(take.at)}</span> : null}
                                </p>
                                {take.excerpt ? <p data-take-excerpt="">{take.excerpt}</p> : null}
                                {take.audition ? <Audition {...take.audition} title={take.title} /> : null}
                                {take.fingerprint && take.fingerprint.length > 0 ? (
                                    <ul aria-label="What steered it" data-take-fingerprint="">
                                        {take.fingerprint.map((entry) => (
                                            <li key={entry.label}>
                                                {entry.label}: {entry.value}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p data-take-no-fingerprint="">{labels.noFingerprint ?? 'Steering not recorded'}</p>
                                )}
                            </div>
                            {take.canRevert && onRevert ? (
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => onRevert(take)}>
                                    {labels.revert ?? 'Use this take'}
                                </Button>
                            ) : null}
                            {take.canKeep && onKeep ? (
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => onKeep(take)}>
                                    {labels.keep ?? 'Keep this take'}
                                </Button>
                            ) : null}
                        </li>
                    ))}
                </ol>
            ) : null}
            {actionError ? <p role="alert">{actionError}</p> : null}
        </section>
    );
}

/** A native player for a rendered result: audition only, no transport of the strip's own. */
function Audition({ url, medium, title }: { url: string; medium: 'audio' | 'video' | 'image'; title: string }) {
    if (medium === 'audio') return <audio controls preload="none" src={url} aria-label={`Play ${title}`} />;
    if (medium === 'video') return <video controls preload="none" src={url} aria-label={`Play ${title}`} />;
    return <img src={url} alt={title} />;
}
