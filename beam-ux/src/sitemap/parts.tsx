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

/* ── Status vocabulary ─────────────────────────────────────────────────────────────────────── */

export function PublicationStatus({ page, compact = false }: { page: SiteMapPage; compact?: boolean }) {
    const state = publicationState(page);
    // A page with a draft is still live at its published version: say so first, then flag the pending draft.
    return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-foreground/75">
            <span aria-hidden className={cn('size-2 shrink-0 rounded-full', state === 'unpublished' ? 'border border-foreground/50' : 'bg-primary')} />
            {state === 'unpublished' ? <span className="text-foreground">Not published</span> : <span>Live {page.publishedReadable}</span>}
            {state === 'draft' && (
                <span className="inline-flex items-center gap-1 rounded bg-muted px-1 text-[11px] font-medium text-foreground">
                    draft {page.headReadable}{!compact && <span className="font-normal text-foreground/75"> pending</span>}
                </span>
            )}
        </span>
    );
}

/** Why the sitemap leaves a page out, in an author's words (`SitemapEligibility`'s reasons). */
export const SEARCH_COPY: Record<string, { short: string; long: string }> = {
    listed: { short: 'Listed', long: 'Search engines can find this page.' },
    'record-page': { short: 'Listed', long: 'Listed once per record a guest can read.' },
    unpublished: { short: 'Waits for publish', long: 'It will be listed once it is published.' },
    'hidden-ancestor': { short: 'Under an unpublished page', long: 'A page above it is not published, and a hidden page hides the pages under it.' },
    'not-listable': { short: 'Restricted or unlisted', long: 'Guests may not list it: it is for members only, or unlisted (readable by its link, never listed).' },
    'not-public': { short: 'Members only', long: 'Gated content is never listed.' },
    unplaced: { short: 'Not placed', long: 'It has no place in the page tree, so it has no address.' },
    'not-routable': { short: 'Not a public page', long: 'Only pages on the public site have an address in the sitemap.' },
    'no-records': { short: 'No public records', long: 'A record page is listed once per record a guest can read; none is readable.' },
};

const searchCopy = (reason: string) => SEARCH_COPY[reason] ?? { short: 'Not listed', long: 'Left out of the sitemap.' };

export function SearchStatus({ page, iconOnly = false }: { page: SiteMapPage; iconOnly?: boolean }) {
    const { listed, reason, urlCount } = page.search;
    const short = searchCopy(reason).short + (reason === 'record-page' ? ` · ${urlCount}` : '');
    const label = listed ? `In the sitemap: ${short}` : `Not in the sitemap: ${short}`;
    const Icon = listed ? Globe : reason === 'not-public' || reason === 'not-listable' ? Lock : EyeOff;
    return (
        <span title={label} className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-foreground/75">
            <Icon aria-hidden className="size-3.5 shrink-0" />
            {iconOnly ? <span className="sr-only">{label}</span> : <span className={cn(!listed && 'text-foreground')}>{short}</span>}
        </span>
    );
}

export const FILE_COPY: Record<string, { label: string; Icon: typeof FileCheck2; tone: string }> = {
    clean: { label: 'In sync', Icon: FileCheck2, tone: 'text-foreground/75' },
    modified: { label: 'Changed on disk', Icon: FileDiff, tone: 'text-warning-foreground dark:text-warning' },
    untracked: { label: 'Not committed', Icon: FilePlus2, tone: 'text-foreground/75' },
    'untracked-ignored': { label: 'Ignored by git', Icon: FilePlus2, tone: 'text-foreground/75' },
    'not-written': { label: 'File missing', Icon: FileX2, tone: 'text-destructive' },
    'mirror-disabled': { label: 'No file mirror', Icon: CircleDashed, tone: 'text-foreground/75' },
    'no-git-repo': { label: 'Outside git', Icon: FileWarning, tone: 'text-foreground/75' },
    'not-yet-saved': { label: 'Not saved yet', Icon: FileClock, tone: 'text-foreground/75' },
};

const fileCopy = (state: string) => FILE_COPY[state] ?? { label: state, Icon: FileWarning, tone: 'text-foreground/75' };

export function FileStatus({ page, iconOnly = false }: { page: SiteMapPage; iconOnly?: boolean }) {
    if (!page.file) return null;
    const { label, Icon, tone } = fileCopy(page.file.state);
    return (
        <span title={`File: ${label}`} className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-xs', tone)}>
            <Icon aria-hidden className="size-3.5 shrink-0" />
            {iconOnly ? <span className="sr-only">File: {label}</span> : <span>{label}</span>}
        </span>
    );
}

