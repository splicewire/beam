import * as react from 'react';
import { ReactNode, ComponentType } from 'react';
import * as _schemastud_frame from '@schemastud/frame';
import { ResourceKey, FrameTransport, ContextManifest, ResourceActionDefinition, Row } from '@schemastud/frame';
import { SessionRequest } from '@schemastud/frame/session';
export { A as AgreementPrompt, a as AgreementPromptProps, r as registerAgreementWidgets } from './register-BYPGxEGy.js';
import '@schemastud/seam';

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

/**
 * agreements 06: the browser side of a 428. The body is beam's RequirementRefusalData (agreements 04): one
 * OutstandingRequirementData per unmet Requirement, each naming exactly one remedy: `acceptOperation` (call it, then
 * replay) or `member` (replay with the agreement member added to that input member). Read structurally: a body that
 * isn't this shape isn't ours, and the original error is rethrown unchanged.
 */
interface OutstandingRequirement {
    key: string;
    /** The 1-based ordinal of the version the server wants (the plane's int `version`, agreements 04). */
    version: number;
    digest: string;
    kind: string;
    title: string;
    scope: string;
    subject: string | number | null;
    /** For the REST-backed member widget; the 428 dialog reads by key through frame's transport. */
    readUrl: string;
    acceptOperation: string | null;
    member: string | null;
}
/** One Agreement as the person will read it: the text, already checked to be the version whose digest is submitted. */
interface PresentedAgreement {
    key: string;
    title: string;
    /** The version label the agreements resource shows; sent back as `version` when accepting. */
    label: string;
    digest: string;
    /** The frozen text as presented: the exact content `digest` is the SHA-256 of (the seam's version.content). */
    content: string;
    /** agreements 09: what changed, in the publisher's words; absent or null when none was written. */
    summary?: string | null;
    /** How it is satisfied: the accept operation, or the input member a replay carries. */
    remedy: {
        accept: string;
    } | {
        member: string;
        version: number;
    };
}
/** The seam's `agreements` row as frame serves it: the version in force, with its content. */
interface AgreementRow {
    key?: string;
    title?: string;
    kind?: string;
    version?: {
        label: string;
        digest: string;
        content: string;
        summary?: string | null;
    } | null;
}
/** Reads one Agreement by key. */
type AgreementReader = (key: string) => Promise<AgreementRow | null>;
/** The resource key the seam declares (`#[ParticleResource(key: 'agreements')]`). */
declare const AGREEMENTS_RESOURCE = "agreements";
/**
 * Read Agreements through frame's own transport: `get('agreements', key)`, which beam's frame handler resolves with
 * the seam's AgreementBacking. The form widget uses the same backing through the REST show route; this reader stays
 * transport-specific because the 428 dialog is composed around FrameTransport.
 */
declare function agreementsFrom(transport: Pick<FrameTransport, 'get'>): AgreementReader;
/** The outstanding Requirements of a 428, or null when the error is anything else (then it isn't ours to handle). */
declare function refusalOf(error: unknown): OutstandingRequirement[] | null;
/** The text of an Agreement changed between the refusal and the read, twice: nothing was done. */
declare class AgreementTextMismatchError extends Error {
    readonly key: string;
    constructor(key: string);
}
/** An Agreement with no version in force can't be accepted. */
declare class AgreementUnavailableError extends Error {
    readonly key: string;
    constructor(key: string);
}
/**
 * The refusal's Agreement as the person will read it, or `'moved'` when the version served now isn't the one the
 * refusal names: coord 11:29Z, the text shown is the version whose digest is submitted, so a mismatch is never shown.
 */
declare function presentRefused(requirement: OutstandingRequirement, read: AgreementReader): Promise<PresentedAgreement | 'moved'>;

