/**
 * The pieces every Site map view shares (owner-review-20261102 research 37): the status vocabulary in author language,
 * the page inspector a node opens, the redirects that reach no page, and the "Site parts" group. The three views
 * differ only in how they draw the map; the inspector is the same unit everywhere (the owner's 2026-11-06 ruling).
 */
import type { ReactNode } from 'react';
import {
    ArrowUpRight, CircleDashed, CornerDownRight, EyeOff, FileCheck2, FileDiff, FileClock, FilePlus2, FileWarning, FileX2,
    Globe, Layers, LayoutTemplate, Lock, Palette, PenLine, Plus, Puzzle, Repeat2, RotateCcw, TriangleAlert, X,
} from 'lucide-react';
import { Button, cn } from '@schemastud/ui';
import { issuesFor, isSevere, pageTitle, publicationState, type Issue } from './model';
import type { RedirectTrace, SiteMapActions, SiteMapInbound, SiteMapPage, SitePart } from './types';
import { englishBeamUxMessages, useBeamUxMessages, type BeamUxMessages, type BeamUxMessageKey } from '../messages.js';

/* ── Status vocabulary ─────────────────────────────────────────────────────────────────────── */

export function PublicationStatus({ page, compact = false }: { page: SiteMapPage; compact?: boolean }) {
    const m = useBeamUxMessages();
    const state = publicationState(page);
    // A page with a draft is still live at its published version: say so first, then flag the pending draft.
    return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-foreground/75">
            <span aria-hidden className={cn('size-2 shrink-0 rounded-full', state === 'unpublished' ? 'border border-foreground/50' : 'bg-primary')} />
            {state === 'unpublished' ? <span className="text-foreground">{m.t('splicewire-beam-ux::messages.sitemap_not_published')}</span> : <span>{m.t('splicewire-beam-ux::messages.sitemap_live_version', { version: page.publishedReadable })}</span>}
            {state === 'draft' && (
                <span className="inline-flex items-center gap-1 rounded bg-muted px-1 text-[11px] font-medium text-foreground">
                    {m.t('splicewire-beam-ux::messages.sitemap_draft_version', { version: page.headReadable })}{!compact && <span className="font-normal text-foreground/75"> {m.t('splicewire-beam-ux::messages.sitemap_pending')}</span>}
                </span>
            )}
        </span>
    );
}

/** Why the sitemap leaves a page out, in an author's words (`SitemapEligibility`'s reasons). */
export const SEARCH_COPY: Record<string, { shortKey: BeamUxMessageKey; longKey: BeamUxMessageKey }> = {
    listed: { shortKey: 'splicewire-beam-ux::messages.sitemap_search_listed', longKey: 'splicewire-beam-ux::messages.sitemap_search_listed_long' },
    'record-page': { shortKey: 'splicewire-beam-ux::messages.sitemap_search_record_page', longKey: 'splicewire-beam-ux::messages.sitemap_search_record_page_long' },
    unpublished: { shortKey: 'splicewire-beam-ux::messages.sitemap_search_unpublished', longKey: 'splicewire-beam-ux::messages.sitemap_search_unpublished_long' },
    'hidden-ancestor': { shortKey: 'splicewire-beam-ux::messages.sitemap_search_hidden_ancestor', longKey: 'splicewire-beam-ux::messages.sitemap_search_hidden_ancestor_long' },
    'not-listable': { shortKey: 'splicewire-beam-ux::messages.sitemap_search_not_listable', longKey: 'splicewire-beam-ux::messages.sitemap_search_not_listable_long' },
    'not-public': { shortKey: 'splicewire-beam-ux::messages.sitemap_search_not_public', longKey: 'splicewire-beam-ux::messages.sitemap_search_not_public_long' },
    unplaced: { shortKey: 'splicewire-beam-ux::messages.sitemap_search_unplaced', longKey: 'splicewire-beam-ux::messages.sitemap_search_unplaced_long' },
    'not-routable': { shortKey: 'splicewire-beam-ux::messages.sitemap_search_not_routable', longKey: 'splicewire-beam-ux::messages.sitemap_search_not_routable_long' },
    'no-records': { shortKey: 'splicewire-beam-ux::messages.sitemap_search_no_records', longKey: 'splicewire-beam-ux::messages.sitemap_search_no_records_long' },
};

const searchCopy = (reason: string) => SEARCH_COPY[reason] ?? { shortKey: 'splicewire-beam-ux::messages.sitemap_search_not_listed', longKey: 'splicewire-beam-ux::messages.sitemap_search_left_out' };

