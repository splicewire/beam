// =============================================================================
// Storybook-only stub for `@inertiajs/react` — aliased in .storybook/main.ts.
//
// WHY: beam-mdx was the FIRST Inertia consumer catalogued (component-seams ticket 40); its
// render-time touch is tiny — `usePage()` + `<Head>`. `beam-inertia`'s auth/settings pages
// (ticket G6-BEAM-JOURNEY-STATES) are the second, heavier consumer: every auth form renders
// through `<Form action method>{({processing, errors}) => …}</Form>` (the Inertia v2
// render-prop form, NOT `useForm` — grep across `beam-inertia/src` turns up zero `useForm`
// call sites), and a couple of pages read `usePage<Props>()` for server-shared props
// (`auth`, `status`, `canResetPassword`, `demoAccounts`, …). The real package boots a
// module-global router with side effects and wants to render a *resolved page component*,
// not arbitrary children — the wrong tool for cataloguing bare surfaces in isolation.
//
// This stub supplies:
//   • `usePage()` — story-driven via a `globalThis` slot (unchanged from ticket 40).
//   • `<Form>` — a REAL, story-driven controlled form: it owns `processing`/`errors`/
//     `wasSuccessful` state, prevents default on submit, and settles per a story-set
//     config (`immediate success`, `validation errors`, `forced processing`, `delayed
//     settle` for a `play`-catchable in-flight state). This is what makes beam-inertia's
//     packaged auth pages (login/register/forgot-password/reset-password/verify-email/
//     settings) storyable at all — they render exclusively through this render prop.
//   • `useForm()` — a story-driven hook with the same settlement config, for any FUTURE
//     page that adopts the classic `useForm` hook instead of `<Form>` (none does today;
//     kept faithful to the real hook's shape so a future page just works here).
//   • `setLayoutProps` — a no-op (only `auth/two-factor-challenge.tsx` calls it; that page
//     is outside this ticket's scope, but a stray import must still resolve).
//   • everything else — inert no-ops so an incidental import resolves.
//
// Stories set page props via `setStubPage({ links })` and form behaviour via
// `setStubForm({ ... })` — both live in each consuming package's own (non-shipped)
// `story-harness.tsx`, which writes the `globalThis` slot directly (no import of this
// out-of-`src` stub; see beam-mdx's `story-harness.tsx` for the established pattern). The
// stub module and every harness meet ONLY on these string keys.
// =============================================================================
import { useState, type FormEvent, type ReactNode } from 'react';

type PageProps = Record<string, unknown>;

// ── usePage (ticket 40, unchanged) ──────────────────────────────────────────────────────
const PAGE_KEY = '__beamMdxStubPage__';

interface GlobalWithPage {
    [PAGE_KEY]?: { props: PageProps; url: string };
}

export function usePage<T = PageProps>() {
    const slot = (globalThis as GlobalWithPage)[PAGE_KEY];
    return {
        props: (slot?.props ?? {}) as T,
        url: slot?.url ?? '/',
        component: 'Stub',
        version: null,
    };
}

/** `<Head>` in the real package injects SEO tags into a head-manager (invisible). No-op here. */
export function Head(_props: { title?: string; children?: ReactNode }) {
    return null;
}

// ── Form / useForm story-driven settlement ──────────────────────────────────────────────
export interface FormStubConfig {
    /** Force the `processing` (submitting) flag from first render, without needing a submit —
     *  drives a "processing" journey-state story with no `play` interaction. */
    forceProcessing?: boolean;
    /** Errors present from first render — drives a "validation" journey-state story. */
    errors?: Record<string, string>;
    /** What a submit settles to. `pending` never settles (an in-flight `play` assertion). */
    outcome?: 'success' | 'error' | 'pending';
    /** Latency (ms) between submit and settling, so `play` can catch the in-flight button
     *  before it resolves. */
    delayMs?: number;
    /** Errors applied when a submit settles with `outcome: 'error'`. */
    errorsOnSubmit?: Record<string, string>;
    /** Called once a submit settles successfully (a "confirmation" story can flip on this). */
    onSuccess?: () => void;
}

const FORM_KEY = '__beamInertiaStubForm__';

interface GlobalWithForm {
    [FORM_KEY]?: FormStubConfig;
}

function readFormConfig(): FormStubConfig {
    return (globalThis as GlobalWithForm)[FORM_KEY] ?? {};
}

interface FormRenderBag {
    data: Record<string, unknown>;
    errors: Record<string, string>;
    hasErrors: boolean;
    processing: boolean;
    progress: null;
    wasSuccessful: boolean;
    recentlySuccessful: boolean;
    isDirty: boolean;
    clearErrors: () => void;
    resetAndClearErrors: () => void;
    setError: (key: string, message: string) => void;
    reset: () => void;
}

function useSettlingForm() {
    const initial = readFormConfig();
    const [processing, setProcessing] = useState(initial.forceProcessing ?? false);
    const [errors, setErrors] = useState<Record<string, string>>(initial.errors ?? {});
    const [wasSuccessful, setWasSuccessful] = useState(false);

    function submit(onNativeSubmit?: () => void) {
        const config = readFormConfig();
        setProcessing(true);
        setWasSuccessful(false);
        if (config.outcome === 'pending') return; // never settles — the in-flight state stays.

        const settle = () => {
            setProcessing(false);
            if (config.outcome === 'error') {
                setErrors(config.errorsOnSubmit ?? config.errors ?? {});
                setWasSuccessful(false);
            } else {
                setErrors({});
                setWasSuccessful(true);
                config.onSuccess?.();
            }
            onNativeSubmit?.();
        };
        const delay = config.delayMs ?? 0;
        if (delay > 0) setTimeout(settle, delay);
        else settle();
    }

    const clearErrors = () => setErrors({});
    const setError = (key: string, message: string) => setErrors((prev) => ({ ...prev, [key]: message }));

    return { processing, errors, wasSuccessful, setErrors, clearErrors, setError, submit };
}

