import type { ReactNode } from 'react';
import { messageOf, pageStateOf, transportOf, type QueryLike } from './page-state.js';

/**
 * An optional escape from a refusal (APP-9 "with a way back"): a labeled link to somewhere the reader can
 * still go. Every refusal/failure state renders it when given — forbidden, not-found, and the error
 * fallback (beside "Try again") — so none is a dead end. A plain anchor: `@splicewire/beam-ux/state` is
 * framework-agnostic, so the host router owns navigation; `target` is an in-app path or a URL.
 */
export type WayBack = {
    label: string;
    target: string;
    /** Render the link through the host's router (e.g. react-router's `<Link>`) so the way back navigates
     *  without a full page reload. Receives the resolved `target`/`className`/`children`; when omitted it is a
     *  plain `<a href={target}>` (beam-ux stays framework-agnostic). */
    render?: (props: { target: string; className: string; children: ReactNode }) => ReactNode;
};

const WAY_BACK_CLASS = 'mt-3 inline-flex font-medium underline';

function WayBackLink({ wayBack }: { wayBack: WayBack }) {
    const props = { target: wayBack.target, className: WAY_BACK_CLASS, children: wayBack.label };
    if (wayBack.render) {
        return <>{wayBack.render(props)}</>;
    }
    return (
        <a href={props.target} className={props.className}>
            {props.children}
        </a>
    );
}

/**
 * The shared forbidden page state (APP-8), as a standalone node that owns its `data-page-state="forbidden"`
 * marker. Exported so a KNOWN refusal with no query behind it — a manifest leaf the actor isn't admitted to —
 * renders the refusal directly instead of faking a 403 query. `StateBoundary` renders it for a 401/403 read.
 */
export function ForbiddenState({ label, wayBack }: { label: string; wayBack?: WayBack }) {
    return (
        <div role="alert" data-page-state="forbidden" className="p-6 text-sm">
            <p className="font-medium">You don't have access to {label}.</p>
            <p className="text-muted-foreground">An owner or admin of this workspace can grant it.</p>
            {wayBack && <WayBackLink wayBack={wayBack} />}
        </div>
    );
}

type Props = {
    /** The read this region renders. */
    query: QueryLike;
    /** The object, as the page names it ("agents", "this calendar"), so a refusal says what was refused. */
    label: string;
    /** An empty result under an active filter may say "No … match these filters". */
    filtered?: boolean;
    /** Offered as "Try again" only after a 5xx or a network failure (APP-8: no 4xx is retried). */
    onRetry?: () => void;
    /** What the region shows for a 402 gate denial (an upsell). */
    upsell?: ReactNode;
    /** An optional way back offered by every refusal/failure state (forbidden, not-found, error) — no dead end. */
    wayBack?: WayBack;
    children: ReactNode;
};

/**
 * M12's region boundary (app-walkthrough APP-8, APP-9): the region is in exactly one page state, exposed as
 * `data-page-state`, derived only by {@see pageStateOf}. The children render only when the read answered (`ready` or
 * `empty`; the page draws its own empty line). A refusal names the object and offers no "Try again"; where the page
 * supplies a `wayBack`, every refusal/failure state offers it so the reader is never stranded (APP-9).
 */
export function StateBoundary({ query, label, filtered, onRetry, upsell, wayBack, children }: Props) {
    const { state, retry } = pageStateOf(transportOf(query, filtered === undefined ? {} : { filtered }));

    // The forbidden node owns its own `data-page-state`, so it is the whole region (not wrapped again).
    if (state === 'forbidden') {
        return <ForbiddenState label={label} wayBack={wayBack} />;
    }

    let body: ReactNode;
    switch (state) {
        case 'ready':
        case 'empty':
            body = children;
            break;
        case 'loading':
            body = <p aria-busy="true" className="p-6 text-sm text-muted-foreground">Loading {label}…</p>;
            break;
        case 'not-found':
            body = (
                <div role="alert" className="p-6 text-sm">
                    <p>We couldn't find {label}.</p>
                    {wayBack && <WayBackLink wayBack={wayBack} />}
                </div>
            );
            break;
        case 'upsell':
            // A consumer-supplied upsell owns its own affordances; the default copy was a dead end, so it
            // carries the way back when the page supplies one.
            body = upsell ?? (
                <div role="alert" className="p-6 text-sm">
                    <p>{label} isn't included in this plan.</p>
                    {wayBack && <WayBackLink wayBack={wayBack} />}
                </div>
            );
            break;
        default:
            body = (
                <div role="alert" className="p-6 text-sm">
                    <p>{messageOf(query.error) ?? `${label[0]?.toUpperCase() ?? ''}${label.slice(1)} couldn't load.`}</p>
                    {retry === 'bounded' && onRetry && (
                        <button type="button" className="mt-2 underline" onClick={onRetry}>
                            Try again
                        </button>
                    )}
                    {wayBack && <WayBackLink wayBack={wayBack} />}
                </div>
            );
    }

    return <div data-page-state={state}>{body}</div>;
}