export function SearchStatus({ page, iconOnly = false }: { page: SiteMapPage; iconOnly?: boolean }) {
    const m = useBeamUxMessages();
    const { listed, reason, urlCount } = page.search;
    const short = m.t(searchCopy(reason).shortKey) + (reason === 'record-page' ? ` · ${urlCount}` : '');
    const label = listed ? m.t('splicewire-beam-ux::messages.sitemap_in_sitemap', { status: short }) : m.t('splicewire-beam-ux::messages.sitemap_not_in_sitemap', { status: short });
    const Icon = listed ? Globe : reason === 'not-public' || reason === 'not-listable' ? Lock : EyeOff;
    return (
        <span title={label} className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-foreground/75">
            <Icon aria-hidden className="size-3.5 shrink-0" />
            {iconOnly ? <span className="sr-only">{label}</span> : <span className={cn(!listed && 'text-foreground')}>{short}</span>}
        </span>
    );
}

/** `labelKey` names a catalog line; an unknown state renders its raw code. */
export const FILE_COPY: Record<string, { labelKey?: BeamUxMessageKey; label?: string; Icon: typeof FileCheck2; tone: string }> = {
    clean: { labelKey: 'splicewire-beam-ux::messages.sitemap_file_clean', Icon: FileCheck2, tone: 'text-foreground/75' },
    modified: { labelKey: 'splicewire-beam-ux::messages.sitemap_file_modified', Icon: FileDiff, tone: 'text-warning-foreground dark:text-warning' },
    untracked: { labelKey: 'splicewire-beam-ux::messages.sitemap_file_untracked', Icon: FilePlus2, tone: 'text-foreground/75' },
    'untracked-ignored': { labelKey: 'splicewire-beam-ux::messages.sitemap_file_untracked_ignored', Icon: FilePlus2, tone: 'text-foreground/75' },
    'not-written': { labelKey: 'splicewire-beam-ux::messages.sitemap_file_not_written', Icon: FileX2, tone: 'text-destructive' },
    'mirror-disabled': { labelKey: 'splicewire-beam-ux::messages.sitemap_file_mirror_disabled', Icon: CircleDashed, tone: 'text-foreground/75' },
    'no-git-repo': { labelKey: 'splicewire-beam-ux::messages.sitemap_file_no_git_repo', Icon: FileWarning, tone: 'text-foreground/75' },
    'not-yet-saved': { labelKey: 'splicewire-beam-ux::messages.sitemap_file_not_yet_saved', Icon: FileClock, tone: 'text-foreground/75' },
};

const fileCopy = (state: string) => FILE_COPY[state] ?? { label: state, Icon: FileWarning, tone: 'text-foreground/75' };

export function FileStatus({ page, iconOnly = false }: { page: SiteMapPage; iconOnly?: boolean }) {
    const m = useBeamUxMessages();
    if (!page.file) return null;
    const copy = fileCopy(page.file.state);
    const { Icon, tone } = copy;
    const label = copy.labelKey ? m.t(copy.labelKey) : (copy.label ?? page.file.state);
    return (
        <span title={m.t('splicewire-beam-ux::messages.sitemap_file_status', { status: label })} className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-xs', tone)}>
            <Icon aria-hidden className="size-3.5 shrink-0" />
            {iconOnly ? <span className="sr-only">{m.t('splicewire-beam-ux::messages.sitemap_file_status', { status: label })}</span> : <span>{label}</span>}
        </span>
    );
}

export function RedirectCount({ page }: { page: SiteMapPage }) {
    const m = useBeamUxMessages();
    const { count, attention, maxHops } = page.redirects;
    if (count === 0) return <span className="text-xs text-foreground/50"><span aria-hidden>·</span><span className="sr-only">{m.t('splicewire-beam-ux::messages.sitemap_no_old_addresses')}</span></span>;
    return (
        <span title={m.choice('splicewire-beam-ux::messages.sitemap_old_addresses_count', count)}
            className={cn('inline-flex items-center gap-1 text-xs tabular-nums', attention ? 'text-destructive' : 'text-foreground/75')}>
            <CornerDownRight aria-hidden className="size-3.5" />{count}
            <span className="sr-only"> {m.choice('splicewire-beam-ux::messages.sitemap_old_addresses_tail', count)}{attention ? m.t('splicewire-beam-ux::messages.sitemap_one_fails_guest') : maxHops > 1 ? m.t('splicewire-beam-ux::messages.sitemap_longest_through', { hops: maxHops }) : ''}</span>
        </span>
    );
}

