import type { ColumnDef } from '@tanstack/react-table';
import {
    Archive,
    CalendarClock,
    Check,
    Copy,
    MoreHorizontal,
    Plus,
    RotateCw,
    Trash2,
    TriangleAlert,
} from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import {
    Badge,
    Button,
    cn,
    DataTable,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
    Label,
    Popover,
    PopoverContent,
    PopoverTrigger,
    SimpleSelect,
} from '@schemastud/ui';
import {
    useArchiveToken,
    useCreateToken,
    usePermanentlyDeleteToken,
    usePermissions,
    useRenewToken,
    useRevokeOtherSessions,
    useRotateToken,
    useTokens,
} from './hooks';
import { useNotify, useTokensServices } from './provider';
import type { ApiTokenData, CreatedTokenData, TokenProvenance } from './types';
import {
    asProvenance,
    errorMessage,
    EXPIRY_OPTIONS,
    FACETS,
    formatDate,
    isExpired,
    PROVENANCE_BADGE,
    PROVENANCE_LABEL,
} from './utils';

// Client-side sortable fields (the table sorts in-memory — tokens is a small bespoke list,
// not a server resource — while reusing the shared DataTable sort model).
const SORTABLE_FIELDS = new Set(['name', 'created', 'last_used', 'expires']);
const PAGE_SIZE = 10;

type Lifecycle = { token: ApiTokenData; action: 'renew' | 'rotate' };

/**
 * The API-keys / tokens management surface — portable, tenancy-agnostic, DTO-first. Owns its
 * react-query data logic; takes transport + feedback + host chrome as injected services (see
 * `<TokensProvider>`). Types off the generated `ApiTokenData` projection.
 */
