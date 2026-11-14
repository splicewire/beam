import { useMemo, type ReactNode } from 'react';
import { FrameProvider, useFrameInjection, type ResourceKey } from '@schemastud/frame';
import { RecordBrowser } from '../internal/RecordBrowser';
import { scopeTransport } from './scopeTransport';

/**
 * One party's history, for a support agent (agreements 17a, seam-ahead trial): the entries resource, narrowed to one
 * party, listed in the order the resource serves them, each opening read-only.
 *
 * The party arrives opaque. `scope` is the request parameters the host's entries resource reads to narrow to one party
 * (17b declares them), and this screen only passes them on, so it names no filter and no field. The frozen text, the
 * columns and any export are the resource's declarations.
 */
export interface PartyHistoryProps {
    /** The entries resource, as the host declared it. */
    resource: ResourceKey;
    /** The request parameters that narrow `resource` to one party, as the host's resource reads them. */
    scope: Readonly<Record<string, string>>;
    /** Replaces the default heading. */
    heading?: ReactNode;
}

export function PartyHistory({ resource, scope, heading }: PartyHistoryProps) {
    const injection = useFrameInjection();
    // The scope's identity is its content: a new object with the same parameters is the same history.
    const scopeKey = JSON.stringify(Object.entries(scope).sort(([a], [b]) => a.localeCompare(b)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const transport = useMemo(() => scopeTransport(injection.transport, resource, scope), [injection.transport, resource, scopeKey]);
    const value = useMemo(() => ({ ...injection, transport }), [injection, transport]);

    return (
        <section aria-label="History" data-beam-agreements="party-history">
            <h2>{heading ?? 'History'}</h2>
            <FrameProvider value={value}>
                <RecordBrowser key={`${resource}|${scopeKey}`} resource={resource} />
            </FrameProvider>
        </section>
    );
}