export function RedirectCount({ page }: { page: SiteMapPage }) {
    const { count, attention, maxHops } = page.redirects;
    if (count === 0) return <span className="text-xs text-foreground/50"><span aria-hidden>·</span><span className="sr-only">No old addresses</span></span>;
    return (
        <span title={`${count} old address${count === 1 ? '' : 'es'} lead here`}
            className={cn('inline-flex items-center gap-1 text-xs tabular-nums', attention ? 'text-destructive' : 'text-foreground/75')}>
            <CornerDownRight aria-hidden className="size-3.5" />{count}
            <span className="sr-only"> old address{count === 1 ? '' : 'es'} lead here{attention ? ', and one fails a guest' : maxHops > 1 ? `, the longest through ${maxHops} redirects` : ''}</span>
        </span>
    );
}

export const ISSUE_COPY: Record<Issue['kind'], { label: string; plural: string; fix: string; action: string }> = {
    'file-missing': { label: 'File missing', plural: 'files missing', fix: 'Restore the file from the published version', action: 'Restore' },
    'file-changed': { label: 'File changed on disk', plural: 'files changed on disk', fix: 'Take the file as a draft, or overwrite it', action: 'Review' },
    'redirect-broken': { label: 'Old address fails a guest', plural: 'old addresses fail a guest', fix: 'Point it at a published page', action: 'Retarget' },
    'redirect-loop': { label: 'Redirect loop', plural: 'redirect loops', fix: 'Point one of them at a page', action: 'Fix' },
};

export function issueLabel(issue: Issue) {
    return (issue.count ?? 1) > 1 ? `${issue.count} ${ISSUE_COPY[issue.kind].plural}` : ISSUE_COPY[issue.kind].label;
}

export function IssueIcon({ kind, className, announce = true }: { kind: Issue['kind']; className?: string; announce?: boolean }) {
    const Icon = kind === 'file-missing' ? FileX2 : kind === 'file-changed' ? FileDiff : kind === 'redirect-loop' ? Repeat2 : TriangleAlert;
    return (
        <>
            <Icon aria-hidden className={cn('size-3.5 shrink-0', isSevere(kind) ? 'text-destructive' : 'text-warning-foreground dark:text-warning', className)} />
            {announce && <span className="sr-only">{ISSUE_COPY[kind].label}</span>}
        </>
    );
}

/* ── Redirect walks ────────────────────────────────────────────────────────────────────────── */

const END_COPY: Record<string, string> = {
    loop: 'Loops: guests get a 404',
    'too-long': 'Too many steps: guests get a 404',
    'dead-end': 'Ends on an unpublished page: guests get a 404',
    gone: 'Its target is gone: guests get a 404',
    denied: 'Only readers who may see the page get there',
};

const ORIGIN: Record<string, string> = {
    author: 'added by an author', publish: 'left by a move', release: 'left by a release', takedown: 'left by a takedown', record: 'left by a record',
};