export function TokensPage() {
    const { renderTokenActivity } = useTokensServices();
    const notify = useNotify();
    const tokens = useTokens();
    const archiveToken = useArchiveToken();
    const deleteToken = usePermanentlyDeleteToken();
    const renewToken = useRenewToken();
    const rotateToken = useRotateToken();
    const revokeOthers = useRevokeOtherSessions();

    // Facet filter — additive toggles, defaulting to the user's deliberate API tokens. Deselecting
    // everything falls back to showing all, so the page is never a blank screen.
    const [active, setActive] = useState<Set<TokenProvenance>>(
        () => new Set<TokenProvenance>(['api']),
    );
    // Archived (soft-revoked) tokens are retained for audit but hidden until asked for.
    const [showArchived, setShowArchived] = useState(false);

    // Confirm dialog target: one token to archive, or the "other sessions" sweep.
    const [target, setTarget] = useState<ApiTokenData | 'other-sessions' | null>(null);
    // Permanent-delete confirm target (archived tokens only).
    const [deleteTarget, setDeleteTarget] = useState<ApiTokenData | null>(null);
    // Renew/rotate expiry dialog.
    const [lifecycle, setLifecycle] = useState<Lifecycle | null>(null);
    // Reveal-once secret from a rotate (create has its own inside CreateTokenDialog).
    const [rotated, setRotated] = useState<CreatedTokenData | null>(null);
    // Client-side sort state (same comma-joined `sort` model the shared table uses).
    const [sort, setSort] = useState<string | null>(null);

    const all = tokens.data ?? [];

    const rows = useMemo(
        () =>
            all.filter(
                (t) =>
                    (showArchived || !t.archived_at) &&
                    (active.size === 0 || active.has(asProvenance(t.provenance))),
            ),
        [all, active, showArchived],
    );

    const otherSessionCount = useMemo(
        () =>
            all.filter((t) => t.provenance === 'session' && !t.is_current && !t.archived_at).length,
        [all],
    );
    const archivedCount = useMemo(() => all.filter((t) => !!t.archived_at).length, [all]);

    const busy =
        archiveToken.isPending ||
        deleteToken.isPending ||
        renewToken.isPending ||
        rotateToken.isPending ||
        revokeOthers.isPending;

    const columns = useMemo<ColumnDef<ApiTokenData, unknown>[]>(
        () => [
            {
                header: 'Name',
                meta: { sortField: 'name', sortAccessor: (t) => t.name.toLowerCase() },
                cell: ({ row }) => (
                    <div className="flex max-w-[12rem] items-center gap-2">
                        <span className="truncate font-medium" title={row.original.name}>
                            {row.original.name}
                        </span>
                        {row.original.is_current && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                                This session
                            </Badge>
                        )}
                        {row.original.archived_at && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                                Archived
                            </Badge>
                        )}
                    </div>
                ),
            },
            {
                header: 'Type',
                cell: ({ row }) => {
                    const provenance = asProvenance(row.original.provenance);
                    return (
                        <Badge variant={PROVENANCE_BADGE[provenance]}>
                            {PROVENANCE_LABEL[provenance]}
                        </Badge>
                    );
                },
            },
            {
                header: 'Scope',
                cell: ({ row }) => <ScopeChips abilities={row.original.abilities} />,
            },
            {
                header: 'Created',
                meta: { sortField: 'created', sortAccessor: (t) => t.created_at },
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.created_at ? formatDate(row.original.created_at) : '—'}
                    </span>
                ),
            },
            {
                header: 'Last used',
                meta: { sortField: 'last_used', sortAccessor: (t) => t.last_used_at },
                cell: ({ row }) => (
                    <span className="text-muted-foreground">
                        {row.original.last_used_at
                            ? formatDate(row.original.last_used_at)
                            : 'Never'}
                    </span>
                ),
            },
            {
                header: 'Expires',
                meta: { sortField: 'expires', sortAccessor: (t) => t.expires_at },
                cell: ({ row }) => {
                    const token = row.original;
                    if (!token.expires_at) {
                        return <span className="text-muted-foreground">Never</span>;
                    }
                    const expired = isExpired(token);
                    return (
                        <span
                            className={cn('text-muted-foreground', expired && 'text-destructive')}
                        >
                            {formatDate(token.expires_at)}
                            {expired ? ' · expired' : ''}
                        </span>
                    );
                },
            },
            {
                id: 'actions',
                header: () => <span className="sr-only">Actions</span>,
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-0.5">
                        {/* Host chrome slot (contract §1): the host injects e.g. an activity-log
                            popover, gated by its own permissions. Absent → nothing renders. */}
                        {renderTokenActivity?.(row.original)}
                        <RowActions
                            token={row.original}
                            disabled={busy}
                            onRenew={() => setLifecycle({ token: row.original, action: 'renew' })}
                            onRotate={() => setLifecycle({ token: row.original, action: 'rotate' })}
                            onArchive={() => setTarget(row.original)}
                            onDelete={() => setDeleteTarget(row.original)}
                        />
                    </div>
                ),
            },
        ],
        [busy, renderTokenActivity],
    );

    function toggleFacet(facet: TokenProvenance) {
        setActive((prev) => {
            const next = new Set(prev);
            if (next.has(facet)) next.delete(facet);
            else next.add(facet);
            return next;
        });
    }

    async function confirmArchive() {
        if (!target) return;
        try {
            if (target === 'other-sessions') {
                const result = await revokeOthers.mutateAsync();
                notify({ type: 'success', message: result.message });
            } else {
                const name = target.name;
                await archiveToken.mutateAsync(target.id);
                notify({ type: 'success', message: `Archived “${name}”.` });
            }
            setTarget(null);
        } catch {
            // The injected onError (contract §3) — or the host's own error net — surfaces it.
        }
    }

    async function confirmDelete() {
        if (!deleteTarget) return;
        try {
            const name = deleteTarget.name;
            await deleteToken.mutateAsync(deleteTarget.id);
            notify({ type: 'success', message: `Deleted “${name}”.` });
            setDeleteTarget(null);
        } catch {
            // handled by the injected onError / host error net.
        }
    }

    async function confirmLifecycle(expiresInDays: number | undefined) {
        if (!lifecycle) return;
        const { token, action } = lifecycle;
        try {
            if (action === 'renew') {
                await renewToken.mutateAsync({ id: token.id, expiresInDays });
                notify({ type: 'success', message: `Renewed “${token.name}”.` });
            } else {
                const created = await rotateToken.mutateAsync({ id: token.id, expiresInDays });
                setRotated(created);
            }
            setLifecycle(null);
        } catch {
            // handled by the injected onError / host error net.
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="font-semibold">API tokens</h2>
                    <p className="text-sm text-muted-foreground">
                        Personal access tokens for the api/v1 surface. Browser sessions and dev
                        tokens are tagged so you can filter them out.
                    </p>
                </div>
                {/* Create stays a HOST escape hatch — the reveal-once secret is security UX
                    frame's generic create can't express. */}
                <CreateTokenDialog />
            </div>

            {/* Facet bar + archived toggle + the "log out everywhere else" panic button. */}
            <div className="flex flex-wrap items-center gap-2">
                {FACETS.map((facet) => {
                    const on = active.has(facet);
                    return (
                        <Button
                            key={facet}
                            type="button"
                            size="sm"
                            variant={on ? 'secondary' : 'outline'}
                            aria-pressed={on}
                            className={cn('h-7 rounded-full px-3', on && 'ring-1 ring-ring')}
                            onClick={() => toggleFacet(facet)}
                        >
                            {PROVENANCE_LABEL[facet]}
                        </Button>
                    );
                })}
                {active.size === 0 && (
                    <span className="text-xs text-muted-foreground">Showing all types</span>
                )}
                {archivedCount > 0 && (
                    <Button
                        type="button"
                        size="sm"
                        variant={showArchived ? 'secondary' : 'outline'}
                        aria-pressed={showArchived}
                        className={cn('h-7 rounded-full px-3', showArchived && 'ring-1 ring-ring')}
                        onClick={() => setShowArchived((v) => !v)}
                    >
                        <Archive className="size-3.5" /> Archived ({archivedCount})
                    </Button>
                )}
                <div className="ml-auto">
                    {otherSessionCount > 0 && (
                        <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={busy}
                            onClick={() => setTarget('other-sessions')}
                        >
                            Revoke {otherSessionCount} other session
                            {otherSessionCount === 1 ? '' : 's'}
                        </Button>
                    )}
                </div>
            </div>

            <DataTable
                columns={columns}
                data={rows}
                loading={tokens.isPending}
                clientSort={{ sortableFields: SORTABLE_FIELDS, sort, onSortChange: setSort }}
                clientPageSize={PAGE_SIZE}
                rowClassName={(token) =>
                    token.archived_at || isExpired(token) ? 'opacity-60' : undefined
                }
                emptyMessage={
                    all.length === 0 ? 'No tokens yet.' : 'No tokens match the selected types.'
                }
            />

            <ArchiveConfirmDialog
                target={target}
                pending={busy}
                onCancel={() => setTarget(null)}
                onConfirm={confirmArchive}
            />

            <DeleteConfirmDialog
                target={deleteTarget}
                pending={busy}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />

            <LifecycleDialog
                lifecycle={lifecycle}
                pending={renewToken.isPending || rotateToken.isPending}
                onCancel={() => setLifecycle(null)}
                onConfirm={confirmLifecycle}
            />

            <SecretRevealDialog
                created={rotated}
                title="Token rotated"
                onOpenChange={(open) => !open && setRotated(null)}
            />
        </div>
    );
}