/** Asks the person. Resolves true on accept, false on decline (the dialog closes; nothing is performed or recorded). */
type AskForAgreement = (agreements: PresentedAgreement[]) => Promise<boolean>;
/** Records the person's acceptance of one Agreement through its accept operation (`agreements.accept`). */
type AcceptAgreement = (operation: string, input: {
    agreement: string;
    version: string;
    digest: string;
}) => Promise<void>;
/** Declined: nothing ran and nothing was recorded. Frame announces the message. */
declare class AgreementDeclinedError extends Error {
    constructor(titles: string[]);
}
/** The one replay was refused again: shown as an error and never retried (agreements 06). */
declare class AgreementStillRequiredError extends Error {
    readonly requirements: OutstandingRequirement[];
    constructor(requirements: OutstandingRequirement[]);
}
/**
 * Accept through frame's own transport: the accept operation is the `agreements` resource's declared action (its op
 * suffix, `accept`), invoked with the manifest's definition. Pass the UNWRAPPED transport, so accepting is never itself
 * intercepted.
 */
declare function acceptThrough(transport: Pick<FrameTransport, 'invoke' | 'getManifest'>, manifestFor?: (resource: string) => ContextManifest | undefined): AcceptAgreement;
interface InterlockOptions {
    read: AgreementReader;
    ask: AskForAgreement;
    accept: AcceptAgreement;
    /** Told which Agreements were just accepted, so a lock drawn from a stale ability map can let go at once. */
    onAccepted?: (keys: string[]) => void;
}
/**
 * Wrap a frame transport so a declared action that answers 428 asks for agreement and then continues:
 * - each outstanding Agreement is shown with its title and full frozen text, and only when the text's digest is the
 *   refusal's. On a mismatch the original request is replayed ONCE for a fresh refusal; a second mismatch is an error;
 * - accept remedy: the accept operation runs, then the original request is replayed once;
 * - submit remedy: the original request is replayed once with the agreement member added where the refusal says;
 * - a 428 on the replay is an error and is not retried; declining performs nothing and records nothing.
 * Every other answer passes through untouched.
 */
declare function withAgreementInterlock<T extends Pick<FrameTransport, 'invoke'>>(transport: T, options: InterlockOptions): T;

/**
 * frame's `ActionLock` (Q-06b (a); `@schemastud/frame` ≥ agreements 06), written structurally so this package also
 * builds against a frame that predates it.
 */
interface FrameActionLock {
    label: string;
    unlock(): Promise<boolean>;
}
interface AgreementLockOptions {
    /** beam's flat ability map (CanMapBuilder, agreements 05): `agreement:{key}` is false until the Agreement is accepted. */
    abilities: () => Record<string, boolean> | undefined;
    read: AgreementReader;
    ask: AskForAgreement;
    accept: AcceptAgreement;
    /** Agreements accepted in this page since the ability map was drawn (shared with the interceptor's `onAccepted`). */
    accepted?: ReadonlySet<string>;
    onAccepted?: (keys: string[]) => void;
    /** The locked button's description. Default names the Agreements' keys. */
    describe?: (keys: string[]) => string;
}
/**
 * frame's `actionLock` for Agreements: an action whose `requires` names an Agreement the ability map reports as unmet
 * (`agreement:{key}` === false) is drawn locked before any request. A key the map doesn't carry (subject scope, nothing
 * registered) isn't drawn locked; a 428 then reaches the interceptor, which is the safety net either way.
 *
 * Unlocking shows each Agreement's version IN FORCE, read through frame's transport, and accepts THAT version's
 * digest: the text shown is the version whose digest is submitted. Declining leaves the action locked and sends nothing.
 */
declare function createAgreementLock(options: AgreementLockOptions): (_resource: string, action: ResourceActionDefinition & {
    requires?: string[];
}, _record?: Row) => FrameActionLock | null;

/**
 * The one question in flight. `ask()` is what the interceptor and the lock call (they live outside React, in a frame
 * kit built at module scope); `<AgreementStepUp>` renders whatever is being asked and answers it. A second ask while
 * one is open is refused rather than stacked: it resolves false (declined), so nothing runs twice behind one dialog.
 */
interface StepUpController {
    ask(agreements: PresentedAgreement[]): Promise<boolean>;
    /** The question being asked now, or null. */
    current(): PresentedAgreement[] | null;
    answer(accepted: boolean): void;
    subscribe(listener: () => void): () => void;
}
declare function createStepUp(): StepUpController;

