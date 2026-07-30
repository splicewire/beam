/**
 * The clickable prototype index at the namespace root (`/_prototype`). Takes the SAME glob result as
 * `createPrototypeRoutes` (the host writes the compile-time macro; see that seam), so it lists every
 * prototype DYNAMICALLY and GROUPS them by per-effort subdir, with a filter to one group. Drop a
 * file, it appears here; add a subdir, it becomes a new group.
 *
 * `createPrototypeRoutes` auto-mounts this at the namespace root, so a host gets the index for free.
 * Brand-free: react-router `Link` + shadcn `Card`/`Badge` (peer `@schemastud/ui`) + `cn`.
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Badge, Card, CardDescription, CardHeader, CardTitle } from '@schemastud/ui';
import { cn as defaultCn, type Cn } from './cn';
import type { PrototypeGlob } from './createPrototypeRoutes';
import { NAMESPACE_DEFAULT, parsePrototypePath } from './discovery';

interface Entry {
    dir: string; // per-effort subdir, or 'root'
    slug: string; // flat route slug (basename minus ar/ticket prefix)
    ticket: string | null;
    title: string;
}

function toTitle(slug: string): string {
    const s = slug.replace(/-/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function toEntries(glob: PrototypeGlob): Entry[] {
    return Object.keys(glob)
        .map(parsePrototypePath)
        // `_`-prefixed dirs (_chrome, _fixtures) hold shared chrome + fixtures, not prototypes.
        .filter((p) => !p.isExcluded)
        .map(({ dir, slug, ticket }): Entry => ({ dir, slug, ticket, title: toTitle(slug) }))
        .sort(
            (a, b) =>
                a.dir.localeCompare(b.dir) ||
                (a.ticket ?? '').localeCompare(b.ticket ?? '') ||
                a.slug.localeCompare(b.slug),
        );
}

export interface GalleryProps {
    /** The host's `import.meta.glob` result (same one passed to `createPrototypeRoutes`). */
    glob: PrototypeGlob;
    /** Route namespace the prototypes mount under. Default `/_prototype`. */
    namespace?: string;
    /** Override the bundled `cn` (e.g. the host's tailwind-merge `cn`). */
    cn?: Cn;
}

export function Gallery({ glob, namespace = NAMESPACE_DEFAULT, cn = defaultCn }: GalleryProps) {
    const entries = useMemo(() => toEntries(glob), [glob]);
    const dirs = useMemo(() => Array.from(new Set(entries.map((e) => e.dir))).sort(), [entries]);

    const [filter, setFilter] = useState<string>('all');
    const shownDirs = useMemo(() => (filter === 'all' ? dirs : [filter]), [filter, dirs]);

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border px-8 py-6">
                <div className="mx-auto flex max-w-5xl flex-wrap items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold tracking-tight">Prototype gallery</h1>
                            <Badge variant="outline" className="font-mono text-[10px] uppercase">
                                dev · throwaway
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {entries.length} real-React prototypes across {dirs.length}{' '}
                            {dirs.length === 1 ? 'group' : 'groups'}, auto-discovered from the
                            prototype glob. Many carry a{' '}
                            <code className="font-mono text-xs">?variant</code> switcher.
                        </p>
                    </div>
                    {dirs.length > 1 && (
                        <label className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Filter</span>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="rounded-md border border-input bg-background px-2.5 py-1.5 text-sm shadow-sm"
                            >
                                <option value="all">All groups ({entries.length})</option>
                                {dirs.map((d) => (
                                    <option key={d} value={d}>
                                        {d} ({entries.filter((e) => e.dir === d).length})
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                </div>
            </header>

            <main className="mx-auto max-w-5xl space-y-10 px-8 py-8">
                {shownDirs.map((dir) => {
                    const rows = entries.filter((e) => e.dir === dir);
                    if (!rows.length) return null;
                    return (
                        <section key={dir} className="space-y-3">
                            <h2 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                                {dir} · {rows.length}
                            </h2>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {rows.map((e) => (
                                    <Link
                                        key={e.slug}
                                        to={`${namespace}/${e.slug}`}
                                        className={cn(
                                            'group block rounded-lg transition-transform hover:-translate-y-0.5',
                                        )}
                                    >
                                        <Card className="h-full transition-colors group-hover:border-primary/50">
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    {e.ticket && (
                                                        <span className="font-mono text-xs text-primary">
                                                            {e.ticket}
                                                        </span>
                                                    )}
                                                    <CardTitle className="text-base">
                                                        {e.title}
                                                    </CardTitle>
                                                </div>
                                                <CardDescription className="font-mono text-[11px]">
                                                    {namespace}/{e.slug}
                                                </CardDescription>
                                            </CardHeader>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </main>
        </div>
    );
}