/** A token's granted scope as chips: one per permission, or a single "Full access" chip. */
function ScopeChips({ abilities }: { abilities: string[] | null }) {
    if (!abilities || abilities.length === 0) {
        return (
            <Badge variant="secondary" className="text-[10px]">
                Full access
            </Badge>
        );
    }
    return (
        <div className="flex max-w-xs flex-wrap gap-1">
            {abilities.map((ability) => (
                <Badge
                    key={ability}
                    variant="outline"
                    className="font-mono text-[10px] font-normal"
                >
                    {ability}
                </Badge>
            ))}
        </div>
    );
}

/** Per-row kebab. Live API tokens: renew / rotate / archive. Live session/dev/broker: archive.
 * Archived tokens: delete permanently (the audit log survives it). Current session: nothing. */
function RowActions({
    token,
    disabled,
    onRenew,
    onRotate,
    onArchive,
    onDelete,
}: {
    token: ApiTokenData;
    disabled: boolean;
    onRenew: () => void;
    onRotate: () => void;
    onArchive: () => void;
    onDelete: () => void;
}) {
    const [open, setOpen] = useState(false);

    // Never offer a one-click lockout of the session you're using.
    if (token.is_current) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    const archived = !!token.archived_at;
    // Renew/rotate only make sense for live, deliberate API tokens.
    const canManage = !archived && asProvenance(token.provenance) === 'api';

    function run(action: () => void) {
        setOpen(false);
        action();
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    aria-label={`Manage ${token.name}`}
                    disabled={disabled}
                >
                    <MoreHorizontal />
                </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1">
                {canManage && (
                    <>
                        <ActionItem icon={<CalendarClock />} onClick={() => run(onRenew)}>
                            Renew…
                        </ActionItem>
                        <ActionItem icon={<RotateCw />} onClick={() => run(onRotate)}>
                            Rotate…
                        </ActionItem>
                    </>
                )}
                {archived ? (
                    <ActionItem icon={<Trash2 />} destructive onClick={() => run(onDelete)}>
                        Delete permanently
                    </ActionItem>
                ) : (
                    <ActionItem icon={<Archive />} destructive onClick={() => run(onArchive)}>
                        Archive
                    </ActionItem>
                )}
            </PopoverContent>
        </Popover>
    );
}

