import { Head, Link } from '@inertiajs/react';

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

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-border bg-card p-5">
            <div className="font-mono text-3xl font-semibold">{value}</div>
            <div className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">
                {label}
            </div>
        </div>
    );
}

export default function OperatorDashboard({ staff, stats, surfaces }: Props) {
    const s = staff ?? { name: 'Operator', email: 'operator@example.test' };
    const st = stats ?? { users: 0, sitemaps: 0, entries: 0 };

    return (
        <div className="mx-auto max-w-4xl px-6 py-10">
            <Head title="Operator" />
            <h1 className="font-serif text-3xl font-semibold">Operator</h1>
            <p className="mt-1 text-sm text-muted-foreground">
                Signed in as {s.name} ({s.email})
            </p>

            <div className="mt-6 grid grid-cols-3 gap-4">
                <Stat label="Users" value={st.users} />
                <Stat label="Sitemaps" value={st.sitemaps} />
                <Stat label="UX entries" value={st.entries} />
            </div>

            {surfaces && surfaces.length > 0 && (
                <nav className="mt-8" aria-label="Operator surfaces" data-testid="operator-surfaces">
                    <h2 className="text-xs tracking-wide text-muted-foreground uppercase">
                        Surfaces
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
                This is the operator realm's front-end, framed by the promoted{' '}
                <code className="rounded bg-muted px-1 py-0.5">
                    @splicewire/beam-mainframe
                </code>{' '}
                Mainframe host. Resource lists are served by Frame's generic
                particle CRUD socket; this landing is a thin stats roll-up.
            </p>
        </div>
    );
}
