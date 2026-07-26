// =============================================================================
// Storybook-only stub for `@inertiajs/react` — aliased in .storybook/main.ts.
//
// WHY: beam-mdx is the *sole* Inertia consumer in the whole beam Storybook estate
// (component-seams ticket 40; `beam-mdx/src/context.tsx` + `components/content-show.tsx`
// are the only files across every beam workspace that import `@inertiajs/react`). Their
// render-time touch is tiny — `usePage()` (read `props.links`) and `<Head>` (SEO tags,
// invisible). The real package boots a module-global router with side effects and wants
// to render a *resolved page component*, not arbitrary children — the wrong tool for
// cataloguing bare surfaces in isolation. This stub supplies exactly the two seams the
// kit reads, driven by a story-settable page-props value, so `Ref`/`Receipts`/`ContentShow`
// render off pure fixtures with NO app/Laravel coupling (the storybook-authoring
// convention's "no app coupling" bar, one seam later).
//
// Stories set the page props via `setStubPage({ links })` (see the harness). Everything
// else the real module exports is stubbed to an inert no-op so any incidental import
// resolves — only `usePage`/`Head` carry behaviour.
// =============================================================================
import type { ReactNode } from 'react';

type PageProps = Record<string, unknown>;

// The story seam is a `globalThis` slot rather than an exported setter, so the harness
// (in `beam-mdx/src`, whose tsconfig only includes `src`) writes it WITHOUT importing this
// out-of-`src` stub — and the aliased `usePage` below reads the same slot at render time.
// The stub module and the harness never share a type; they meet only on this global key.
const PAGE_KEY = '__beamMdxStubPage__';

interface GlobalWithPage {
    [PAGE_KEY]?: { props: PageProps; url: string };
}

export function usePage() {
    const slot = (globalThis as GlobalWithPage)[PAGE_KEY];
    return {
        props: slot?.props ?? {},
        url: slot?.url ?? '/',
        component: 'Stub',
        version: null,
    };
}

/** `<Head>` in the real package injects SEO tags into a head-manager (invisible). No-op here. */
export function Head(_props: { title?: string; children?: ReactNode }) {
    return null;
}

// --- Inert stubs for the rest of the surface (nothing in the beam Storybook renders these,
//     but a stray import must still resolve). ---
export const Link = (props: { children?: ReactNode }) => props.children ?? null;
export const App = (props: { children?: ReactNode }) => props.children ?? null;
export const router = { visit() {}, get() {}, post() {}, on: () => () => {}, init() {} };
export const useForm = () => ({});
export const usePoll = () => ({});
export const usePrefetch = () => ({});
export const useRemember = <T,>(v: T) => [v, () => {}] as const;
export const Form = (props: { children?: ReactNode }) => props.children ?? null;
export function createInertiaApp() {
    return Promise.resolve({} as unknown);
}
