// =============================================================================
// beam-inertia Storybook harness (ticket G6-BEAM-JOURNEY-STATES) — shared, NON-shipped.
//
// Mirrors beam-mdx's `story-harness.tsx` (component-seams ticket 40): the beam Storybook
// aliases `@inertiajs/react` to `.storybook/inertia-react.stub.tsx`, whose `usePage()` and
// `<Form>`/`useForm` read story-set behaviour off two `globalThis` slots. This harness
// writes those slots — NO import of the out-of-`src` stub (this package's tsconfig only
// includes `src`) — so a story sets page props / form settlement, and the stub reads the
// same slot at render time. The two modules meet ONLY on the string keys below.
//
// Every packaged auth/settings page renders through `<Form action method>{({processing,
// errors}) => …}</Form>` (grep confirms zero `useForm` call sites in `beam-inertia/src`),
// so `setStubForm` is what drives populated / validation-error / processing / confirmation
// journey states for those pages.
// =============================================================================
import { useEffect } from 'react';

const PAGE_KEY = '__beamMdxStubPage__';
const FORM_KEY = '__beamInertiaStubForm__';

export interface StubFormConfig {
    forceProcessing?: boolean;
    errors?: Record<string, string>;
    outcome?: 'success' | 'error' | 'pending';
    delayMs?: number;
    errorsOnSubmit?: Record<string, string>;
    onSuccess?: () => void;
}

/** Seed the stubbed Inertia page props (`usePage().props`) synchronously at module eval. */
export function setStubPage(props: Record<string, unknown>, url = '/'): void {
    (globalThis as Record<string, unknown>)[PAGE_KEY] = { props, url };
}

/** Seed the stubbed `<Form>`/`useForm` settlement behaviour synchronously at module eval. */
export function setStubForm(config: StubFormConfig): void {
    (globalThis as Record<string, unknown>)[FORM_KEY] = config;
}

/**
 * React hook form of {@link setStubForm} — re-applies the config on every render so a
 * story's `args`-driven config (Storybook controls) takes effect without a full remount.
 */
export function useStubForm(config: StubFormConfig): void {
    setStubForm(config);
    useEffect(() => {
        setStubForm(config);
    });
}

/** A believable demo-accounts fixture for `auth/login`'s "Or try a demo account" block. */
export const DEMO_ACCOUNTS = [
    { key: 'owner', label: 'Workspace owner', url: '#demo-owner' },
    { key: 'member', label: 'Team member', url: '#demo-member' },
];
