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

export type UseEntryArtifactResult = {
    /** The compiled body, or null while loading — or permanently, if `failed`. */
    Body: ComponentType<Record<string, unknown>> | null;
    /** The artifact is missing or unloadable. Never a reason to fall back to compiling in the browser. */
    failed: boolean;
};

export function useEntryArtifact(url: string, version?: string | null): UseEntryArtifactResult {
    const [Body, setBody] = useState<ComponentType<Record<string, unknown>> | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setBody(null);
        setFailed(false);

        if (!url) {
            setFailed(true);
            return;
        }

        import(/* @vite-ignore */ url)
            .then((mod: ArtifactModule) => {
                const { default: Component } = mod.default(RUNTIME);

                if (!cancelled) {
                    setBody(() => Component);
                }
            })
            .catch(() => {
                // No client-side compile fallback, deliberately (ADR-0209 §7). A missing or broken
                // artifact is a doctor finding (`BeamUxArtifactAudit`) and a visible empty state —
                // never a silent regression to shipping an MDX compiler to every reader.
                if (!cancelled) {
                    setFailed(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [url, version]);

    return { Body, failed };
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
     * Shown when the artifact cannot be loaded. Defaults to the operator-facing line naming the command
     * that fixes it, because the overwhelmingly common cause on a fresh host is an uncompiled body.
     */
    fallback?: ReactNode;
    /** Shown while the artifact is in flight. Defaults to nothing — the load is usually imperceptible. */
    loading?: ReactNode;
};

const DEFAULT_FALLBACK = (
    <p data-beam-entry-uncompiled="" style={{ fontSize: '0.875rem', color: 'var(--beam-muted, #64748b)' }}>
        This page&rsquo;s content has not been compiled yet. Run{' '}
        <code style={{ fontFamily: 'var(--beam-font-mono, ui-monospace, monospace)' }}>
            php artisan splicewire:beam:ux:compile
        </code>
        .
    </p>
);

export function EntryBody({ artifact, components, fallback, loading = null }: EntryBodyProps) {
    const { Body, failed } = useEntryArtifact(artifact.url, artifact.version);

    if (failed) {
        return <>{fallback ?? DEFAULT_FALLBACK}</>;
    }

    if (Body === null) {
        return <>{loading}</>;
    }

    // The compiler runs without `providerImportSource`, so the compiled body takes its component map
    // as a PROP. An `<MDXProvider>` wrapper around this would be inert.
    return <Body components={components ?? {}} />;
}