export const ISSUE_COPY: Record<Issue['kind'], { labelKey: BeamUxMessageKey; pluralKey: BeamUxMessageKey; fixKey: BeamUxMessageKey; actionKey: BeamUxMessageKey }> = {
    'file-missing': { labelKey: 'splicewire-beam-ux::messages.sitemap_issue_file_missing', pluralKey: 'splicewire-beam-ux::messages.sitemap_issue_file_missing_count', fixKey: 'splicewire-beam-ux::messages.sitemap_issue_file_missing_fix', actionKey: 'splicewire-beam-ux::messages.sitemap_issue_file_missing_action' },
    'file-changed': { labelKey: 'splicewire-beam-ux::messages.sitemap_issue_file_changed', pluralKey: 'splicewire-beam-ux::messages.sitemap_issue_file_changed_count', fixKey: 'splicewire-beam-ux::messages.sitemap_issue_file_changed_fix', actionKey: 'splicewire-beam-ux::messages.sitemap_issue_file_changed_action' },
    'redirect-broken': { labelKey: 'splicewire-beam-ux::messages.sitemap_issue_redirect_broken', pluralKey: 'splicewire-beam-ux::messages.sitemap_issue_redirect_broken_count', fixKey: 'splicewire-beam-ux::messages.sitemap_issue_redirect_broken_fix', actionKey: 'splicewire-beam-ux::messages.sitemap_issue_redirect_broken_action' },
    'redirect-loop': { labelKey: 'splicewire-beam-ux::messages.sitemap_issue_redirect_loop', pluralKey: 'splicewire-beam-ux::messages.sitemap_issue_redirect_loop_count', fixKey: 'splicewire-beam-ux::messages.sitemap_issue_redirect_loop_fix', actionKey: 'splicewire-beam-ux::messages.sitemap_issue_redirect_loop_action' },
};

/** `messages` is the reader's catalog when called in a render; English otherwise. */
export function issueLabel(issue: Issue, messages: BeamUxMessages = englishBeamUxMessages) {
    return (issue.count ?? 1) > 1 ? messages.t(ISSUE_COPY[issue.kind].pluralKey, { count: issue.count ?? 1 }) : messages.t(ISSUE_COPY[issue.kind].labelKey);
}

export function IssueIcon({ kind, className, announce = true }: { kind: Issue['kind']; className?: string; announce?: boolean }) {
    const m = useBeamUxMessages();
    const Icon = kind === 'file-missing' ? FileX2 : kind === 'file-changed' ? FileDiff : kind === 'redirect-loop' ? Repeat2 : TriangleAlert;
    return (
        <>
            <Icon aria-hidden className={cn('size-3.5 shrink-0', isSevere(kind) ? 'text-destructive' : 'text-warning-foreground dark:text-warning', className)} />
            {announce && <span className="sr-only">{m.t(ISSUE_COPY[kind].labelKey)}</span>}
        </>
    );
}

/* ── Redirect walks ────────────────────────────────────────────────────────────────────────── */

const END_COPY: Record<string, BeamUxMessageKey> = {
    loop: 'splicewire-beam-ux::messages.sitemap_end_loop',
    'too-long': 'splicewire-beam-ux::messages.sitemap_end_too_long',
    'dead-end': 'splicewire-beam-ux::messages.sitemap_end_dead_end',
    gone: 'splicewire-beam-ux::messages.sitemap_end_gone',
    denied: 'splicewire-beam-ux::messages.sitemap_end_denied',
};

const ORIGIN: Record<string, BeamUxMessageKey> = {
    author: 'splicewire-beam-ux::messages.sitemap_origin_author', publish: 'splicewire-beam-ux::messages.sitemap_origin_publish', release: 'splicewire-beam-ux::messages.sitemap_origin_release', takedown: 'splicewire-beam-ux::messages.sitemap_origin_takedown', record: 'splicewire-beam-ux::messages.sitemap_origin_record',
};

