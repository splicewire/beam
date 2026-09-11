import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, Eraser, Info, Loader2, Shield, Trash2, X } from 'lucide-react';
import { Badge } from '@schemastud/ui';
import { Button } from '@schemastud/ui';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schemastud/ui';
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
    return (
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-4 py-2.5 text-sm text-muted-foreground">
            <Shield className="mt-0.5 size-4 flex-none" />
            <span>Only workspace admins can prune or erase retained data.</span>
        </div>
    );
}

// ── Card 1: Retention posture (real per-Published-Chat windows via embed.posture) ──────────────
function PostureCard() {
    const { policyDescription } = useRetentionServices();
    const posture = useRetentionPosture();
    const defaultDays = posture.data?.default_days ?? DEFAULT_RETENTION_DAYS;
    const chats = posture.data?.chats ?? [];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Retention posture</CardTitle>
                <CardDescription>
                    {policyDescription ?? <>Retention is a per-Published-Chat window that is snapshotted onto each session when it starts.</>}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* The load-bearing disclosure: retention is NOT auto-enforced. */}
                <div className="flex gap-3 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
                    <Info className="mt-0.5 size-4 flex-none" />
                    <p className="leading-relaxed">
                        Retention is <b>not auto-enforced</b> — nothing sweeps on a schedule. Sessions
                        past their window persist until you <b>prune</b> below. Default window is{' '}
                        <b>{defaultDays} days</b>.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Per-Published-Chat windows</Label>
                    {posture.isPending ? (
                        <div className="flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-6 text-sm text-muted-foreground">
                            <Loader2 className="size-4 animate-spin" /> Loading windows…
                        </div>
                    ) : posture.isError ? (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-4 text-center text-sm text-destructive">
                            {apiErrorMessage(posture.error, 'Could not load retention windows.')}
                        </div>
                    ) : chats.length === 0 ? (
                        <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                            No published chats yet. New chats default to a{' '}
                            <b>{defaultDays}-day</b> window.
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
                                            <span className="text-muted-foreground">Untitled chat</span>
                                        )}
                                    </span>
                                    <Badge variant="outline" className="flex-none tabular-nums">
                                        {chat.retention_days} days
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
                <CardTitle className="flex items-center gap-2">
                    <Trash2 className="size-4 text-muted-foreground" /> Prune by policy
                </CardTitle>
                <CardDescription>
                    Delete every embed session (and its messages) past its retention window. A
                    visitor's personal data drops once their last session is gone.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Dry-run preview — blast radius BEFORE the sweep runs (embed.prune-preview). */}
                <div className="flex items-center gap-3 rounded-md border bg-muted/40 px-3 py-2.5 text-sm">
                    <Info className="size-4 flex-none text-muted-foreground" />
                    {preview.isPending ? (
                        <span className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="size-3.5 animate-spin" /> Checking what would be
                            removed…
                        </span>
                    ) : preview.isError ? (
                        <span className="text-muted-foreground">
                            {apiErrorMessage(preview.error, 'Could not preview the prune.')}
                        </span>
                    ) : (
                        <span className="leading-tight text-muted-foreground">
                            <b className="text-foreground">{wouldPrune}</b> session
                            {wouldPrune === 1 ? '' : 's'} past their window would be removed by a prune
                            right now.
                        </span>
                    )}
                </div>

                {prune.isError && (
                    <p role="alert" className="text-sm text-destructive">
                        {apiErrorMessage(prune.error, 'Could not prune sessions.')}
                    </p>
                )}

                {result ? (
                    <div className="flex items-center gap-2 rounded-md border border-primary/25 bg-primary/5 px-3 py-2.5 text-sm">
                        <span className="size-2 rounded-full bg-primary" />
                        Pruned <b>{result.pruned}</b> session{result.pruned === 1 ? '' : 's'} past
                        their retention window.
                    </div>
                ) : null}

                <div className="flex items-center gap-3">
                    <Button
                        disabled={disabled || prune.isPending || (preview.isSuccess && wouldPrune === 0)}
                        onClick={runPrune}
                        variant="secondary"
                    >
                        <Trash2 className="size-4" />{' '}
                        {prune.isPending ? 'Pruning…' : 'Prune expired sessions'}
                    </Button>
                    {disabled ? (
                        <span className="text-xs text-muted-foreground">Admin required.</span>
                    ) : preview.isSuccess && wouldPrune === 0 ? (
                        <span className="text-xs text-muted-foreground">Nothing to prune.</span>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    );
}

