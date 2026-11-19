import * as react from 'react';
import { ReactNode } from 'react';
import { ResourceKey } from '@schemastud/frame';

/**
 * "Agreements & consents" under the account, and the organisation owner's equivalent (agreements 10a, seam-ahead
 * trial). Each is a list of ledger entries that opens one entry's detail, composed from frame's shells.
 *
 * The port 10b binds is these props and the frame provider above them. The host mounts its kit's `Provider`, and the
 * entries resource arrives as a `ResourceKey` (CONFORM 03-1/03-2). Nothing here names a resource or a field: the
 * columns, the detail's fields and the actions come from what the host's manifest and schema declare. Withdraw is the
 * resource's own declared record action (destructive, confirm-only), which frame draws on each row and on the detail,
 * asks about, sends and announces (`ListShell`/`EditShell`, ADR-0005).
 */
interface AgreementsScreenProps {
    /** The entries resource to list, as the host declared it. */
    resource: ResourceKey;
    /** Replaces the default heading. */
    heading?: ReactNode;
}
/** A person's own entries: what they agreed to, each with its version, and a withdraw where the resource offers one. */
declare function AgreementsAndConsents(props: AgreementsScreenProps): react.JSX.Element;
/** The entries made on an organisation's behalf, for its owner: the same composition over the organisation's resource. */
declare function OrganisationAgreements(props: AgreementsScreenProps): react.JSX.Element;

/**
 * The operator's registry (agreements 17a, seam-ahead trial): what is in force and who has agreed. The coverage card,
 * then the agreements, their versions and the ledger's entries, each a read-only list that opens one record.
 *
 * The port 17b binds is these props and the frame provider above them: each resource arrives as a `ResourceKey`
 * (CONFORM 03-1/03-2). The lists offer no create, edit or delete because the resources declare none; their columns,
 * filters (the facets bar each list mounts) and abilities are the resources' declarations. Nothing here names them.
 */
interface OperatorRegistryProps {
    agreements: ResourceKey;
    versions: ResourceKey;
    entries: ResourceKey;
    /** The resource whose summary is the coverage figure; without it, no coverage card is drawn. */
    coverage?: ResourceKey;
    /** Replaces the default heading. */
    heading?: ReactNode;
}
declare function OperatorRegistry({ agreements, versions, entries, coverage, heading }: OperatorRegistryProps): react.JSX.Element;

/**
 * One party's history, for a support agent (agreements 17a, seam-ahead trial): the entries resource, narrowed to one
 * party, listed in the order the resource serves them, each opening read-only.
 *
 * The party arrives opaque. `scope` is the request parameters the host's entries resource reads to narrow to one party
 * (17b declares them), and this screen only passes them on (see `scopeTransport` for which reads carry them), so it
 * names no filter and no field. The frozen text, the columns and any export are the resource's declarations. The list
 * keeps its own filters, sort and page, apart from the host's and from any other history beside it.
 */
interface PartyHistoryProps {
    /** The entries resource, as the host declared it. */
    resource: ResourceKey;
    /** The request parameters that narrow `resource` to one party, as the host's resource reads them. */
    scope: Readonly<Record<string, string>>;
    /** Replaces the default heading. */
    heading?: ReactNode;
}
declare function PartyHistory({ resource, scope, heading }: PartyHistoryProps): react.JSX.Element;

/**
 * The coverage figure (agreements 17a): the resource's own summary, drawn as frame draws a dashboard's summary card.
 * It reads `summary` through the transport and hands the `SummaryPayload` to frame's `DashboardCard` as a `summary`
 * row, so the card is whatever summary widget the resource declares (frame's `StatRow` by default). The label, the
 * figures, their population and their unit are the payload's: nothing here computes or names one.
 */
interface CoverageCardProps {
    /** The resource whose summary is the coverage figure. */
    resource: ResourceKey;
    /** Request parameters for the summary, as the host's resource reads them. */
    params?: Record<string, string>;
}
declare function CoverageCard({ resource, params }: CoverageCardProps): react.JSX.Element;

export { AgreementsAndConsents, type AgreementsScreenProps, CoverageCard, type CoverageCardProps, OperatorRegistry, type OperatorRegistryProps, OrganisationAgreements, PartyHistory, type PartyHistoryProps };