function WalkMeta({ permanent, match, origin, end, hops }: { permanent: boolean; match: string; origin: string; end: string; hops: number }) {
    const m = useBeamUxMessages();
    return (
        <p className="mt-0.5 text-xs text-foreground/70">
            {permanent ? m.t('splicewire-beam-ux::messages.sitemap_redirect_permanent') : m.t('splicewire-beam-ux::messages.sitemap_redirect_temporary')}
            {match === 'prefix' && ` ${m.t('splicewire-beam-ux::messages.sitemap_and_everything_under')}`}
            {ORIGIN[origin] && <> · {m.t(ORIGIN[origin])}</>}
            {/* A chain answers in one response (ADR-0236 d9): its hops are information, never a warning. */}
            {end === 'answered' && hops > 1 && <> · {m.t('splicewire-beam-ux::messages.sitemap_through_redirects', { hops })}</>}
            {END_COPY[end] && <span className={end === 'denied' ? '' : 'text-destructive'}> · {m.t(END_COPY[end])}</span>}
        </p>
    );
}

export function InboundLine({ redirect, onOpen }: { redirect: SiteMapInbound; onOpen?: (id: string) => void }) {
    const from = <span className="font-mono text-xs text-foreground">{redirect.path}{redirect.match === 'prefix' ? '/…' : ''}</span>;
    return (
        <div className="min-w-0">
            {onOpen ? <button type="button" onClick={() => onOpen(redirect.id)} className="rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{from}</button> : from}
            <WalkMeta {...redirect} />
        </div>
    );
}

export function TraceLine({ trace }: { trace: RedirectTrace }) {
    const steps = trace.end === 'answered' && trace.to ? [...trace.steps, trace.to] : trace.steps;
    return (
        <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-x-1 font-mono text-xs" style={{ rowGap: "0.125rem" }}>
                {steps.map((step, i) => (
                    <span key={`${step}-${i}`} className="inline-flex items-center gap-1">
                        {i > 0 && <span aria-hidden className="text-foreground/60">→</span>}
                        <span className={i === 0 ? 'text-foreground' : 'text-foreground/70'}>{step}</span>
                    </span>
                ))}
                {trace.end === 'loop' && <span className="inline-flex items-center gap-1 text-destructive"><span aria-hidden>→</span>{trace.steps[0]}</span>}
            </p>
            <WalkMeta {...trace} />
        </div>
    );
}

/** The Redirects that reach no page: loops, and exits that leave the site. */
export function LooseRedirects({ traces, onOpen }: { traces: RedirectTrace[]; onOpen?: (id: string) => void }) {
    return (
        <ul className="divide-y divide-border">
            {traces.map((t) => (
                <li key={t.id} className="flex items-start gap-3 px-4 py-2.5 md:px-6">
                    {t.attention
                        ? <Repeat2 aria-hidden className="mt-0.5 size-3.5 shrink-0 text-destructive" />
                        : <ArrowUpRight aria-hidden className="mt-0.5 size-3.5 shrink-0 text-foreground/70" />}
                    {onOpen
                        ? <button type="button" className="min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onOpen(t.id)}><TraceLine trace={t} /></button>
                        : <TraceLine trace={t} />}
                </li>
            ))}
        </ul>
    );
}

/* ── Site parts (D-37-b) ────────────────────────────────────────────────────────────────────── */

const PART_KINDS: { type: string; labelKey: BeamUxMessageKey; Icon: typeof Palette }[] = [
    { type: 'theme', labelKey: 'splicewire-beam-ux::messages.sitemap_part_theme', Icon: Palette },
    { type: 'layout', labelKey: 'splicewire-beam-ux::messages.sitemap_part_layout', Icon: LayoutTemplate },
    { type: 'template', labelKey: 'splicewire-beam-ux::messages.sitemap_part_template', Icon: Layers },
    { type: 'component', labelKey: 'splicewire-beam-ux::messages.sitemap_part_component', Icon: Puzzle },
];

/** The non-page entries the Site section opens with the same doors: the theme in its editor, the rest in the Entry editor. */
export function SiteParts({ parts, onOpen }: { parts: SitePart[]; onOpen: SiteMapActions['onOpen'] }) {
    const m = useBeamUxMessages();
    if (parts.length === 0) return null;
    const known = new Set(PART_KINDS.map((k) => k.type));
    const groups = [...PART_KINDS, ...[...new Set(parts.map((p) => p.type).filter((t) => !known.has(t)))].map((type) => ({ type, rawLabel: type, Icon: Puzzle }))] as { type: string; labelKey?: BeamUxMessageKey; rawLabel?: string; Icon: typeof Palette }[];
    return (
        <section aria-labelledby="site-parts-heading" className="border-t border-border px-4 py-4 md:px-6">
            <h2 id="site-parts-heading" className="text-[13px] font-semibold">{m.t('splicewire-beam-ux::messages.sitemap_site_parts')}</h2>
            <p className="mb-2 text-xs text-foreground/70">{m.t('splicewire-beam-ux::messages.sitemap_site_parts_hint')}</p>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
                {groups.map(({ type, labelKey, rawLabel, Icon }) => {
                    const items = parts.filter((p) => p.type === type);
                    if (items.length === 0) return null;
                    return (
                        <div key={type} className="min-w-0">
                            <h3 className="mb-1 flex items-center gap-1.5 text-xs font-medium text-foreground/70"><Icon aria-hidden className="size-3.5" />{labelKey ? m.t(labelKey) : rawLabel}</h3>
                            <ul>
                                {items.map((part) => (
                                    <li key={part.id}>
                                        <button type="button" onClick={() => onOpen({ kind: 'part', part })}
                                            className="flex min-h-8 w-full items-center rounded px-1.5 text-left text-[13px] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                            <span className="truncate">{part.type === 'theme' && !part.title ? m.t('splicewire-beam-ux::messages.sitemap_part_theme') : part.title || part.slug}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

/* ── Inspector ─────────────────────────────────────────────────────────────────────────────── */

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
    return (
        <section className="border-t border-border px-5 py-4">
            <div className="mb-2.5 flex items-center justify-between gap-3">
                <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
                {aside}
            </div>
            {children}
        </section>
    );
}

const REPAIR_BLOCKED: Record<string, BeamUxMessageKey> = {
    'no-release': 'splicewire-beam-ux::messages.sitemap_repair_no_release',
    'pin-moved': 'splicewire-beam-ux::messages.sitemap_repair_pin_moved',
};

export interface PageInspectorProps extends Omit<SiteMapActions, 'onOpen'> {
    page: SiteMapPage;
    parent?: SiteMapPage;
    onOpen: SiteMapActions['onOpen'];
    onSelect?: (id: string) => void;
    onClose?: () => void;
    sheet?: boolean;
}

/** One page's facts and doors. The same component in every view; its primary action is X8's Entry editor. */
export function PageInspector({ page, parent, onOpen, onSelect, onClose, sheet = false, onPageSettings, onAddRedirect, onOpenRedirect, onFileAction }: PageInspectorProps) {
    const m = useBeamUxMessages();
    const issues = issuesFor(page);
    const state = publicationState(page);
    const title = pageTitle(page);
    const canRepair = !!onFileAction && !!page.file?.repairMemberId;
    return (
        <aside aria-label={m.t('splicewire-beam-ux::messages.sitemap_details_for', { title })} data-testid="site-map-inspector"
            className={cn('flex min-h-0 flex-col bg-card text-card-foreground', sheet ? 'max-h-[58dvh] rounded-t-2xl border-t border-border shadow-[0_-8px_32px_-12px_rgb(0_0_0/0.35)]' : 'h-full')}>
            {sheet && <div aria-hidden className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />}
            <header className="px-5 pb-4 pt-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        {parent && (
                            <button type="button" onClick={() => onSelect?.(parent.id)} className="mb-1 rounded text-xs text-foreground/70 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                {pageTitle(parent)}
                            </button>
                        )}
                        <h2 className="text-lg font-semibold leading-tight tracking-[-0.01em] text-balance">{title}</h2>
                        {page.url && <p className="mt-1 break-all font-mono text-xs text-foreground/75">{page.url}</p>}
                    </div>
                    {onClose && (
                        <Button variant="ghost" size="icon" aria-label={m.t('splicewire-beam-ux::messages.sitemap_close_details')} onClick={onClose} className="-mr-2 -mt-1 size-9">
                            <X />
                        </Button>
                    )}
                </div>
                <div className="mt-4 flex gap-2">
                    <Button size="sm" className="h-9 flex-1" onClick={() => onOpen({ kind: 'page', page })}><PenLine />{m.t('splicewire-beam-ux::messages.sitemap_open_in_editor')}</Button>
                    {onPageSettings && <Button size="sm" variant="outline" className="h-9" onClick={() => onPageSettings(page)}>{m.t('splicewire-beam-ux::messages.sitemap_page_settings')}</Button>}
                </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">
                {issues.length > 0 && (
                    <section aria-label={m.t('splicewire-beam-ux::messages.sitemap_issues_on_page')} className={cn('mx-5 mb-4 rounded-lg px-3 py-2.5', issues.some((i) => isSevere(i.kind)) ? 'bg-destructive/10' : 'bg-warning/10')}>
                        <ul className="space-y-2">
                            {issues.map((issue) => (
                                <li key={issue.kind} className="flex items-start gap-2">
                                    <IssueIcon kind={issue.kind} className="mt-0.5" announce={false} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-medium">{issueLabel(issue, m)}</p>
                                        <p className="text-xs text-foreground/75">{m.t(ISSUE_COPY[issue.kind].fixKey)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                <Section title={m.t('splicewire-beam-ux::messages.sitemap_publication')} aside={<PublicationStatus page={page} compact />}>
                    <dl className="grid grid-cols-[7rem_1fr] gap-y-1.5 text-[13px]">
                        <dt className="text-foreground/70">{m.t('splicewire-beam-ux::messages.sitemap_readers_see')}</dt>
                        <dd>{page.publishedReadable ?? m.t('splicewire-beam-ux::messages.sitemap_nothing_yet')}</dd>
                        <dt className="text-foreground/70">{m.t('splicewire-beam-ux::messages.sitemap_working_draft')}</dt>
                        <dd>{page.headReadable ?? m.t('splicewire-beam-ux::messages.sitemap_none')}{state === 'draft' && <span className="text-foreground/70"> {m.t('splicewire-beam-ux::messages.sitemap_not_published_marker')}</span>}</dd>
                    </dl>
                </Section>
                <Section title={m.t('splicewire-beam-ux::messages.sitemap_search_engines')} aside={<SearchStatus page={page} iconOnly />}>
                    <p className="text-[13px]">{page.search.listed ? m.t('splicewire-beam-ux::messages.sitemap_listed_in_sitemap') : m.t('splicewire-beam-ux::messages.sitemap_left_out_of_sitemap')}</p>
                    <p className="text-xs text-foreground/70">{m.t(searchCopy(page.search.reason).longKey)}</p>
                </Section>
                {page.file && (
                    <Section title={m.t('splicewire-beam-ux::messages.sitemap_file')} aside={<FileStatus page={page} />}>
                        {page.file.path && <p className="break-all font-mono text-xs text-foreground/70">{page.file.path}</p>}
                        {page.file.lastModifiedAt && <p className="mt-1 text-xs text-foreground/70">{m.t('splicewire-beam-ux::messages.sitemap_last_written', { when: page.file.lastModifiedAt })}</p>}
                        {(page.file.state === 'not-written' || page.file.state === 'modified') && (
                            page.file.repairBlocked
                                ? <p className="mt-2 text-xs text-foreground/75">{REPAIR_BLOCKED[page.file.repairBlocked] ? m.t(REPAIR_BLOCKED[page.file.repairBlocked]) : m.t('splicewire-beam-ux::messages.sitemap_repair_none')}</p>
                                : canRepair && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {page.file.state === 'not-written'
                                            ? <Button size="sm" variant="secondary" className="h-9" onClick={() => onFileAction!('restore', page)}><RotateCcw />{m.t('splicewire-beam-ux::messages.sitemap_restore_file')}</Button>
                                            : <>
                                                <Button size="sm" variant="secondary" className="h-9" onClick={() => onFileAction!('take-draft', page)}>{m.t('splicewire-beam-ux::messages.sitemap_take_as_draft')}</Button>
                                                <Button size="sm" variant="outline" className="h-9" onClick={() => onFileAction!('overwrite', page)}>{m.t('splicewire-beam-ux::messages.sitemap_overwrite_with_published')}</Button>
                                            </>}
                                    </div>
                                )
                        )}
                    </Section>
                )}
                <Section title={m.t('splicewire-beam-ux::messages.sitemap_old_addresses_lead_here')}
                    aside={onAddRedirect && <Button size="sm" variant="ghost" className="-mr-2 h-8" onClick={() => onAddRedirect(page)}><Plus />{m.t('splicewire-beam-ux::messages.sitemap_add')}</Button>}>
                    {page.redirects.inbound.length === 0 ? (
                        <p className="text-xs text-foreground/70">{m.t('splicewire-beam-ux::messages.sitemap_no_old_addresses_hint')}</p>
                    ) : (
                        <ul className="space-y-3">{page.redirects.inbound.map((r) => <li key={r.id}><InboundLine redirect={r} onOpen={onOpenRedirect} /></li>)}</ul>
                    )}
                </Section>
            </div>
        </aside>
    );
}