// ── Card 3: Erase a subject (destructive — typed-ERASE confirm Dialog) ─────────────────────────
function EraseCard({ disabled }: { disabled: boolean }) {
    const erase = useEraseSubject();
    const [kind, setKind] = useState<EraseSubjectKind>('visitor_id');
    const [subjectId, setSubjectId] = useState('');
    const [open, setOpen] = useState(false);
    const [confirmText, setConfirmText] = useState('');
    const [receipt, setReceipt] = useState<(EraseResult & { kind: EraseSubjectKind; id: string }) | null>(
        null,
    );

    const canOpen = subjectId.trim().length > 0; // controller: "A visitor_id or session_id is required."
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
                <CardTitle className="flex items-center gap-2 text-destructive">
                    <Eraser className="size-4" /> Erase a subject
                </CardTitle>
                <CardDescription>
                    A subject-access erasure request. Provide exactly one of a visitor ID or session
                    ID. This erases the <b>person, not just their chats</b> — the visitor's personal
                    data drops when their last session goes. <b>Irreversible.</b>
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Radio visitor_id | session_id — the controller's "one required" rule. */}
                <div className="flex gap-2">
                    {(['visitor_id', 'session_id'] as EraseSubjectKind[]).map((k) => (
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
                                {k}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="grid gap-1.5">
                    <Label htmlFor="subject-id">
                        {kind === 'visitor_id' ? 'Visitor ID' : 'Session ID'}
                    </Label>
                    <Input
                        id="subject-id"
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        placeholder={kind === 'visitor_id' ? 'vis_…' : 'sess_…'}
                        className="font-mono"
                        disabled={disabled}
                    />
                    {!canOpen ? (
                        <p className="text-[11px] text-muted-foreground">
                            Provide exactly one of a visitor ID or session ID.
                        </p>
                    ) : null}
                </div>

                {erase.isError && !open && (
                    <p role="alert" className="text-sm text-destructive">
                        {apiErrorMessage(erase.error, 'Could not erase the subject.')}
                    </p>
                )}

                {receipt ? (
                    // Post-erase RECEIPT — the missing pre-erase list, after the fact.
                    <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
                        <Eraser className="mt-0.5 size-4 flex-none text-destructive" />
                        <div>
                            Erased <b>{receipt.erased}</b> session{receipt.erased === 1 ? '' : 's'} for{' '}
                            <code className="font-mono text-xs">
                                {receipt.kind === 'visitor_id' ? 'visitor' : 'session'} {receipt.id}
                            </code>
                            . This cannot be undone.
                        </div>
                    </div>
                ) : null}

                <div className="flex items-center gap-3">
                    <Button
                        variant="destructive"
                        disabled={disabled || !canOpen}
                        onClick={() => { setConfirmText(''); setOpen(true); }}
                    >
                        <Eraser className="size-4" /> Erase subject…
                    </Button>
                    {disabled ? (
                        <span className="text-xs text-muted-foreground">Admin required.</span>
                    ) : null}
                </div>
            </CardContent>

            {/* Confirm-destructive Dialog — irreversibility, scope-of-erasure, typed-ERASE gate. */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="size-5" />{' '}
                            Erase this {kind === 'visitor_id' ? 'visitor' : 'session'}?
                        </DialogTitle>
                        <DialogDescription asChild>
                            <div className="space-y-2">
                                <p>
                                    You are about to erase{' '}
                                    <code className="font-mono text-xs text-foreground">
                                        {kind === 'visitor_id' ? 'visitor' : 'session'}{' '}
                                        {subjectId || '—'}
                                    </code>
                                    . You are erasing the <b className="text-foreground">person</b>, not
                                    just their chats — every matching session and its messages are
                                    deleted, and the visitor's personal data drops when their last
                                    session goes.
                                </p>
                                <p className="font-medium text-destructive">
                                    This is irreversible. There is no undo and no recovery.
                                </p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-1.5">
                        <Label htmlFor="erase-confirm">
                            Type <span className="font-mono font-semibold">ERASE</span> to confirm
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

                    {erase.isError && <p role="alert" className="text-sm text-destructive">{apiErrorMessage(erase.error, 'Could not erase the subject.')}</p>}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={disabled || !canDestroy || erase.isPending}
                            onClick={runErase}
                        >
                            <Eraser className="size-4" />{' '}
                            {erase.isPending ? 'Erasing…' : 'Erase permanently'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}

// ── Card 4: Corpus/training consent read-out (real per-chat opt-in via embed.posture) ──────────
function CorpusConsentCard() {
    const posture = useRetentionPosture();
    const chats: RetentionPostureChat[] = posture.data?.chats ?? [];
    const optedIn = chats.filter((c) => c.corpus_optin).length;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase">
                        read-only
                    </Badge>
                    <CardTitle>Corpus / training consent</CardTitle>
                </div>
                <CardDescription>
                    Whether each Published Chat opted transcripts into corpus/training.{' '}
                    <b>Default: no.</b> Set on the Embed product surface — this is a read-out, not a
                    write path.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {posture.isPending ? (
                    <div className="flex items-center justify-center gap-2 rounded-md border border-dashed px-3 py-6 text-sm text-muted-foreground">
                        <Loader2 className="size-4 animate-spin" /> Loading consent…
                    </div>
                ) : posture.isError ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-4 text-center text-sm text-destructive">
                        {apiErrorMessage(posture.error, 'Could not load training consent.')}
                    </div>
                ) : chats.length === 0 ? (
                    <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
                        No published chats yet. New chats default to <b>opted out</b>.
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                            {optedIn === 0
                                ? 'No published chats have opted into corpus/training.'
                                : `${optedIn} of ${chats.length} published chat${chats.length === 1 ? '' : 's'} opted into corpus/training.`}
                        </p>
                        <div className="divide-y rounded-md border">
                            {chats.map((chat) => (
                                <div
                                    key={chat.id}
                                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                                >
                                    <span className="truncate">
                                        {chat.title || (
                                            <span className="text-muted-foreground">Untitled chat</span>
                                        )}
                                    </span>
                                    {chat.corpus_optin ? (
                                        <span className="flex flex-none items-center gap-1 text-xs font-medium text-warning-foreground">
                                            <Check className="size-3.5" /> opted in
                                        </span>
                                    ) : (
                                        <span className="flex flex-none items-center gap-1 text-xs text-muted-foreground">
                                            <X className="size-3.5" /> opted out
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
export function PrivacyRetentionPage({ canManage }: { canManage: boolean }) {
    const actionsDisabled = !canManage;
    return (
        <div className="space-y-6 py-2">
            <GovernanceBanner />

            <div className="mx-auto max-w-3xl space-y-6">
                <PostureCard />
                <PruneCard disabled={actionsDisabled} />
                <EraseCard disabled={actionsDisabled} />
                <CorpusConsentCard />
            </div>

            <p className="mx-auto max-w-3xl pt-2 text-[11px] leading-relaxed text-muted-foreground">
                Prune previews its blast radius, then runs immediately; erase runs immediately. Both
                report how many sessions were affected. A browsable per-session list is coming in a
                future update.
            </p>
        </div>
    );
}
