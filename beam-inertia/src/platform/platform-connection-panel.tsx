import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
    createPlatformConnectionClient,
    type PlatformConnectionClient,
} from './client';
import type {
    PlatformCapabilityRead,
    PlatformConnection,
    PlatformConnectionEndpoints,
    PlatformConnectionState,
} from './types';

/**
 * The operator-realm "Platform connection" surface: the whole satellite half of an RFC 8628 pairing,
 * as something an operator can drive without a terminal.
 *
 * ## What it is NOT
 *
 * It is not a replacement for `php artisan splicewire:connect`. Both spend the same device-flow
 * client and both write the same `.env` key, so a site paired from the CLI shows as paired here and
 * can be disconnected here — and vice versa. The CLI stays the supported headless path.
 *
 * ## The six states, and why each is its own branch
 *
 * The temptation is two branches ("paired" / "not paired") with copy that hedges. That collapses the
 * three states an operator has to tell apart to know what to DO:
 *
 * - **denied** — someone said no at the tower. Retry is the move; the satellite is fine.
 * - **expired** — nobody answered in time. Retry is also the move, but nothing was refused, and
 *   saying "denied" here would send an operator to ask a colleague why they rejected it.
 * - **revoked** — a credential that DID work has been archived at the tower. The satellite still
 *   holds it and it still looks valid; only a spent request discovered the refusal. Re-pairing is
 *   the move, and "unpaired" would hide that a stale credential is still sitting in `.env`.
 *
 * ## The polling loop
 *
 * A browser cannot block on the grant, so the pending state polls the server's single-tick `poll`
 * operation at the interval RFC 8628 asked for. It stops on ANY terminal state and on unmount; the
 * ref-guard is what keeps a late response from a cancelled pairing out of the rendered state.
 */

type Props = {
    connection: PlatformConnection;
    endpoints: PlatformConnectionEndpoints;
    /** Substitutable for hosts with their own client runtime, and for tests. */
    client?: PlatformConnectionClient;
    /** How often the pending state asks the server. RFC 8628's `interval` floor is 5s. */
    pollIntervalMs?: number;
};

const STATE_COPY: Record<PlatformConnectionState, { label: string; tone: string; blurb: string }> = {
    unpaired: {
        label: 'Not connected',
        tone: 'bg-muted text-muted-foreground',
        blurb: 'This site holds no platform credential. Start a pairing to connect it to your tower.',
    },
    pending: {
        label: 'Awaiting approval',
        tone: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
        blurb: 'A pairing request is open. Approve it on the tower with the code below.',
    },
    paired: {
        label: 'Connected',
        tone: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
        blurb: 'This site holds a live platform credential.',
    },
    denied: {
        label: 'Denied',
        tone: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
        blurb: 'The pairing request was refused at the tower. Nothing was issued. You can request a new code.',
    },
    expired: {
        label: 'Expired',
        tone: 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200',
        blurb: 'The pairing code ran out before anyone answered it. Nothing was refused — request a new code.',
    },
    revoked: {
        label: 'Revoked',
        tone: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
        blurb: 'The platform has refused this site’s credential — it was archived at the tower. The stale credential is still stored here; pair again to restore the connection.',
    },
};

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-1.5 text-sm">
            <span className="w-36 shrink-0 text-muted-foreground">{label}</span>
            <span className="min-w-0 break-all">{children}</span>
        </div>
    );
}

