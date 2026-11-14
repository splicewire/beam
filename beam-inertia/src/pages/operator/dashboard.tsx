import { surfaceMessage } from '../../os/surface-message';
import { useBeamMessages } from '../../messages';
import { Head, Link } from '@inertiajs/react';
import { StatTile } from '@schemastud/ui';

/**
 * The operator back-office landing — a cross-model stats roll-up. An ordinary Inertia page the host owns
 * (the operator realm's front-end); the Frame/particle resource lists are served by Frame's generic CRUD
 * socket. Props are optional so the SAME component renders inside an OS window (which threads only shared
 * props) with sensible fallbacks.
 *
 * ## `surfaces` — the operator realm's door, and why it is here
 *
 * The operator realm has no navigation rail at any starter. `nav.yml` declares its seats and
 * `ux:seed-nav` writes them into the operator sitemap, but the signed-in chrome is the ACCOUNT
 * realm's `<AccountShell>` and nothing projects the operator sitemap — so every operator surface
 * beyond this landing is reachable by URL only, which is not reachable at all. (Measured on
 * fresh-tower.test 2026-09-12 and true of the satellite for the same reason.)
 *
 * Building a rail is a bigger change than one screen justifies, so this is the narrow fix: the host
 * hands its operator surfaces in, and the landing lists them. It degrades to today's page when the
 * prop is absent, and a real rail supersedes it rather than colliding with it.
 */
type Props = {
    staff?: { name: string; email: string };
    stats?: { users: number; sitemaps: number; entries: number };
    surfaces?: { title: string; href: string; blurb?: string | null }[];
};

export default function OperatorDashboard({ staff, stats, surfaces }: Props) {
    const m = useBeamMessages();
    const s = staff ?? { name: m.t('splicewire-beam-inertia::messages.surfaces_operator'), email: 'operator@example.test' };
    const st = stats ?? { users: 0, sitemaps: 0, entries: 0 };

    return (
        <div className="mx-auto max-w-4xl px-6 py-10">
            <Head title={m.t('splicewire-beam-inertia::messages.surfaces_operator')} />
            <h1 className="font-serif text-3xl font-semibold">{m.t('splicewire-beam-inertia::messages.surfaces_operator')}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                {m.t('splicewire-beam-inertia::messages.surfaces_signed_in', { name: s.name, email: s.email })}
            </p>

            {/* `@schemastud/ui`'s StatTile — the same tile frame's `stat-row` card draws, so this
                landing and the `{realm}-dashboard` leaf that supersedes it (realm-dashboards ticket
                05) read as one system. The `stats` prop itself is retired in that ticket. */}
            <div className="mt-6 grid grid-cols-3 gap-4">
                <StatTile label={m.t('splicewire-beam-inertia::messages.surfaces_users')} value={st.users} />
                <StatTile label={m.t('splicewire-beam-inertia::messages.surfaces_sitemaps')} value={st.sitemaps} />
                <StatTile label={m.t('splicewire-beam-inertia::messages.surfaces_ux_entries')} value={st.entries} />
            </div>

            {surfaces && surfaces.length > 0 && (
                <nav className="mt-8" aria-label={m.t('splicewire-beam-inertia::messages.surfaces_operator_surfaces')} data-testid="operator-surfaces">
                    <h2 className="text-xs tracking-wide text-muted-foreground uppercase">
                        {m.t('splicewire-beam-inertia::messages.surfaces_surfaces')}
                    </h2>
                    <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
                        {surfaces.map((surface) => (
                            <li key={surface.href}>
                                <Link
                                    href={surface.href}
                                    className="block px-4 py-3 hover:bg-muted/50"
                                >
                                    <span className="font-medium">{surface.title}</span>
                                    {surface.blurb && (
                                        <span className="mt-0.5 block text-sm text-muted-foreground">
                                            {surface.blurb}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
            )}

            <p className="mt-8 text-sm text-muted-foreground">
                {surfaceMessage(m, 'splicewire-beam-inertia::messages.surfaces_operator_explanation', { host: <code className="rounded bg-muted px-1 py-0.5">@splicewire/beam-mainframe</code> })}
            </p>
        </div>
    );
}