function WalkMeta({ permanent, match, origin, end, hops }: { permanent: boolean; match: string; origin: string; end: string; hops: number }) {
    return (
        <p className="mt-0.5 text-xs text-foreground/70">
            {permanent ? '301 permanent' : '302 temporary'}
            {match === 'prefix' && ' · and everything under it'}
            {ORIGIN[origin] && <> · {ORIGIN[origin]}</>}
            {/* A chain answers in one response (ADR-0236 d9): its hops are information, never a warning. */}
            {end === 'answered' && hops > 1 && <> · through {hops} redirects</>}
            {END_COPY[end] && <span className={end === 'denied' ? '' : 'text-destructive'}> · {END_COPY[end]}</span>}
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
            <p className="flex flex-wrap items-center gap-x-1 gap-y-0.5 font-mono text-xs">
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

const PART_KINDS: { type: string; label: string; Icon: typeof Palette }[] = [
    { type: 'theme', label: 'Theme', Icon: Palette },
    { type: 'layout', label: 'Layouts', Icon: LayoutTemplate },
    { type: 'template', label: 'Templates', Icon: Layers },
    { type: 'component', label: 'Components', Icon: Puzzle },
];

/** The non-page entries the Site section opens with the same doors: the theme in its editor, the rest in the Entry editor. */
export function SiteParts({ parts, onOpen }: { parts: SitePart[]; onOpen: SiteMapActions['onOpen'] }) {
    if (parts.length === 0) return null;
    const known = new Set(PART_KINDS.map((k) => k.type));
    const groups = [...PART_KINDS, ...[...new Set(parts.map((p) => p.type).filter((t) => !known.has(t)))].map((type) => ({ type, label: type, Icon: Puzzle }))];
    return (
        <section aria-labelledby="site-parts-heading" className="border-t border-border px-4 py-4 md:px-6">
            <h2 id="site-parts-heading" className="text-[13px] font-semibold">Site parts</h2>
            <p className="mb-2 text-xs text-foreground/70">What pages are built from. Each opens in its editor.</p>
            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
                {groups.map(({ type, label, Icon }) => {
                    const items = parts.filter((p) => p.type === type);
                    if (items.length === 0) return null;
                    return (
                        <div key={type} className="min-w-0">
                            <h3 className="mb-1 flex items-center gap-1.5 text-xs font-medium text-foreground/70"><Icon aria-hidden className="size-3.5" />{label}</h3>
                            <ul>
                                {items.map((part) => (
                                    <li key={part.id}>
                                        <button type="button" onClick={() => onOpen({ kind: 'part', part })}
                                            className="flex min-h-8 w-full items-center rounded px-1.5 text-left text-[13px] hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                                            <span className="truncate">{part.type === 'theme' && !part.title ? 'Theme' : part.title || part.slug}</span>
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

const REPAIR_BLOCKED: Record<string, string> = {
    'no-release': 'No published Release holds this page yet, so there is nothing to repair the file from.',
    'pin-moved': 'The newest Release froze another version than the one readers see; publish a Release first.',
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
    const issues = issuesFor(page);
    const state = publicationState(page);
    const title = pageTitle(page);
    const canRepair = !!onFileAction && !!page.file?.repairMemberId;
    return (
        <aside aria-label={`${title} details`} data-testid="site-map-inspector"
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
                        <Button variant="ghost" size="icon" aria-label="Close details" onClick={onClose} className="-mr-2 -mt-1 size-9">
                            <X />
                        </Button>
                    )}
                </div>
                <div className="mt-4 flex gap-2">
                    <Button size="sm" className="h-9 flex-1" onClick={() => onOpen({ kind: 'page', page })}><PenLine />Open in editor</Button>
                    {onPageSettings && <Button size="sm" variant="outline" className="h-9" onClick={() => onPageSettings(page)}>Page settings</Button>}
                </div>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">
                {issues.length > 0 && (
                    <section aria-label="Issues on this page" className={cn('mx-5 mb-4 rounded-lg px-3 py-2.5', issues.some((i) => isSevere(i.kind)) ? 'bg-destructive/10' : 'bg-warning/10')}>
                        <ul className="space-y-2">
                            {issues.map((issue) => (
                                <li key={issue.kind} className="flex items-start gap-2">
                                    <IssueIcon kind={issue.kind} className="mt-0.5" announce={false} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[13px] font-medium">{issueLabel(issue)}</p>
                                        <p className="text-xs text-foreground/75">{ISSUE_COPY[issue.kind].fix}.</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                <Section title="Publication" aside={<PublicationStatus page={page} compact />}>
                    <dl className="grid grid-cols-[7rem_1fr] gap-y-1.5 text-[13px]">
                        <dt className="text-foreground/70">Readers see</dt>
                        <dd>{page.publishedReadable ?? 'Nothing yet'}</dd>
                        <dt className="text-foreground/70">Working draft</dt>
                        <dd>{page.headReadable ?? 'None'}{state === 'draft' && <span className="text-foreground/70"> · not published</span>}</dd>
                    </dl>
                </Section>
                <Section title="Search engines" aside={<SearchStatus page={page} iconOnly />}>
                    <p className="text-[13px]">{page.search.listed ? 'Listed in the sitemap' : 'Left out of the sitemap'}</p>
                    <p className="text-xs text-foreground/70">{searchCopy(page.search.reason).long}</p>
                </Section>
                {page.file && (
                    <Section title="File" aside={<FileStatus page={page} />}>
                        {page.file.path && <p className="break-all font-mono text-xs text-foreground/70">{page.file.path}</p>}
                        {page.file.lastModifiedAt && <p className="mt-1 text-xs text-foreground/70">Last written {page.file.lastModifiedAt}</p>}
                        {(page.file.state === 'not-written' || page.file.state === 'modified') && (
                            page.file.repairBlocked
                                ? <p className="mt-2 text-xs text-foreground/75">{REPAIR_BLOCKED[page.file.repairBlocked] ?? 'No Release member can repair this file.'}</p>
                                : canRepair && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {page.file.state === 'not-written'
                                            ? <Button size="sm" variant="secondary" className="h-9" onClick={() => onFileAction!('restore', page)}><RotateCcw />Restore file</Button>
                                            : <>
                                                <Button size="sm" variant="secondary" className="h-9" onClick={() => onFileAction!('take-draft', page)}>Take as draft</Button>
                                                <Button size="sm" variant="outline" className="h-9" onClick={() => onFileAction!('overwrite', page)}>Overwrite with published…</Button>
                                            </>}
                                    </div>
                                )
                        )}
                    </Section>
                )}
                <Section title="Old addresses that lead here"
                    aside={onAddRedirect && <Button size="sm" variant="ghost" className="-mr-2 h-8" onClick={() => onAddRedirect(page)}><Plus />Add</Button>}>
                    {page.redirects.inbound.length === 0 ? (
                        <p className="text-xs text-foreground/70">None. When this page moves, its old address is kept here automatically.</p>
                    ) : (
                        <ul className="space-y-3">{page.redirects.inbound.map((r) => <li key={r.id}><InboundLine redirect={r} onOpen={onOpenRedirect} /></li>)}</ul>
                    )}
                </Section>
            </div>
        </aside>
    );
}
