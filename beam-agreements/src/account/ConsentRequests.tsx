import type { ReactNode } from 'react';
import type { ResourceKey } from '@schemastud/frame';
import { RecordBrowser } from '../internal/RecordBrowser';

/**
 * agreements 12: the consent requests a person made, each with its status (waiting, granted, declined, withdrawn),
 * composed from frame's shells as 10a's screens are. The resource arrives as a `ResourceKey` (the seam's
 * `agreement-consent-requests`); its columns come from the resource's declaration.
 */
export interface ConsentRequestsProps {
    resource: ResourceKey;
    heading?: ReactNode;
}

export function ConsentRequests({ resource, heading }: ConsentRequestsProps) {
    return (
        <section key={resource} aria-label="Consent requests" data-beam-agreements="consent-requests">
            <h2>{heading ?? 'Consent requests'}</h2>
            <RecordBrowser resource={resource} />
        </section>
    );
}
