import { Head, Link } from '@inertiajs/react';
import type { ComponentType, ReactNode } from 'react';
import BeamAccountLayout from '../layouts/beam-account-layout';
import OperatorLayout from '../layouts/operator-layout';
import SiteLayout from '../layouts/site-layout';

/**
 * The packaged `error` page — what a browser sees for a 403 / 404 / 419 / 500 / 503 instead of the
 * framework's bare HTML error page.
 *
 * `splicewire/laravel-beam-accounts`' `ErrorPages` renders it from a host's `bootstrap/app.php`
 * exception handler with `ErrorPageData` props, keeping the response's own status and leaving every
 * JSON error response alone. The message is the server's: a 403 carries the policy's own sentence
 * ("This action is unauthorized."), a 404 or 500 a generic one.
 *
 * ## Which chrome
 *
 * The page names its own layout, so the host's `layout:` switch (which keys on the page NAME) is not
 * consulted. The server names the realm the request was in (`realm`): a refusal in the operator realm
 * renders in the operator shell, and its way back is the operator console. Any other signed-in viewer gets
 * the account shell they were already in (their nav rail is how they get back), and a guest, or a request
 * that never reached the session (an unrouted 404), gets the public site shell. Neither is wrapped in the editor host: an error is not an authorable page.
 */
export type ErrorPageProps = {
    status: number;
    title: string;
    message: string;
    /** The realm the refused request was in (laravel-beam-accounts `ErrorPages`), or null outside any realm. */
    realm?: string | null;
    auth?: { user?: unknown } | null;
};

// The realm's own shell first, so an operator refused under /operator stays in the operator rail; then the
// account shell for any other signed-in viewer, and the public site shell for a guest or an unrouted 404.
export function errorLayout(props: {
    realm?: string | null;
    auth?: { user?: unknown } | null;
}): ComponentType<{ children: ReactNode }> {
    if (props.realm === 'operator') return OperatorLayout;
    return props.auth?.user ? BeamAccountLayout : SiteLayout;
}

// The site shell's `--st-*` layer first, the app token layer second: both chromes resolve one of them.
const muted = 'var(--st-muted, var(--muted-foreground))';
const border = 'var(--st-border, var(--border))';

export default function ErrorPage({ status, title, message, realm, auth }: ErrorPageProps) {
    const signedIn = Boolean(auth?.user);
    const home =
        realm === 'operator'
            ? { href: '/operator', label: 'Go to the operator console' }
            : signedIn
              ? { href: '/dashboard', label: 'Go to your dashboard' }
              : { href: '/', label: 'Go to the home page' };

    return (
        <>
            <Head title={title} />
            <main
                className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-6 py-16"
                data-testid="error-page"
                data-status={status}
            >
                <p
                    className="font-mono text-sm"
                    style={{ color: muted, margin: 0 }}
                >
                    Error {status}
                </p>
                <h1
                    className="text-3xl font-semibold tracking-tight"
                    style={{ margin: 0 }}
                >
                    {title}
                </h1>
                <p style={{ color: muted, margin: 0, lineHeight: 1.6 }}>{message}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Link
                        href={home.href}
                        className="rounded-md px-4 py-2 text-sm font-medium"
                        style={{
                            background: 'var(--st-accent, var(--primary))',
                            color: 'var(--st-accent-fg, var(--primary-foreground))',
                        }}
                    >
                        {home.label}
                    </Link>
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="rounded-md px-4 py-2 text-sm font-medium"
                        style={{
                            background: 'transparent',
                            color: 'inherit',
                            border: `1px solid ${border}`,
                            cursor: 'pointer',
                        }}
                    >
                        Go back
                    </button>
                </div>
            </main>
        </>
    );
}

// An ARROW, not the function itself: Inertia treats a prototype-less one-argument function as a layout
// RESOLVER and calls it with the page props; a `function` declaration would be mounted as the layout.
ErrorPage.layout = (props: ErrorPageProps) => errorLayout(props);
