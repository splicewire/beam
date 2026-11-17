import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Eraser, Info, Loader2, Shield, Trash2, X } from 'lucide-react';
import { Badge } from '@schemastud/ui';
import { Button } from '@schemastud/ui';
import { Card, CardContent, CardDescription, CardHeader } from '@schemastud/ui';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@schemastud/ui';
import { Input } from '@schemastud/ui';
import { Label } from '@schemastud/ui';
import { cn } from '@schemastud/ui';
import {
    apiErrorMessage,
    type EraseResult,
    type EraseSubjectKind,
    type PruneResult,
    type RetentionPostureChat,
    useEraseSubject,
    usePrunePreview,
    usePruneSessions,
    useRetentionPosture,
    useRetentionServices,
} from './api';
import { useBeamEmbedMessages, type BeamEmbedMessageKey } from './messages';
import { richMessage } from './rich-message';

/**
 * Privacy & retention (admin-redesign ticket 10, graduated from prototype `ar10`). The tenant's
 * data-controller governance console over the DIE-11 embed retention API (POST embed/prune ·
 * DELETE embed/sessions — both route-name resolved, both return a bare count).
 *
 * SHAPE (admin-surface-polish ticket 03): the console now reads real policy. Two read lenses back the
 * posture + preview affordances — `embed.posture` enumerates each Published Chat's effective retention
 * window and corpus-training consent, and `embed.prune-preview` returns the dry-run count a prune WOULD
 * remove. Both are `require.admin` reads, route-name resolved. This retires the former "shown here soon"
 * / "preview coming soon" / "consent not surfaced yet" stubs. A per-Published-Chat default-window WRITE
 * path (and the fuller Frame session browser) stay the follow-up. This package owns the
 * shared console; the host supplies authorization, transport and product-specific policy wording.
 *
 * ACCESS LENS: the destructive retention endpoints are gated server-side by `require.admin` (tenant
 * admin/owner or Root) — a non-admin call is rejected. The ar10 prototype proposes a finer-grained
 * `manage-privacy` entitlement (narrower than the broad admin role); until that ships, this mirrors the
 * server's `require.admin` gate client-side (owner/admin/root) so destructive CTAs render disabled with
 * an "admin required" note for non-admins.
 */

/** EmbedRetention::DEFAULT_DAYS — the fallback window shown while the posture-read is loading. */
const DEFAULT_RETENTION_DAYS = 90;

// ── Governance note (friendly one-liner — no code identifiers) ─────────────────────────────────
function GovernanceBanner() {
    const m = useBeamEmbedMessages();
    return (
        <div className="mx-auto flex max-w-3xl items-start gap-2 rounded-md border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
            <Shield className="mt-0.5 size-4 flex-none" />
            <span>{m.t('splicewire-beam-embed::messages.banner')}</span>
        </div>
    );
}