function ActionItem({
    icon,
    children,
    destructive,
    onClick,
}: {
    icon: ReactNode;
    children: ReactNode;
    destructive?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent',
                destructive && 'text-destructive hover:text-destructive',
            )}
        >
            <span className="[&>svg]:size-4">{icon}</span>
            {children}
        </button>
    );
}

/**
 * Renew (extend, same secret) / rotate (fresh secret) — both pick a new lifetime. Copy makes the
 * difference plain, since rotate breaks existing clients and renew doesn't.
 */
function LifecycleDialog({
    lifecycle,
    pending,
    onCancel,
    onConfirm,
}: {
    lifecycle: Lifecycle | null;
    pending: boolean;
    onCancel: () => void;
    onConfirm: (expiresInDays: number | undefined) => void;
}) {
    const [expiresIn, setExpiresIn] = useState('30');
    const isRotate = lifecycle?.action === 'rotate';

    return (
        <Dialog
            open={lifecycle !== null}
            onOpenChange={(open) => {
                if (!open) onCancel();
                else setExpiresIn('30');
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isRotate ? 'Rotate' : 'Renew'} “{lifecycle?.token.name ?? ''}”?
                    </DialogTitle>
                    <DialogDescription>
                        {isRotate
                            ? 'Issues a new secret with the same name and scope, and archives the current one. Any client using the old secret must switch to the new one.'
                            : 'Extends the expiry. The secret is unchanged, so existing clients keep working.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-1.5">
                    <Label htmlFor="lifecycle-expiry">Expires</Label>
                    <SimpleSelect
                        id="lifecycle-expiry"
                        aria-label="New lifetime"
                        value={expiresIn}
                        onValueChange={setExpiresIn}
                        options={EXPIRY_OPTIONS}
                        className="w-full"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={pending}>
                        Cancel
                    </Button>
                    <Button
                        variant={isRotate ? 'destructive' : 'default'}
                        onClick={() => onConfirm(Number(expiresIn) || undefined)}
                        disabled={pending}
                    >
                        {pending ? 'Working…' : isRotate ? 'Rotate' : 'Renew'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Archive confirm — soft-revoking a credential stops any client using it, so it never fires on a
 * single click. The record is retained for audit (unlike the old hard delete).
 */
function ArchiveConfirmDialog({
    target,
    pending,
    onCancel,
    onConfirm,
}: {
    target: ApiTokenData | 'other-sessions' | null;
    pending: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const isSweep = target === 'other-sessions';
    return (
        <Dialog open={target !== null} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {isSweep
                            ? 'Revoke all other sessions?'
                            : `Archive “${target?.name ?? ''}”?`}
                    </DialogTitle>
                    <DialogDescription>
                        {isSweep
                            ? 'This logs out every other browser session. Your API tokens are not affected, and you stay signed in here.'
                            : 'The token stops working immediately and any client using it will fail. Its record is kept, archived, for audit — this cannot be undone.'}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={pending}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={pending}>
                        {pending ? 'Working…' : isSweep ? 'Revoke' : 'Archive'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Permanent-delete confirm — hard-deletes an archived token. The activity log retains the
 * event (with a name/scope snapshot), so deleting the row doesn't erase the audit trail.
 */
function DeleteConfirmDialog({
    target,
    pending,
    onCancel,
    onConfirm,
}: {
    target: ApiTokenData | null;
    pending: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={target !== null} onOpenChange={(open) => !open && onCancel()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete “{target?.name ?? ''}” permanently?</DialogTitle>
                    <DialogDescription>
                        This removes the archived token record entirely. The activity log keeps a
                        dated entry of it for audit, but the row itself is gone. This cannot be
                        undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={onCancel} disabled={pending}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={pending}>
                        {pending ? 'Working…' : 'Delete permanently'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/** The reveal-once secret panel, shared by create and rotate — shown once, never retrievable. */
function SecretRevealDialog({
    created,
    title,
    onOpenChange,
}: {
    created: CreatedTokenData | null;
    title: string;
    onOpenChange: (open: boolean) => void;
}) {
    const [copied, setCopied] = useState(false);

    async function copySecret() {
        if (!created) return;
        await navigator.clipboard.writeText(created.token);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <Dialog open={created !== null} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Copy the secret for “{created?.name}” now.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-start gap-2 rounded-md border border-amber-500/30 dark:border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/15 p-3 text-sm text-amber-600 dark:text-amber-400">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                    <span>
                        This secret is shown once and cannot be retrieved again. Store it somewhere
                        safe before closing this dialog.
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        readOnly
                        value={created?.token ?? ''}
                        className="font-mono text-xs"
                        onFocus={(event) => event.currentTarget.select()}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Copy token"
                        onClick={copySecret}
                    >
                        {copied ? <Check /> : <Copy />}
                    </Button>
                </div>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>Done</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Host reveal-once create dialog (FC-17 escape hatch): the plaintext secret is shown once on
 * the create response and never retrievable again. Uses the injected `create` adapter call.
 */
function CreateTokenDialog() {
    const createToken = useCreateToken();
    const permissions = usePermissions();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    // Access mode: 'full' reproduces an unscoped token; 'scoped' limits the token to a subset
    // of the minting user's own permissions (ADR-0109).
    const [mode, setMode] = useState<'full' | 'scoped'>('full');
    const [selected, setSelected] = useState<Set<string>>(() => new Set());
    // Lifetime preset in days; '0' means never expires.
    const [expiresIn, setExpiresIn] = useState('0');
    const [created, setCreated] = useState<CreatedTokenData | null>(null);

    // The picker is bounded by, and populated from, the user's OWN permissions — you can only
    // scope down from yourself, never up. Sorted for a stable, scannable list.
    const myPermissions = useMemo(
        () => [...(permissions.data ?? [])].sort((a, b) => a.localeCompare(b)),
        [permissions.data],
    );

    function openDialog() {
        setName('');
        setMode('full');
        setSelected(new Set());
        setExpiresIn('0');
        setCreated(null);
        createToken.reset();
        setOpen(true);
    }

    function togglePermission(permission: string) {
        setSelected((prev) => {
            const next = new Set(prev);
            if (next.has(permission)) next.delete(permission);
            else next.add(permission);
            return next;
        });
    }

    const scopeReady = mode === 'full' || selected.size > 0;

    async function submit(event: FormEvent) {
        event.preventDefault();
        if (!name.trim() || !scopeReady) return;
        const token = await createToken.mutateAsync({
            name: name.trim(),
            abilities: mode === 'scoped' ? [...selected] : undefined,
            expiresInDays: Number(expiresIn) || undefined,
        });
        setCreated(token);
        setOpen(false);
    }

    return (
        <>
            <Button onClick={openDialog}>
                <Plus /> New token
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <form onSubmit={submit} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>New API token</DialogTitle>
                            <DialogDescription>
                                Give the token a name, and choose how much of your access it may
                                use.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-1.5">
                            <Label htmlFor="token-name">Name</Label>
                            <Input
                                id="token-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="e.g. CI deploys"
                                autoFocus
                            />
                        </div>

                        {/* Access mode — Full access reproduces an unscoped token. */}
                        <div className="grid gap-1.5">
                            <Label>Access</Label>
                            <div className="grid grid-cols-2 gap-2">
                                {(
                                    [
                                        ['full', 'Full access', 'Acts as you'],
                                        ['scoped', 'Limited', 'Pick permissions'],
                                    ] as const
                                ).map(([value, title, hint]) => {
                                    const on = mode === value;
                                    return (
                                        <button
                                            key={value}
                                            type="button"
                                            aria-pressed={on}
                                            onClick={() => setMode(value)}
                                            className={cn(
                                                'rounded-md border px-3 py-2 text-left text-sm transition-colors',
                                                on
                                                    ? 'border-ring bg-accent ring-1 ring-ring'
                                                    : 'border-input hover:bg-accent/50',
                                            )}
                                        >
                                            <div className="font-medium">{title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {hint}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {mode === 'scoped' && (
                            <div className="grid gap-1.5">
                                <Label>
                                    Permissions{' '}
                                    <span className="text-xs font-normal text-muted-foreground">
                                        ({selected.size} selected)
                                    </span>
                                </Label>
                                {permissions.isLoading ? (
                                    <p className="text-sm text-muted-foreground">
                                        Loading your permissions…
                                    </p>
                                ) : myPermissions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">
                                        You hold no scopable permissions in this workspace.
                                    </p>
                                ) : (
                                    <div className="flex max-h-48 flex-wrap gap-1.5 overflow-y-auto rounded-md border p-2">
                                        {myPermissions.map((permission) => {
                                            const on = selected.has(permission);
                                            return (
                                                <button
                                                    key={permission}
                                                    type="button"
                                                    aria-pressed={on}
                                                    onClick={() => togglePermission(permission)}
                                                    className={cn(
                                                        'rounded-full border px-2.5 py-0.5 font-mono text-xs transition-colors',
                                                        on
                                                            ? 'border-ring bg-primary text-primary-foreground'
                                                            : 'border-input text-muted-foreground hover:bg-accent',
                                                    )}
                                                >
                                                    {permission}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {/* Honest framing (ADR-0109): scope is blast-radius control,
                                    not a trust boundary. */}
                                <p className="text-xs text-muted-foreground">
                                    Scope limits what a <em>leaked</em> token can do — it is not a
                                    trust boundary. A scoped token is still not safe to hand to
                                    someone you don&apos;t trust. It can never do more than you can,
                                    and stops working for a permission the moment you lose it.
                                </p>
                            </div>
                        )}

                        {/* Optional lifetime — the token stops working after this. */}
                        <div className="grid gap-1.5">
                            <Label htmlFor="token-expiry">Expires</Label>
                            <SimpleSelect
                                id="token-expiry"
                                aria-label="Token lifetime"
                                value={expiresIn}
                                onValueChange={setExpiresIn}
                                options={EXPIRY_OPTIONS}
                                className="w-full"
                            />
                        </div>

                        {createToken.isError && (
                            <p className="text-sm text-destructive">
                                {errorMessage(createToken.error, 'Could not create the token.')}
                            </p>
                        )}
                        <DialogFooter>
                            <Button
                                type="submit"
                                disabled={!name.trim() || !scopeReady || createToken.isPending}
                            >
                                {createToken.isPending ? 'Creating…' : 'Create token'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <SecretRevealDialog
                created={created}
                title="Token created"
                onOpenChange={(open) => !open && setCreated(null)}
            />
        </>
    );
}