/**
 * The step-up dialog (agreements 06): each outstanding Agreement with its title and full frozen text, and two answers.
 * Mount once, anywhere under the app (it renders nothing until asked).
 *
 * Accessible by construction: a modal `role="dialog"` named by its heading and described by the text; focus moves to
 * the (scrollable, focusable) text when it opens, Tab and Shift+Tab stay inside it, Escape declines, and focus returns to wherever it
 * was. Styling is inline only: a host's Tailwind doesn't scan `node_modules`.
 */
declare function AgreementStepUp({ controller }: {
    controller: StepUpController;
}): react.JSX.Element | null;

interface AgreementInterlockOptions<T extends FrameTransport> {
    /** The frame transport the kit would otherwise use. Agreements are read and accepted through it, unwrapped. */
    transport: T;
    /**
     * Another resource's context manifest (frame's `manifestFor`): where the accept action's definition is found.
     * Optional: absent, it's read from the transport's own manifest.
     */
    manifestFor?: (resource: string) => ContextManifest | undefined;
    /** beam's flat ability map as the page holds it now (`agreement:{key}`). */
    abilities: () => Record<string, boolean> | undefined;
    /** Reuse a controller (one `<AgreementStepUp>` per app). Default: a new one. */
    stepUp?: StepUpController;
}
/**
 * Everything a frame host binds for agreements 06, in one call:
 * - `transport`: the kit's transport, wrapped so a 428 asks and then continues;
 * - `actionLock`: frame's injection, so an action the ability map reports as unmet is drawn locked before any request;
 * - `stepUp`: the controller `<AgreementStepUp controller={…}/>` renders.
 * Agreements accepted here are remembered for this page, so a lock drawn from the page's ability map lets go at once;
 * after a reload the server's map says so itself.
 */
declare function createAgreementInterlock<T extends FrameTransport>(options: AgreementInterlockOptions<T>): {
    transport: T;
    actionLock: (_resource: string, action: _schemastud_frame.ResourceActionDefinition & {
        requires?: string[];
    }, _record?: _schemastud_frame.Row) => FrameActionLock | null;
    stepUp: StepUpController;
};

/**
 * agreements 07 and 09: the pages this package draws for a host's Inertia page map, by page name, loaded on demand. Merge them
 * into the host's `pages` as the starter does `beamDocsPages`:
 *
 *     beamInertiaOptions({ pages: { ...beamAgreementsPages, ...pages } })
 */
declare const beamAgreementsPages: Record<string, () => Promise<{
    default: ComponentType<any>;
}>>;

/** agreements 09: one version as the seam's public legal pages serve it (LegalPagesController::present()). */
interface LegalVersionSummary {
    label: string;
    /** ISO-8601. */
    effectiveAt: string;
    material: boolean;
    digest: string;
    summary: string | null;
    url: string | null;
}
interface LegalVersionFull extends LegalVersionSummary {
    content: string;
}

/**
 * agreements 09: the PUBLIC legal page (`legal/{key}`, Inertia page `agreements/legal`). It shows the version in force,
 * with its label, effective date, what changed and full text, then every earlier version, each linked to its own page.
 * The server never sends a version before its effective date. Styling is inline only: a host's Tailwind doesn't scan
 * node_modules.
 */
interface LegalProps {
    /** The server also sends `key`; React keeps it out of props, and the page doesn't need it. */
    title: string;
    current: LegalVersionFull;
    earlier: LegalVersionSummary[];
}
declare function Legal({ title, current, earlier }: LegalProps): react.JSX.Element;

/**
 * agreements 09: one version of an Agreement in full, public (`legal/{key}/versions/{label}`, Inertia page
 * `agreements/legal-version`), with a link back to the version in force.
 */
interface LegalVersionProps {
    /** The server also sends `key`; React keeps it out of props, and the page doesn't need it. */
    title: string;
    version: LegalVersionFull;
    legalUrl: string | null;
}
declare function LegalVersion({ title, version, legalUrl }: LegalVersionProps): react.JSX.Element;