// ── Card 1: Retention posture (real per-Published-Chat windows via embed.posture) ──────────────
function PostureCard() {
    const m = useBeamEmbedMessages();
    const { policyDescription } = useRetentionServices();
    const posture = useRetentionPosture();
    const defaultDays = posture.data?.default_days ?? DEFAULT_RETENTION_DAYS;
    const chats = posture.data?.chats ?? [];

    return (
        <Card>
            <CardHeader>
                <h2 className="font-semibold leading-none tracking-tight">{m.t('splicewire-beam-embed::messages.posture_title')}</h2>
                <CardDescription>
                    {policyDescription ?? m.t('splicewire-beam-embed::messages.posture_description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* The load-bearing disclosure: retention is NOT auto-enforced. */}
                <div className="flex gap-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
                    <Info className="mt-0.5 size-4 flex-none" />
                    <p className="leading-relaxed">
                        {richMessage(m, 'splicewire-beam-embed::messages.not_enforced', {
                            not_enforced: <b>{m.t('splicewire-beam-embed::messages.not_enforced_bold')}</b>,
                            prune: <b>{m.t('splicewire-beam-embed::messages.prune_bold')}</b>,
                            window: <b>{m.choice('splicewire-beam-embed::messages.days', defaultDays)}</b>,
                        })}
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>{m.t('splicewire-beam-embed::messages.windows_label')}</Label>
                    {posture.isPending ? (
                        <div className="flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-6 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" /> {m.t('splicewire-beam-embed::messages.windows_loading')}
                        </div>
                    ) : posture.isError ? (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-4 text-center text-sm text-destructive">
                            {apiErrorMessage(posture.error, m.t('splicewire-beam-embed::messages.windows_failed'))}
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                            {richMessage(m, 'splicewire-beam-embed::messages.windows_empty', {
                                window: <b>{m.choice('splicewire-beam-embed::messages.day_adjective', defaultDays)}</b>,
                            })}
                        </div>
                    ) : (
                        <div className="divide-y rounded-md border">
                            {chats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                                >
                                    <span className="truncate">
                                        {chat.title || (
                                            <span className="text-muted-foreground">{m.t('splicewire-beam-embed::messages.untitled')}</span>
                                        )}
                                    </span>
                                    <Badge variant="outline" className="flex-none tabular-nums">
                                        {m.choice('splicewire-beam-embed::messages.days', chat.retention_days)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

// ── Card 2: Prune by policy (dry-run preview + primary action; result receipt) ─────────────────
function PruneCard({ disabled }: { disabled: boolean }) {
    const m = useBeamEmbedMessages();
    const queryClient = useQueryClient();
    const prune = usePruneSessions();
    const preview = usePrunePreview();
    const [result, setResult] = useState<PruneResult | null>(null);

    const wouldPrune = preview.data?.would_prune ?? 0;

    function runPrune() {
        prune.mutate(undefined, {
            onSuccess: (data) => {
                setResult(data);
                // The sweep changed the world — refresh the dry-run count (and windows).
                queryClient.invalidateQueries({ queryKey: ['embed', 'prune-preview'] });
                queryClient.invalidateQueries({ queryKey: ['embed', 'posture'] });
            },
        });
    }

    return (
        <Card>
            <CardHeader>
                <h2 className="flex items-center gap-2 font-semibold leading-none tracking-tight">
                    <Trash2 className="size-4 text-muted-foreground" /> {m.t('splicewire-beam-embed::messages.prune_title')}
                </h2>
                <CardDescription>
                    {m.t('splicewire-beam-embed::messages.prune_description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Dry-run preview — blast radius BEFORE the sweep runs (embed.prune-preview). */}
                <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2.5 text-sm">
                    <Info className="size-4 flex-none text-muted-foreground" />
                    {preview.isPending ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="size-3.5 animate-spin" /> {m.t('splicewire-beam-embed::messages.prune_checking')}
                        </span>
                    ) : preview.isError ? (
                        <span className="text-muted-foreground">
                            {apiErrorMessage(preview.error, m.t('splicewire-beam-embed::messages.prune_preview_failed'))}
                        </span>
                    ) : (
                        <span className="leading-tight text-muted-foreground">
                            {richMessage(m, 'splicewire-beam-embed::messages.prune_preview', {
                                n: <b className="text-foreground">{wouldPrune}</b>,
                            }, wouldPrune)}
                        </span>
                    )}
                </div>

                {prune.isError && (
                    <p role="alert" className="text-sm text-destructive">
                        {apiErrorMessage(prune.error, m.t('splicewire-beam-embed::messages.prune_failed'))}
                    </p>
                )}

                {result ? (
                    <div className="flex items-center gap-2 rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm">
                        <span className="size-2 rounded-full bg-primary" />
                        {richMessage(m, 'splicewire-beam-embed::messages.pruned', {
                            n: <b>{result.pruned}</b>,
                        }, result.pruned)}
                    </div>
                ) : null}

                <div className="flex items-center gap-3">
                    <Button
                        disabled={disabled || prune.isPending || (preview.isSuccess && wouldPrune === 0)}
                        onClick={runPrune}
                        variant="secondary"
                    >
                        <Trash2 className="size-4" />{' '}
                        {prune.isPending ? m.t('splicewire-beam-embed::messages.pruning') : m.t('splicewire-beam-embed::messages.prune_action')}
                    </Button>
                    {disabled ? (
                        <span className="text-xs text-muted-foreground">{m.t('splicewire-beam-embed::messages.admin_required')}</span>
                    ) : preview.isSuccess && wouldPrune === 0 ? (
                        <span className="text-xs text-muted-foreground">{m.t('splicewire-beam-embed::messages.nothing_to_prune')}</span>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}

// ── Card 3: Erase a subject (destructive — typed-ERASE confirm Dialog) ─────────────────────────
// The erase subject selector shows human labels; the exact DTO key (visitorId/sessionId) still drives
// state, the request and the receipt (W6-09 / C32).
const SUBJECT_KIND_LABELS: Record<EraseSubjectKind, BeamEmbedMessageKey> = {
    visitorId: 'splicewire-beam-embed::messages.kind_visitor',
    sessionId: 'splicewire-beam-embed::messages.kind_session',
};

// The subject's kind as the receipt and the confirm name it (shown in code beside the id).
const SUBJECT_KIND_WORDS: Record<EraseSubjectKind, BeamEmbedMessageKey> = {
    visitorId: 'splicewire-beam-embed::messages.subject_visitor',
    sessionId: 'splicewire-beam-embed::messages.subject_session',
};

export function EraseCard({ disabled }: { disabled: boolean }) {
    const m = useBeamEmbedMessages();
    const erase = useEraseSubject();
    const [kind, setKind] = useState<EraseSubjectKind>('visitorId');
    const [subjectId, setSubjectId] = useState('');
    const [open, setOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [receipt, setReceipt] = useState<(EraseResult & { kind: EraseSubjectKind; id: string }) | null>(
        null,
    );

    const canOpen = subjectId.trim().length > 0; // controller: "A visitorId or sessionId is required."
    const canDestroy = confirmText.trim().toUpperCase() === 'ERASE';

    function runErase() {
        const id = subjectId.trim();
        erase.mutate(
            { kind, subjectId: id },
            {
                onSuccess: (data) => {
                    setReceipt({ ...data, kind, id });
                    setOpen(false);
                    setConfirmText('');
                },
            },
        );
    }

    return (
        // Destructive card — unmistakably tinted apart from the ink-on-paper cards above.
        <Card className="border-destructive/40 bg-destructive/[0.03]">
            <CardHeader>
                <h2 className="flex items-center gap-2 text-destructive font-semibold leading-none tracking-tight">
                    <Eraser className="size-4" /> {m.t('splicewire-beam-embed::messages.erase_title')}
                </h2>
                <CardDescription>
                    {richMessage(m, 'splicewire-beam-embed::messages.erase_description', {
                        person: <b>{m.t('splicewire-beam-embed::messages.erase_person_bold')}</b>,
                        irreversible: <b>{m.t('splicewire-beam-embed::messages.irreversible_bold')}</b>,
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Radio visitorId | sessionId — the controller's "one required" rule. */}
                <div className="flex gap-2">
                    {(['visitorId', 'sessionId'] as EraseSubjectKind[]).map((k) => (
                        <button
                            key={k}
                            type="button"
                            disabled={disabled}
                            onClick={() => setKind(k)}
                            className={cn(
                                'flex-1 rounded-md border px-3 py-2 text-left font-mono text-xs transition-colors disabled:opacity-50',
                                kind === k
                                    ? 'border-destructive/50 bg-destructive/10 text-destructive'
                                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50',
                            )}
                        >
                            <span className="flex items-center gap-1.5">
                                <span
                                    className={cn(
                                        'size-2 rounded-full',
                                        kind === k ? 'bg-destructive' : 'bg-muted-foreground/30',
                                    )}
                                />
                                {m.t(SUBJECT_KIND_LABELS[k])}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="grid gap-1.5">
                    <Label htmlFor="subject-id">{m.t(SUBJECT_KIND_LABELS[kind])}</Label>
                    <Input
                        id="subject-id"
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        placeholder={kind === 'visitorId' ? 'vis_…' : 'sess_…'}
                        className="font-mono"
                        disabled={disabled}
                    />
                    {!canOpen ? (
                        <p className="text-[11px] text-muted-foreground">
                            {m.t('splicewire-beam-embed::messages.provide_one')}
                        </p>
                    ) : null}
                </div>

                {erase.isError && !open && (
                    <p role="alert" className="text-sm text-destructive">
                        {apiErrorMessage(erase.error, m.t('splicewire-beam-embed::messages.erase_failed'))}
                    </p>
                )}

                {receipt ? (
                    // Post-erase RECEIPT — the missing pre-erase list, after the fact.
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
                        <Eraser className="mt-0.5 size-4 flex-none text-destructive" />
                        <div>
                            {richMessage(m, 'splicewire-beam-embed::messages.erased', {
                                n: <b>{receipt.erased}</b>,
                                subject: (
                                    <code className="font-mono text-xs">
                                        {m.t(SUBJECT_KIND_WORDS[receipt.kind])} {receipt.id}
                                    </code>
                                ),
                            }, receipt.erased)}
                        </div>
                    </div>
                ) : null}

                <div className="flex items-center gap-3">
                    <Button
                        variant="destructive"
                        disabled={disabled || !canOpen}
                        onClick={() => { setConfirmText(''); setOpen(true); }}
                    >
                        <Eraser className="size-4" /> {m.t('splicewire-beam-embed::messages.erase_action')}
                    </Button>
                    {disabled ? (
                        <span className="text-xs text-muted-foreground">{m.t('splicewire-beam-embed::messages.admin_required')}</span>
                    ) : null}
                </div>
            </CardContent>

            {/* Confirm-destructive Dialog — irreversibility, scope-of-erasure, typed-ERASE gate. */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="size-5" />{' '}
                            {kind === 'visitorId' ? m.t('splicewire-beam-embed::messages.confirm_title_visitor') : m.t('splicewire-beam-embed::messages.confirm_title_session')}
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-2">
                                <p>
                                    {richMessage(m, 'splicewire-beam-embed::messages.confirm_body', {
                                        subject: (
                                            <code className="font-mono text-xs text-foreground">
                                                {m.t(SUBJECT_KIND_WORDS[kind])}{' '}
                                                {subjectId || '—'}
                                            </code>
                                        ),
                                        person: <b className="text-foreground">{m.t('splicewire-beam-embed::messages.person_bold')}</b>,
                                    })}
                                </p>
                                <p className="font-medium text-destructive">
                                    {m.t('splicewire-beam-embed::messages.irreversible')}
                                </p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-1.5">
                        <Label htmlFor="erase-confirm">
                            {richMessage(m, 'splicewire-beam-embed::messages.type_to_confirm', {
                                token: <span className="font-mono font-semibold">ERASE</span>,
                            })}
                        </Label>
                        <Input
                            id="erase-confirm"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="ERASE"
                            className="font-mono"
                            autoComplete="off"
                        />
                    </div>

                    {erase.isError && <p role="alert" className="text-sm text-destructive">{apiErrorMessage(erase.error, m.t('splicewire-beam-embed::messages.erase_failed'))}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            {m.t('splicewire-beam-embed::messages.cancel')}
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={disabled || !canDestroy || erase.isPending}
                            onClick={runErase}
                        >
                            <Eraser className="size-4" />{' '}
                            {erase.isPending ? m.t('splicewire-beam-embed::messages.erasing') : m.t('splicewire-beam-embed::messages.erase_permanently')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// ── Card 4: Corpus/training consent read-out (real per-chat opt-in via embed.posture) ──────────
// Nothing writes `corpus_optin` yet (owner review 2026-11-02, 23-d; the write path is slice 23-3), so the
// copy says so instead of naming a surface that does not exist.
export function CorpusConsentCard() {
    const m = useBeamEmbedMessages();
    const posture = useRetentionPosture();
    const chats: RetentionPostureChat[] = posture.data?.chats ?? [];
    const optedIn = chats.filter((c) => c.corpus_optin).length;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        {m.t('splicewire-beam-embed::messages.read_only')}
                    </Badge>
                    <h2 className="font-semibold leading-none tracking-tight">{m.t('splicewire-beam-embed::messages.consent_title')}</h2>
                </div>
                <CardDescription>
                    {richMessage(m, 'splicewire-beam-embed::messages.consent_description', {
                        default: <b>{m.t('splicewire-beam-embed::messages.consent_default_bold')}</b>,
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {posture.isPending ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-6 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" /> {m.t('splicewire-beam-embed::messages.consent_loading')}
                    </div>
                ) : posture.isError ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-4 text-center text-sm text-destructive">
                        {apiErrorMessage(posture.error, m.t('splicewire-beam-embed::messages.consent_failed'))}
                    </div>
                ) : chats.length === 0 ? (
                    <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                        {richMessage(m, 'splicewire-beam-embed::messages.consent_empty', {
                            opted_out: <b>{m.t('splicewire-beam-embed::messages.opted_out')}</b>,
                        })}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                            {optedIn === 0
                                ? m.t('splicewire-beam-embed::messages.consent_none')
                                : m.choice('splicewire-beam-embed::messages.consent_summary', chats.length, { opted: optedIn, total: chats.length })}
                        </p>
                        <div className="divide-y rounded-md border">
                            {chats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                                >
                                    <span className="truncate">
                                        {chat.title || (
                                            <span className="text-muted-foreground">{m.t('splicewire-beam-embed::messages.untitled')}</span>
                                        )}
                                    </span>
                                    {chat.corpus_optin ? (
                                        <span className="flex flex-none items-center gap-1 text-xs font-medium text-warning-foreground">
                                            <Check className="size-3.5" /> {m.t('splicewire-beam-embed::messages.opted_in')}
                                        </span>
                                    ) : (
                                        <span className="flex flex-none items-center gap-1 text-xs text-muted-foreground">
                                            <X className="size-3.5" /> {m.t('splicewire-beam-embed::messages.opted_out')}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/**
 * The single-pane privacy governance console. Renders inside the Settings meta-area (SectionBar sub-tab
 * strip owns nav) — no prototype chrome.
 */
export function PrivacyRetentionPage({ canManage, title }: { canManage: boolean; /** Host-supplied page heading (UX03/C39); the package renders exactly one h1 from it. */ title?: string }) {
    const m = useBeamEmbedMessages();
    const actionsDisabled = !canManage;
    return (
        <div className="space-y-6 py-2">
            <h1 className="mx-auto max-w-3xl text-lg font-semibold tracking-tight">{title ?? m.t('splicewire-beam-embed::messages.page_title')}</h1>
            <GovernanceBanner />

            <div className="mx-auto max-w-3xl space-y-6">
                <PostureCard />
                <PruneCard disabled={actionsDisabled} />
                <EraseCard disabled={actionsDisabled} />
                <CorpusConsentCard />
            </div>

            <p className="mx-auto max-w-3xl pt-2 text-[11px] leading-relaxed text-muted-foreground">
                {m.t('splicewire-beam-embed::messages.footer')}
            </p>
        </div>
    );
}
