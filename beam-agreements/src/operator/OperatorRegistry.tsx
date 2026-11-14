import type { ReactNode } from 'react';
import type { ResourceKey } from '@schemastud/frame';
import { NestedFrame } from '../internal/NestedFrame';
import { RecordBrowser } from '../internal/RecordBrowser';
import { CoverageCard } from './CoverageCard';

/**
 * The operator's registry (agreements 17a, seam-ahead trial): what is in force and who has agreed. The coverage card,
 * then the agreements, their versions and the ledger's entries, each a read-only list that opens one record.
 *
 * The port 17b binds is these props and the frame provider above them: each resource arrives as a `ResourceKey`
 * (CONFORM 03-1/03-2). The lists offer no create, edit or delete because the resources declare none; their columns,
 * filters (the facets bar each list mounts) and abilities are the resources' declarations. Nothing here names them.
 */
export interface OperatorRegistryProps {
    agreements: ResourceKey;
    versions: ResourceKey;
    entries: ResourceKey;
    /** The resource whose summary is the coverage figure; without it, no coverage card is drawn. */
    coverage?: ResourceKey;
    /** Replaces the default heading. */
    heading?: ReactNode;
}

export function OperatorRegistry({ agreements, versions, entries, coverage, heading }: OperatorRegistryProps) {
    return (
        <section aria-label="Agreements registry" data-beam-agreements="registry">
            <h2>{heading ?? 'Agreements registry'}</h2>
            {coverage ? <CoverageCard key={coverage} resource={coverage} /> : null}
            <Part label="Agreements" resource={agreements} />
            <Part label="Versions" resource={versions} />
            <Part label="Entries" resource={entries} />
        </section>
    );
}

/** One of the registry's lists. Its filters, sort and page are its own, so working one list never moves another. */
function Part({ label, resource }: { label: string; resource: ResourceKey }) {
    return (
        <section aria-label={label} data-beam-agreements="registry-list">
            <h3>{label}</h3>
            <NestedFrame key={resource}>
                <RecordBrowser resource={resource} />
            </NestedFrame>
        </section>
    );
}