/** agreements 09: one notice as `GET agreements/notices` serves it. */
interface AgreementNotice {
    key: string;
    /** agreements 10b: the Agreement's kind. A `notice` is acknowledged; anything else is agreed to. */
    kind?: string;
    title: string;
    label: string;
    digest: string;
    effectiveAt: string;
    summary: string | null;
    version: number;
    readUrl: string;
    legalUrl: string | null;
}
interface AgreementNoticesProps {
    /** The seam's notices route. Default `/agreements/notices`. */
    url?: string;
    /** Injected for tests; default frame's session request (same-origin, XSRF). */
    request?: SessionRequest;
}
/**
 * agreements 09 (reach `notice`): the signed-in person's dismissible notices of a new material version, each with what
 * changed and a link to read it. Nothing is blocked. Dismissing records NOTHING on the server (a dismissal is not an
 * Assent); "I agree" runs the ordinary accept operation. Renders nothing when there is nothing to tell. Put it once in
 * the signed-in layout.
 */
declare function AgreementNotices({ url, request: injected }: AgreementNoticesProps): react.JSX.Element | null;

/**
 * agreements 12: the counterparty's page, opened from a SIGNED link by a person with no account (the seam's
 * `consent/{id}`, Inertia page `agreements/consent`). It shows only what is needed to decide: what is asked (the title,
 * what changed, the frozen text), who asks, and what it is about. Its actions are the server's own signed URLs: Grant and
 * Decline while the request is waiting, Withdraw after a grant. Nothing here knows who is signed in.
 */
interface ConsentProps {
    title: string;
    label: string | null;
    content: string | null;
    summary: string | null;
    askedBy: string;
    about: string;
    status: 'requested' | 'granted' | 'declined' | 'withdrawn';
    actions: Partial<Record<'grant' | 'decline' | 'withdraw', string>>;
    /** Injected for tests; default frame's session request (same-origin, XSRF). */
    request?: SessionRequest;
    /** After an action: reload the signed page. Injected for tests. */
    reload?: () => void;
}
declare function Consent({ title, label, content, summary, askedBy, about, status, actions, request: injected, reload }: ConsentProps): react.JSX.Element;

/**
 * agreements 12: the consent requests a person made, each with its status (waiting, granted, declined, withdrawn),
 * composed from frame's shells as 10a's screens are. The resource arrives as a `ResourceKey` (the seam's
 * `agreement-consent-requests`); its columns come from the resource's declaration.
 */
interface ConsentRequestsProps {
    resource: ResourceKey;
    heading?: ReactNode;
}
declare function ConsentRequests({ resource, heading }: ConsentRequestsProps): react.JSX.Element;

/** The workflow guard the seam registers (agreements 11b, lead ruling Q-11b-c). */
declare const AGREEMENT_GUARD = "agreement-is-current";
/** The projected transition fields this reads (beam-workflows' WorkflowTransitionData, structurally; no dependency). */
interface BlockedTransition {
    name: string;
    guard: string | null;
    metadata: Record<string, unknown> | null;
    reason: string | null;
}
interface AgreementBlockedStepOptions {
    /** Called after the person accepted: refetch the projection, so the move becomes available. */
    onAccepted: () => void;
    /** The seam's agreements show route, by key. Default `/beam/agreements/agreements/{key}`. */
    readUrl?: (key: string) => string;
    /** The seam's accept operation. Default `/beam/agreements/agreements/accept`. */
    acceptUrl?: string;
    /** Injected for tests; default frame's session request (same-origin, XSRF). */
    request?: SessionRequest;
}
/** The Agreement a refused move's guard names, or null when the move isn't held by the agreement guard. */
declare function blockedAgreementKey(transition: BlockedTransition): string | null;
/**
 * agreements 11b (lead ruling Q-11b-e): a `renderBlocked` for beam-workflows' `<WorkflowActions>`. On a move refused by
 * "Agreement is current" it offers 06's accept step, in place: the step-up dialog on the Agreement's exact text, then
 * the ordinary accept operation, then `onAccepted` so the host refetches the projection. Any other refused move gets
 * nothing extra (its reason still shows).
 *
 *     <WorkflowActions projection={p} … renderBlocked={agreementBlockedStep({ onAccepted: refetch })} />
 */