export function PlatformConnectionPanel({
    connection: initial,
    endpoints,
    client: injected,
    pollIntervalMs = 5000,
}: Props) {
    const client = useMemo(
        () => injected ?? createPlatformConnectionClient(endpoints),
        [injected, endpoints],
    );

    const [connection, setConnection] = useState<PlatformConnection>(initial);
    const [capability, setCapability] = useState<PlatformCapabilityRead | null>(null);
    const [label, setLabel] = useState<string>('');
    const [surface, setSurface] = useState<string>('circuit-node');
    const [busy, setBusy] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Guards every async settle. Without it a poll that returns after the operator disconnected
    // re-renders the pairing they just cancelled — the classic "it came back on its own" bug.
    const live = useRef(true);
    useEffect(() => {
        live.current = true;

        return () => {
            live.current = false;
        };
    }, []);

    const run = useCallback(
        async <T,>(name: string, work: () => Promise<T>, settle: (value: T) => void) => {
            setBusy(name);
            setError(null);

            try {
                const value = await work();
                if (live.current) settle(value);
            } catch (e) {
                if (live.current) setError(e instanceof Error ? e.message : 'Something went wrong.');
            } finally {
                if (live.current) setBusy(null);
            }
        },
        [],
    );

    const onConnect = () =>
        run('connect', () => client.connect(label.trim() === '' ? null : label.trim()), (next) => {
            setConnection(next);
            // A fresh pairing invalidates the previous credential's capability read: showing the old
            // result beside a new pending grant would claim a capability this site cannot yet spend.
            setCapability(null);
        });

    const onDisconnect = () =>
        run('disconnect', () => client.disconnect(), (next) => {
            setConnection(next);
            setCapability(null);
        });

    const onInvoke = () =>
        run('invoke', () => client.invokeCapability(surface), (result) => {
            setCapability(result);

            // A 401 is a state change, not just a failed read — the credential has been revoked at
            // the tower. The server has already recorded it; re-reading is what makes the badge
            // agree with the result the operator is looking at, in the same interaction.
            if (result.status === 401) {
                void client.poll().then((next) => {
                    if (live.current) setConnection(next);
                });
            }
        });

    // The pending poll loop. Deliberately re-entrant-safe by interval rather than by recursion, so a
    // slow tick cannot stack ticks behind it.
    useEffect(() => {
        if (connection.state !== 'pending') return;

        let cancelled = false;

        const tick = async () => {
            try {
                const next = await client.poll();
                if (!cancelled && live.current) setConnection(next);
            } catch {
                // A failed tick is not a verdict. The grant's own expiry is what ends a flow nobody
                // answers; a transport blip must not report the pairing as failed.
            }
        };

        const handle = window.setInterval(() => void tick(), pollIntervalMs);

        return () => {
            cancelled = true;
            window.clearInterval(handle);
        };
    }, [connection.state, client, pollIntervalMs]);

    const copy = STATE_COPY[connection.state];

    return (
        <div className="mx-auto max-w-3xl px-6 py-10" data-testid="platform-connection">
            <h1 className="font-serif text-3xl font-semibold">Platform connection</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                How this site pairs with its Splicewire tower, and what that pairing can do.
            </p>

            <div className="mt-6 rounded-xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-3">
                    <Badge className={copy.tone} data-testid="connection-state">
                        {copy.label}
                    </Badge>
                    <span className="sr-only" data-testid="connection-state-value">
                        {connection.state}
                    </span>
                </div>

                <p className="mt-3 text-sm text-muted-foreground" data-testid="connection-blurb">
                    {copy.blurb}
                </p>

                <div className="mt-4 border-t border-border pt-3">
                    <Row label="Platform">
                        <span data-testid="platform-url">
                            {connection.platformUrl ?? 'Not configured'}
                        </span>
                    </Row>
                    {connection.state === 'paired' && (
                        <Row label="Paired as">
                            <span data-testid="platform-identity">
                                {connection.identity
                                    ? `${connection.identity.name ?? 'Unknown'} (${connection.identity.email ?? '—'})`
                                    : (connection.identityError ?? 'Not yet confirmed')}
                            </span>
                        </Row>
                    )}
                    {connection.label && <Row label="Label">{connection.label}</Row>}
                    <Row label="Credential stored">
                        <span data-testid="token-present">
                            {connection.tokenPresent ? 'Yes' : 'No'}
                        </span>
                    </Row>
                </div>
            </div>

            {connection.state === 'pending' && (
                <div
                    className="mt-4 rounded-xl border border-border bg-card p-5"
                    data-testid="pending-panel"
                >
                    <div className="text-xs tracking-wide text-muted-foreground uppercase">
                        Enter this code at the tower
                    </div>
                    <div
                        className="mt-2 font-mono text-3xl font-semibold tracking-widest"
                        data-testid="user-code"
                    >
                        {connection.userCode}
                    </div>
                    {connection.verificationUri && (
                        <p className="mt-3 text-sm">
                            <a
                                className="underline"
                                data-testid="verification-uri"
                                href={
                                    connection.verificationUriComplete ??
                                    connection.verificationUri
                                }
                                target="_blank"
                                rel="noreferrer"
                            >
                                {connection.verificationUri}
                            </a>
                        </p>
                    )}
                    {connection.expiresAt && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            This code expires at{' '}
                            {new Date(connection.expiresAt).toLocaleTimeString()}.
                        </p>
                    )}
                    <div className="mt-4 flex gap-2">
                        <Button
                            variant="secondary"
                            disabled={busy !== null}
                            onClick={() =>
                                run('poll', () => client.poll(), setConnection)
                            }
                        >
                            Check now
                        </Button>
                        <Button
                            variant="ghost"
                            disabled={busy !== null}
                            onClick={onDisconnect}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {connection.state !== 'pending' && (
                <div className="mt-4 rounded-xl border border-border bg-card p-5">
                    <h2 className="text-lg font-semibold">
                        {connection.state === 'paired'
                            ? 'Re-pair this site'
                            : 'Pair this site'}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        The tower names the credential it issues after this label, so make it
                        something you will recognise when you come to archive it.
                    </p>
                    <div className="mt-3 flex flex-wrap items-end gap-3">
                        <div className="grow">
                            <Label htmlFor="pairing-label">Label</Label>
                            <Input
                                id="pairing-label"
                                data-testid="pairing-label"
                                value={label}
                                placeholder="this site’s hostname"
                                onChange={(e) => setLabel(e.target.value)}
                            />
                        </div>
                        <Button
                            data-testid="connect"
                            disabled={busy !== null || connection.platformUrl === null}
                            onClick={onConnect}
                        >
                            {busy === 'connect' ? 'Requesting…' : 'Start pairing'}
                        </Button>
                    </div>
                </div>
            )}

            <div className="mt-4 rounded-xl border border-border bg-card p-5">
                <h2 className="text-lg font-semibold">Platform capabilities</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Spend this site’s pairing on a real read: ask the tower which capabilities it
                    publishes for a surface. This is the credential doing work, not a local echo.
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                    <div>
                        <Label htmlFor="capability-surface">Surface</Label>
                        <select
                            id="capability-surface"
                            data-testid="capability-surface"
                            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                            value={surface}
                            onChange={(e) => setSurface(e.target.value)}
                        >
                            <option value="circuit-node">circuit-node</option>
                            <option value="chat-tool">chat-tool</option>
                        </select>
                    </div>
                    <Button
                        data-testid="invoke-capability"
                        variant="secondary"
                        disabled={busy !== null || !connection.tokenPresent}
                        onClick={onInvoke}
                    >
                        {busy === 'invoke' ? 'Asking…' : 'Read capabilities'}
                    </Button>
                </div>

                {capability && (
                    <div className="mt-4" data-testid="capability-result">
                        {capability.ok ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    <span data-testid="capability-count">
                                        {capability.capabilities.length}
                                    </span>{' '}
                                    capabilities published for{' '}
                                    <code className="rounded bg-muted px-1 py-0.5">
                                        {capability.surface}
                                    </code>
                                    .
                                </p>
                                <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
                                    {capability.capabilities.map((c) => (
                                        <li
                                            key={c.name}
                                            className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm"
                                            data-testid={`capability-${c.name}`}
                                        >
                                            <span className="font-medium">
                                                {c.label ?? c.name}
                                            </span>
                                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                                {c.name}
                                            </code>
                                            {c.binding && (
                                                <span className="text-xs text-muted-foreground">
                                                    {c.binding}
                                                </span>
                                            )}
                                            {c.requiredEntitlement && (
                                                <span className="ml-auto text-xs text-amber-700 dark:text-amber-400">
                                                    needs {c.requiredEntitlement}
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        ) : (
                            <p
                                className="text-sm text-red-700 dark:text-red-400"
                                data-testid="capability-error"
                            >
                                {capability.error}
                            </p>
                        )}
                    </div>
                )}
            </div>

            {connection.tokenPresent && (
                <div className="mt-4 rounded-xl border border-border bg-card p-5">
                    <h2 className="text-lg font-semibold">Disconnect</h2>
                    {/*
                      The wording is load-bearing. This button clears the LOCAL credential and nothing
                      else — no remote revoke exists on the platform's client surface, and
                      `SatelliteUninstallCommand` draws the same boundary. Calling it "Revoke" would
                      tell an operator a security action had happened that had not.
                    */}
                    <p className="mt-1 text-sm text-muted-foreground">
                        Clears the credential stored on this site. It does{' '}
                        <strong>not</strong> revoke the credential at the tower — archive it there
                        too, or anyone holding a copy can still use it.
                    </p>
                    <Button
                        className="mt-3"
                        variant="destructive"
                        data-testid="disconnect"
                        disabled={busy !== null}
                        onClick={onDisconnect}
                    >
                        {busy === 'disconnect' ? 'Clearing…' : 'Disconnect this site'}
                    </Button>
                </div>
            )}

            {error && (
                <p
                    className="mt-4 text-sm text-red-700 dark:text-red-400"
                    data-testid="panel-error"
                >
                    {error}
                </p>
            )}
        </div>
    );
}

export default PlatformConnectionPanel;
