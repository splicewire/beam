import {
    createElement,
    useEffect,
    useState,
    type ComponentType,
    type ReactElement,
    type ReactNode,
} from 'react';
import * as runtime from 'react/jsx-runtime';

import { evaluate } from '@mdx-js/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import type { PluggableList } from 'unified';

/**
 * The **runtime** MDX render path — the counterpart to the build-time Vite compile, for MDX
 * that arrives *after* the bundle (e.g. content streamed from an authenticated route). The
 * package has no runtime compiler otherwise: everything else is precompiled from the content
 * glob into static components. This adds the missing capability.
 *
 * It is deliberately **generic**: it takes an MDX string and a component map and knows nothing
 * about where the text came from, any access gate, or a "guide". The frontmatter pair mirrors
 * the build preset so a leading `---` block is stripped identically; pass the same extra
 * remark/rehype plugins the preset runs (e.g. `remark-gfm`, `rehype-slug`) for byte-identical
 * fidelity.
 */

/**
 * A map of tag/component name → React component, injected as MDX's `components` prop. Values
 * are permissive (`ComponentType<any>`): MDX components carry heterogeneous, per-component
 * prop shapes, exactly as the build-time `mdxComponents` map does.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MdxComponentMap = Record<string, ComponentType<any>>;

export interface RuntimeMdxOptions {
    /** Extra remark plugins to run after the frontmatter pair (match the build preset). */
    remarkPlugins?: PluggableList;
    /** Rehype plugins to run on the HAST (e.g. `rehype-slug`, syntax highlighting). */
    rehypePlugins?: PluggableList;
}

type MdxContentComponent = ComponentType<{ components?: MdxComponentMap }>;

/**
 * Compile raw MDX text into a React component at runtime, in the browser. Async — MDX
 * compilation and evaluation both return promises. Throws on malformed MDX so a caller can
 * present an error state.
 */
export async function compileMdx(
    source: string,
    options: RuntimeMdxOptions = {},
): Promise<MdxContentComponent> {
    const compiled = await evaluate(source, {
        ...runtime,
        remarkPlugins: [
            remarkFrontmatter,
            remarkMdxFrontmatter,
            ...(options.remarkPlugins ?? []),
        ],
        rehypePlugins: [...(options.rehypePlugins ?? [])],
    });

    return compiled.default as MdxContentComponent;
}

export interface RuntimeMdxProps extends RuntimeMdxOptions {
    /** The raw MDX text to compile and render. */
    source: string;
    /** The component map injected as MDX `components` (the kit: Callout, Steps, Figure, …). */
    components?: MdxComponentMap;
    /** Shown while compilation is in flight. */
    fallback?: ReactNode;
    /** Rendered when compilation throws (malformed MDX); receives the error. */
    renderError?: (error: Error) => ReactNode;
}

/**
 * Render raw MDX text through a supplied component map, compiling on the fly. A thin React
 * wrapper over {@see compileMdx} that manages the async compile + error state. Recompiles when
 * the source or plugin set changes.
 */
export function RuntimeMdx({
    source,
    components,
    fallback = null,
    renderError,
    remarkPlugins,
    rehypePlugins,
}: RuntimeMdxProps): ReactElement | null {
    const [Content, setContent] = useState<MdxContentComponent | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let active = true;
        setContent(null);
        setError(null);

        compileMdx(source, { remarkPlugins, rehypePlugins })
            .then((component) => {
                if (active) {
                    // Wrap in a thunk so useState stores the component, not a state updater.
                    setContent(() => component);
                }
            })
            .catch((cause: unknown) => {
                if (active) {
                    setError(cause instanceof Error ? cause : new Error(String(cause)));
                }
            });

        return () => {
            active = false;
        };
    }, [source, remarkPlugins, rehypePlugins]);

    if (error) {
        return (renderError ? renderError(error) : null) as ReactElement | null;
    }

    if (!Content) {
        return (fallback ?? null) as ReactElement | null;
    }

    return createElement(Content, { components });
}

/**
 * Fetch raw MDX text from a URL and return it. The default {@link RemoteMdx} transport: a
 * same-origin GET asking for `text/markdown`, throwing on a non-2xx so the caller's error path
 * runs. Exported so a consumer can compose it (e.g. wrap it to add a header).
 */
export async function fetchMdx(source: string): Promise<string> {
    const response = await fetch(source, {
        headers: { Accept: 'text/markdown' },
        credentials: 'same-origin',
    });

    if (!response.ok) {
        throw new Error(`Failed to load MDX (${response.status})`);
    }

    return response.text();
}

export interface RemoteMdxProps extends RuntimeMdxOptions {
    /** The URL to fetch the raw MDX text from. */
    source: string;
    /** The component map injected as MDX `components` (the kit). */
    components?: MdxComponentMap;
    /**
     * Override the transport — supply auth headers, a different fetch client, a signed URL, an
     * in-memory stub in tests, etc. Receives the `source` URL, resolves the raw MDX text, and
     * should throw on failure. Defaults to {@link fetchMdx} (same-origin `text/markdown` GET).
     * Pass a **stable** reference (module-level or memoized) — it is a re-fetch dependency.
     */
    fetcher?: (source: string) => Promise<string>;
    /** Shown while the fetch or the compile is in flight. */
    fallback?: ReactNode;
    /** Rendered on a fetch or compile failure; receives the error. */
    renderError?: (error: Error) => ReactNode;
}

/**
 * The **content-delivery client**: fetch raw MDX from a URL, then render it through the kit via
 * {@link RuntimeMdx}. Generic — it knows nothing about auth, gates, or "guides"; the URL points
 * wherever the host decides (e.g. an authenticated gate-and-stream route), and the transport is
 * overridable via `fetcher`. The host wraps this with its own chrome + loading/error affordances.
 */
export function RemoteMdx({
    source,
    components,
    fetcher = fetchMdx,
    fallback = null,
    renderError,
    remarkPlugins,
    rehypePlugins,
}: RemoteMdxProps): ReactElement | null {
    const [text, setText] = useState<string | null>(null);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let active = true;
        setText(null);
        setError(null);

        fetcher(source)
            .then((mdx) => {
                if (active) {
                    setText(mdx);
                }
            })
            .catch((cause: unknown) => {
                if (active) {
                    setError(cause instanceof Error ? cause : new Error(String(cause)));
                }
            });

        return () => {
            active = false;
        };
    }, [source, fetcher]);

    if (error) {
        return (renderError ? renderError(error) : null) as ReactElement | null;
    }

    if (text === null) {
        return (fallback ?? null) as ReactElement | null;
    }

    // Delegate the compile+render (and its own in-flight/error states) to RuntimeMdx.
    return createElement(RuntimeMdx, {
        source: text,
        components,
        fallback,
        renderError,
        remarkPlugins,
        rehypePlugins,
    });
}
