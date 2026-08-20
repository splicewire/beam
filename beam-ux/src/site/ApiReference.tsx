// @splicewire/beam-ux/site — the OpenAPI reference surface (ADR-0210 §5), named for its ROLE and not
// its vendor. Scalar is today's renderer; swapping it is an edit inside THIS file rather than an edit
// to every seeded page body, which is the entire reason the component is not called `<Scalar>`.
//
// It points at a spec URL — normally the core-mounted `beam/openapi.json` (ADR-0211) served by the
// host's OWN routes, because a beam site documents ITSELF rather than mirroring one upstream spec.
//
// ── The CDN cost, resolved ───────────────────────────────────────────────────────────────────────
// The incumbent (splicewire-app's `docs/index.blade.php`) loaded Scalar from `cdn.jsdelivr.net` at
// runtime, which an air-gapped or CSP-strict install cannot do. Bundling Scalar instead was rejected:
// it is a multi-megabyte renderer, and beam-ux is imported by hosts that never open an API reference
// — every one of them would pay for it. So the loader is kept and made SEAM-SHAPED, matching the rest
// of the package's injection posture:
//
//   - default          → the CDN script, exactly as the incumbent (nothing to configure, still works),
//   - `scriptUrl`      → the same loader pointed at a self-hosted / vendored copy (CSP allow-list),
//   - `createApiReference` → an injected factory: a host that installs `@scalar/api-reference` itself
//     passes its `createApiReference` and NOTHING is fetched from the network at all (air-gapped).
//
// ── Theme ────────────────────────────────────────────────────────────────────────────────────────
// The package ships no palette and no fonts. The incumbent's brand block (Space Grotesk / IBM Plex
// Mono, the two accent colors) is HOST-LOCAL and arrives through `customCss` — a theme prop. What IS
// baked in is the curation, not a look: `.scalar-mcp-layer { display: none }`, because a beam site's
// MCP surface has its OWN docs page (the `<ManifestTable>` one) and Scalar's auto "Generate MCP"
// affordance would compete with it. `hideMcpLayer={false}` opts out.
import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

/** The Scalar entry point this component drives. Structural — we never import the package. */
export type ApiReferenceFactory = (
    selectorOrElement: string | HTMLElement,
    configuration: Record<string, unknown>,
) => unknown;

/** The default CDN source — the incumbent's URL. Exported so a host can pin or re-host from it. */
export const SCALAR_CDN_URL = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference';

/** Curation, not palette: our MCP server has its own docs page, so hide Scalar's MCP affordance. */
const HIDE_MCP_LAYER_CSS = '.scalar-mcp-layer { display: none !important; }';

/** In-flight/loaded script loads, deduped by URL so N references on a page fetch once. */
const scriptLoads = new Map<string, Promise<void>>();

function loadScript(url: string): Promise<void> {
    const existing = scriptLoads.get(url);
    if (existing) return existing;

    const load = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.addEventListener('load', () => resolve());
        script.addEventListener('error', () => {
            scriptLoads.delete(url);
            reject(new Error(`beam-ux ApiReference: failed to load the spec renderer from ${url}.`));
        });
        document.head.appendChild(script);
    });

    scriptLoads.set(url, load);
    return load;
}

function globalFactory(): ApiReferenceFactory | undefined {
    const scalar = (globalThis as { Scalar?: { createApiReference?: ApiReferenceFactory } }).Scalar;
    return scalar?.createApiReference;
}

export type ApiReferenceProps = {
    /** The OpenAPI document URL — typically the host's own `beam/openapi.json` (ADR-0211). */
    specUrl: string;
    /**
     * Injected renderer factory. Supply it (from a host-installed `@scalar/api-reference`) and the
     * component never touches the network for its renderer — the air-gapped / CSP-strict path.
     */
    createApiReference?: ApiReferenceFactory;
    /** Where to load the renderer from when no factory is injected. Defaults to {@link SCALAR_CDN_URL}. */
    scriptUrl?: string;
    /** Renderer theme name. Defaults to `default` — a renderer preset, not a beam palette. */
    theme?: string;
    /** Host theme CSS (fonts, accent colors). The package contributes no palette of its own. */
    customCss?: string;
    /** Keep the MCP-layer curation. Default `true`; set `false` to let the renderer show it. */
    hideMcpLayer?: boolean;
    /** Escape hatch: extra renderer configuration, shallow-merged last. */
    configuration?: Record<string, unknown>;
    /** Called when the renderer cannot be loaded, so a host can log or swap in a fallback. */
    onError?: (error: unknown) => void;
    className?: string;
    style?: CSSProperties;
};

export function ApiReference({
    specUrl,
    createApiReference,
    scriptUrl = SCALAR_CDN_URL,
    theme = 'default',
    customCss,
    hideMcpLayer = true,
    configuration,
    onError,
    className,
    style,
}: ApiReferenceProps) {
    const mount = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let cancelled = false;
        const element = mount.current;
        if (!element) return;

        const css = [hideMcpLayer ? HIDE_MCP_LAYER_CSS : null, customCss]
            .filter(Boolean)
            .join('\n');

        const render = (factory: ApiReferenceFactory) => {
            if (cancelled) return;
            factory(element, {
                url: specUrl,
                theme,
                ...(css ? { customCss: css } : {}),
                ...configuration,
            });
        };

        const injected = createApiReference ?? globalFactory();
        if (injected) {
            render(injected);
        } else {
            loadScript(scriptUrl)
                .then(() => {
                    const factory = globalFactory();
                    if (!factory) {
                        throw new Error(
                            'beam-ux ApiReference: the renderer script loaded but exposed no factory.',
                        );
                    }
                    render(factory);
                })
                .catch((error: unknown) => {
                    if (!cancelled) onError?.(error);
                });
        }

        return () => {
            cancelled = true;
            // The renderer owns the subtree it mounted; clearing it is the portable teardown (Scalar
            // exposes no stable destroy across versions, and React never owned these children).
            element.replaceChildren();
        };
    }, [
        specUrl,
        createApiReference,
        scriptUrl,
        theme,
        customCss,
        hideMcpLayer,
        configuration,
        onError,
    ]);

    return <div ref={mount} className={className} style={style} data-beam-ux-api-reference={specUrl} />;
}