/**
 * The Inertia v2 render-prop `<Form>` — the ONLY form primitive beam-inertia's packaged
 * pages use. Renders a real `<form>`, prevents default on submit, and settles per the
 * story-set `FormStubConfig` above.
 */
export function Form({
    children,
    action,
    method,
    onSuccess,
    onError,
    className,
    // Inertia-specific props that are real on the wire form but not valid DOM attributes —
    // named explicitly so they're consumed here rather than spread onto the `<form>` (React
    // warns loudly on an unknown DOM attribute, and every packaged auth page passes at least
    // one of these: `resetOnSuccess`, `transform`, `disableWhileProcessing`, `options`).
    resetOnSuccess: _resetOnSuccess,
    resetOnError: _resetOnError,
    transform: _transform,
    disableWhileProcessing = false,
    options: _options,
    headers: _headers,
    queryStringArrayFormat: _queryStringArrayFormat,
    showProgress: _showProgress,
    invalidatesCacheTags: _invalidatesCacheTags,
    ...rest
}: {
    action?: string;
    method?: string;
    className?: string;
    children: (bag: FormRenderBag) => ReactNode;
    onSuccess?: () => void;
    onError?: (errors: Record<string, string>) => void;
    disableWhileProcessing?: boolean;
    [key: string]: unknown;
}) {
    const { processing, errors, wasSuccessful, clearErrors, setError, submit } = useSettlingForm();

    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        submit(() => {
            const config = readFormConfig();
            if (config.outcome === 'error') onError?.(config.errorsOnSubmit ?? config.errors ?? {});
            else onSuccess?.();
        });
    }

    const body = children({
        data: {},
        errors,
        hasErrors: Object.keys(errors).length > 0,
        processing,
        progress: null,
        wasSuccessful,
        recentlySuccessful: wasSuccessful,
        isDirty: false,
        clearErrors,
        resetAndClearErrors: clearErrors,
        setError,
        reset: () => {},
    });

    return (
        <form
            onSubmit={handleSubmit}
            action={action}
            method={method ?? 'post'}
            className={className}
            noValidate
            {...rest}
        >
            {/* The real `disableWhileProcessing` disables every native control in the form while a
             *  submit is in flight — some packaged pages (`auth/register`) rely on it rather than
             *  wiring `disabled={processing}` on their own submit button. A borderless `<fieldset>`
             *  reproduces that without changing layout. */}
            {disableWhileProcessing ? (
                <fieldset disabled={processing} style={{ border: 0, margin: 0, padding: 0 }}>
                    {body}
                </fieldset>
            ) : (
                body
            )}
        </form>
    );
}

/**
 * The classic `useForm` hook — no packaged beam-inertia page calls this today, but a
 * future one might; kept faithful to the real hook's shape (`data`/`setData`/`errors`/
 * `processing`/`post`/… ) driven by the same `FormStubConfig` seam as `<Form>`.
 */
export function useForm<T extends Record<string, unknown>>(initial: T = {} as T) {
    const [data, setDataState] = useState<T>(initial);
    const { processing, errors, wasSuccessful, clearErrors, setError, submit } = useSettlingForm();

    function setData(keyOrFnOrObject: string | ((prev: T) => T) | Partial<T>, value?: unknown) {
        if (typeof keyOrFnOrObject === 'string') {
            setDataState((prev) => ({ ...prev, [keyOrFnOrObject]: value }) as T);
        } else if (typeof keyOrFnOrObject === 'function') {
            setDataState(keyOrFnOrObject);
        } else {
            setDataState((prev) => ({ ...prev, ...keyOrFnOrObject }) as T);
        }
    }

    const submitNoop = () => submit();

    return {
        data,
        setData,
        errors,
        hasErrors: Object.keys(errors).length > 0,
        processing,
        progress: null,
        wasSuccessful,
        recentlySuccessful: wasSuccessful,
        isDirty: false,
        clearErrors,
        resetAndClearErrors: clearErrors,
        setError,
        transform: () => {},
        reset: () => setDataState(initial),
        get: submitNoop,
        post: submitNoop,
        put: submitNoop,
        patch: submitNoop,
        delete: submitNoop,
        submit: submitNoop,
        cancel: () => {},
    };
}

/** Only `pages/auth/two-factor-challenge.tsx` (out of this ticket's scope) calls this. No-op. */
export function setLayoutProps(_props: Record<string, unknown>) {}

// --- Inert stubs for the rest of the surface — a stray import must still resolve. ---
export const Link = (props: { children?: ReactNode }) => props.children ?? null;
export const App = (props: { children?: ReactNode }) => props.children ?? null;
export const router = { visit() {}, get() {}, post() {}, on: () => () => {}, init() {} };
export const usePoll = () => ({});
export const usePrefetch = () => ({});
/** Only `hooks/use-two-factor-auth.ts`'s QR/setup-key/recovery-codes fetches call this. A `submit`
 *  that never resolves is honest here — none of this ticket's stories drive 2FA setup to completion;
 *  the loading affordance those callers already guard with stays visible if one ever does. */
export const useHttp = () => ({ submit: () => new Promise(() => {}) });
export const useRemember = <T,>(v: T) => [v, () => {}] as const;
export function createInertiaApp() {
    return Promise.resolve({} as unknown);
}