declare function agreementBlockedStep(options: AgreementBlockedStepOptions): (transition: BlockedTransition) => ReactNode;
declare function AgreementBlockedStep({ agreementKey, onAccepted, readUrl, acceptUrl, request: injected, }: AgreementBlockedStepOptions & {
    agreementKey: string;
}): react.JSX.Element;

/**
 * agreements 07: the agreement prompt a refused PAGE visit lands on (the seam's `beam.agreements.required`, Inertia page
 * `agreements/required`). It is 06's step-up, not a second one: the same `createStepUp` controller and the same
 * `<AgreementStepUp>` dialog.
 *
 * The server already read each Agreement's text and kept it only where the version in force has the refusal's digest
 * (06's rule); a `moved` one has no text, and this page offers to try again, which re-asks the route for a fresh refusal.
 * Accepting records each through the accept operation and then goes where the person was going (the route's gate
 * re-asks). Declining stays here with a way back. Styling is inline only: a host's Tailwind doesn't scan node_modules.
 */
interface AgreementsRequiredProps {
    requirements: Array<OutstandingRequirement & {
        label: string | null;
        content: string | null;
        summary?: string | null;
        moved: boolean;
    }>;
    intended: string;
    back: string;
    acceptUrl: string | null;
    /** agreements 09: the host's sign-out (POST), offered on the prompt; null when the host has none. */
    logoutUrl?: string | null;
    /** How to go to `intended` after accepting. Default: a full navigation. */
    visit?: (url: string) => void;
}
declare function AgreementsRequired({ requirements, intended: rawIntended, back: rawBack, acceptUrl, logoutUrl, visit }: AgreementsRequiredProps): react.JSX.Element;

interface AgreementMemberWidgetProps {
    id?: string;
    idSchema?: {
        $id?: string;
    };
    fieldPathId?: {
        path?: unknown[];
    };
    name?: string;
    label?: string;
    value?: unknown;
    formData?: unknown;
    disabled?: boolean;
    readonly?: boolean;
    readOnly?: boolean;
    options?: unknown;
    uiSchema?: {
        'ui:options'?: unknown;
    };
    schema?: {
        title?: string;
    };
    onChange: (value: any, pathOrError?: any, errorSchema?: any) => void;
}
/** A named schema widget for a member of one frozen Agreement version. */
declare function AgreementMemberWidget(props: AgreementMemberWidgetProps): react.JSX.Element;

export { AGREEMENTS_RESOURCE, AGREEMENT_GUARD, type AcceptAgreement, AgreementBlockedStep, type AgreementBlockedStepOptions, AgreementDeclinedError, type AgreementInterlockOptions, type AgreementLockOptions, AgreementMemberWidget, type AgreementNotice, AgreementNotices, type AgreementNoticesProps, type AgreementReader, type AgreementRow, AgreementStepUp, AgreementStillRequiredError, AgreementTextMismatchError, AgreementUnavailableError, AgreementsAndConsents, AgreementsRequired, type AgreementsRequiredProps, type AgreementsScreenProps, type AskForAgreement, type BlockedTransition, Consent, type ConsentProps, ConsentRequests, type ConsentRequestsProps, CoverageCard, type CoverageCardProps, type FrameActionLock, type InterlockOptions, Legal, type LegalProps, LegalVersion, type LegalVersionFull, type LegalVersionProps, type LegalVersionSummary, OperatorRegistry, type OperatorRegistryProps, OrganisationAgreements, type OutstandingRequirement, PartyHistory, type PartyHistoryProps, type PresentedAgreement, type StepUpController, acceptThrough, agreementBlockedStep, agreementsFrom, beamAgreementsPages, blockedAgreementKey, createAgreementInterlock, createAgreementLock, createStepUp, presentRefused, refusalOf, withAgreementInterlock };
