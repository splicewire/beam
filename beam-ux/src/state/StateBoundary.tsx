import type { ReactNode } from 'react';
import { messageOf, pageStateOf, transportOf, type QueryLike } from './page-state.js';

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
    children: ReactNode;
};

/**
 * M12's region boundary (app-walkthrough APP-8, APP-9): the region is in exactly one page state, exposed as
 * `data-page-state`, derived only by {@see pageStateOf}. The children render only when the read answered (`ready` or
 * `empty`; the page draws its own empty line). A refusal names the object and offers no "Try again".
 */
export function StateBoundary({ query, label, filtered, onRetry, upsell, children }: Props) {
    const { state, retry } = pageStateOf(transportOf(query, filtered === undefined ? {} : { filtered }));

    let body: ReactNode;
    switch (state) {
        case 'ready':
        case 'empty':
            body = children;
            break;
        case 'loading':
            body = <p aria-busy="true" className="p-6 text-sm text-muted-foreground">Loading {label}…</p>;
            break;
        case 'forbidden':
            body = (
                <div role="alert" className="p-6 text-sm">
                    <p className="font-medium">You don't have access to {label}.</p>
                    <p className="text-muted-foreground">An owner or admin of this workspace can grant it.</p>
                </div>
            );
            break;
        case 'not-found':
            body = <p role="alert" className="p-6 text-sm">We couldn't find {label}.</p>;
            break;
        case 'upsell':
            body = upsell ?? <p role="alert" className="p-6 text-sm">{label} isn't included in this plan.</p>;
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
                </div>
            );
    }

    return <div data-page-state={state}>{body}</div>;
}
