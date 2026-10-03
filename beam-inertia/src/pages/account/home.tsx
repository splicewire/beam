import { Head } from '@inertiajs/react';

/**
 * An authed ACCOUNT-realm page. Its layout (the OOTB `<AccountShell>`) is applied by app.tsx's layout
 * resolution for `account/*` pages, so this file is pure content — proving the account chrome
 * (sidebar + data-driven nav + plan/profile blocks from `accountShell`) renders from config only.
 */
export default function AccountHome() {
    return (
        <>
            <Head title="Account" />
            <div style={{ padding: 24 }}>
                <h1
                    style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}
                >
                    Account home
                </h1>
                <p style={{ color: '#64748b', maxWidth: 560, lineHeight: 1.6 }}>
                    Manage your profile, security, API tokens and team from the
                    sidebar (behind the menu button on a narrow screen).
                </p>
            </div>
        </>
    );
}
