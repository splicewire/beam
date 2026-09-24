import { Fragment, createElement, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

/**
 * Loads and renders a rendered entry's **compiled body artifact** (ADR-0209 §7).
 *
 * ## Why this is in the package rather than in every host
 *
 * `Route::beamUxSite()` hands the host page an entry, a nav projection, and the URL of the entry's
 * compiled artifact — and the host page owns everything that makes a beam site look like itself: the
 * chrome, the palette, the measure, and the component map a body may reach for. None of that belongs
 * here. But *getting the artifact onto the screen* is not any of those things: it is one exact
 * sequence, identical on every host, and it was wrong twice in ways no test caught.
 *
 * Ticket 07 found the artifact could not be imported by the page shell at all — it was compiled with
 * `outputFormat: 'program'`, emitting a bare `react/jsx-runtime` specifier a browser refuses — because
 * the output had only ever been verified as *compiler output*, never as a *module something loaded*.
 * Ticket 08 found the artifact's URL did not contain the version that was supposed to move it, so a
 * year-long `immutable` cache header sat on an address that never changed. A host re-deriving those
 * forty lines re-derives the bugs; beam-docs-satellite ticket 11 lifted them here so a fresh
 * `laravel-beam-starter` gets the contract right by installing it rather than by copying it.
 *
 * This is not the beam-ux-served *shim* ticket 07 rejected. That one was a PHP package serving a
 * runtime module, which would have had to resolve the **host's** React out of the host's Vite manifest
 * or break hooks. This is a JS package bundled by the host's own Vite with `react` as a peer
 * dependency, so the runtime injected below IS the host's React by construction — the same property,
 * bought with no moving parts.
 *
 * ## Why the module is CALLED rather than read
 *
 * The artifact imports nothing and default-exports a function taking a jsx runtime. That shape is what
 * lets a plain `import()` work with no import map, no `new Function` (so no CSP `unsafe-eval`), exactly
 * one React, and the same path server-side under SSR.
 *
 * `@vite-ignore` is load-bearing: the URL is a runtime route, not a build-time path, and without it
 * Vite tries to resolve it at build and fails.
 */

/** The jsx runtime handed to every artifact. `createElement` serves the tsx path's classic factory. */
const RUNTIME = { jsx, jsxs, Fragment, createElement };

type ArtifactModule = {
    default: (runtime: typeof RUNTIME) => { default: ComponentType<Record<string, unknown>> };
};

export type EntryArtifact = {
    url: string;
    /**
     * Part of the artifact's ADDRESS, not metadata: an edited body compiles to a different URL, so a
     * changed version must re-import rather than reuse the module already in memory.
     */
    version?: string | null;
};

/**
 * Why there are FOUR states and not a boolean.
 *
 * `unauthored` (the entry has no artifact URL at all, because it has no body yet) used to collapse into
 * `failed`, and `failed`'s default message is operator-facing: *"run `php artisan
 * splicewire:beam:ux:compile`"*. Measured on beam.test 2026-09-11 (G2-BEAM-AUTHOR-EMPTY-ENTRY): a GUEST
 * reading the never-authored `/about` was told to run an artisan command — advice they cannot take, on
 * a host where that command was already current ("already current 13"). The entry was not uncompiled;
 * it was empty. Two different conditions had one message, and the message was false for the common one.
 */
export type EntryArtifactStatus = 'loading' | 'ready' | 'unauthored' | 'failed';

export type UseEntryArtifactResult = {
    /** The compiled body, or null unless `status === 'ready'`. */
    Body: ComponentType<Record<string, unknown>> | null;
    /** See {@link EntryArtifactStatus}. */
    status: EntryArtifactStatus;
    /**
     * The artifact EXISTS and could not be loaded. Never a reason to fall back to compiling in the
     * browser. Narrowed by this defect: "there is no artifact to load" is `unauthored`, not this.
     */
    failed: boolean;
};

/**
 * The component an artifact module yields, or **null when it yields none**.
 *
 * An artifact that loads and exports nothing is a failed artifact, not a component. Measured on
 * beam.test 2026-09-11: a canvas-authored page compiled to a module with an empty `module.exports`;
 * handing React the resulting `undefined` killed the entire page at render (minified error #130) — a
 * white screen where the honest answer was the same empty state a missing artifact already gets. A
 * reader must never lose the page over a build product they cannot fix.
 *
 * Extracted so this is testable without a real dynamic import: jsdom cannot `import()` an arbitrary
 * URL, so a test that goes through {@link useEntryArtifact} passes whether or not this check exists.
 */
export function componentFromArtifact(mod: ArtifactModule): ComponentType<Record<string, unknown>> | null {
    const Component = mod?.default?.(RUNTIME)?.default;

    return typeof Component === 'function' ? Component : null;
}

export function useEntryArtifact(url: string, version?: string | null): UseEntryArtifactResult {
    const [Body, setBody] = useState<ComponentType<Record<string, unknown>> | null>(null);
    const [status, setStatus] = useState<EntryArtifactStatus>('loading');

    useEffect(() => {
        let cancelled = false;
        setBody(null);
        setStatus('loading');

        if (!url) {
            setStatus('unauthored');
            return;
        }

        import(/* @vite-ignore */ url)
            .then((mod: ArtifactModule) => {
                const Component = componentFromArtifact(mod);

                if (cancelled) {
                    return;
                }

                if (Component === null) {
                    setStatus('failed');

                    return;
                }

                setBody(() => Component);
                setStatus('ready');
            })
            .catch(() => {
                // No client-side compile fallback, deliberately (ADR-0209 §7). A missing or broken
                // artifact is a doctor finding (`BeamUxArtifactAudit`) and a visible empty state —
                // never a silent regression to shipping an MDX compiler to every reader.
                if (!cancelled) {
                    setStatus('failed');
                }
            });

        return () => {
            cancelled = true;
        };
    }, [url, version]);

    return { Body, status, failed: status === 'failed' };
}

export type EntryBodyProps = {
    artifact: EntryArtifact;
    /**
     * What the body may reach for — the contribution contract from the docs side (ADR-0210 §5). A beam
     * package contributes a seed row naming `<ApiReference>` or `<ManifestTable>` and ships no
     * frontend; this map is what makes those names resolve, so it is the HOST's to supply.
     */
    components?: Record<string, ComponentType<never>>;
    /**
     * Shown when an artifact that EXISTS cannot be loaded. Defaults to the operator-facing line naming
     * the command that fixes it, because that is what a broken artifact usually means.
     *
     * It is deliberately no longer the answer for an entry that simply has no body — see
     * {@link EntryBodyProps.empty} and {@link EntryArtifactStatus}.
     */
    fallback?: ReactNode;
    /**
     * Shown when the entry has never been authored (no artifact URL). Defaults to a reader-facing line
     * that states the fact and nothing else: a guest cannot run an artisan command, and telling them to
     * is both useless and wrong.
     */
    empty?: ReactNode;
    /** Shown while the artifact is in flight. Defaults to nothing — the load is usually imperceptible. */
    loading?: ReactNode;
    /**
     * Extra props handed to the compiled body — ADR-0213 §6's escape hatch. A screen component owns its
     * data logic and fetches, because an artifact is a static module addressed by body hash with
     * nowhere in it for a per-request value. Where a round trip is silly (the current user), the
     * renderer's page props reach the body here under one well-known name rather than each host
     * inventing a channel.
     */
    bodyProps?: Record<string, unknown>;
};

// The placeholder copy is dimmed off the surrounding ink, not a palette key: it renders inside whatever
// realm the host mounts (a light site chrome under a dark app, a dark shell), and `--beam-muted` is a
// SURFACE tone in the beam tier (the mdx kit fills with it), so reading it as text came out pale-on-pale.
const DEFAULT_EMPTY = (
    <p data-beam-entry-unauthored="" style={{ fontSize: '0.875rem', color: 'color-mix(in oklab, currentColor 62%, transparent)' }}>
        This page doesn&rsquo;t have any content yet.
    </p>
);

const DEFAULT_FALLBACK = (
    <p data-beam-entry-uncompiled="" style={{ fontSize: '0.875rem', color: 'color-mix(in oklab, currentColor 62%, transparent)' }}>
        This page&rsquo;s content has not been compiled yet. Run{' '}
        <code style={{ fontFamily: 'var(--beam-font-mono, ui-monospace, monospace)' }}>
            php artisan splicewire:beam:ux:compile
        </code>
        .
    </p>
);

export function EntryBody({ artifact, components, fallback, empty, loading = null, bodyProps }: EntryBodyProps) {
    const { Body, status } = useEntryArtifact(artifact.url, artifact.version);

    if (status === 'unauthored') {
        return <>{empty ?? DEFAULT_EMPTY}</>;
    }

    if (status === 'failed') {
        return <>{fallback ?? DEFAULT_FALLBACK}</>;
    }

    if (Body === null) {
        return <>{loading}</>;
    }

    // The compiler runs without `providerImportSource`, so the compiled body takes its component map
    // as a PROP. An `<MDXProvider>` wrapper around this would be inert.
    return <Body {...(bodyProps ?? {})} components={components ?? {}} />;
}
