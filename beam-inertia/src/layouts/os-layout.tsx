// beam·os — the OS layout, thickened per this file's own prior invitation ("a host that wants the
// persistent OS chrome thickens this file... see audiostud's os-layout for the full pattern").
//
// A logged-in user WITH `os.enter` (staff/operator) gets the operator meta-editor overlay on EVERY
// authed page: the REAL page renders normally underneath (its own chrome, scroll, interaction intact),
// with a floating operator dock + tool windows ON TOP. A guest / non-`os.enter` principal falls through
// to the plain standalone page, unchanged. The full floating-window OS DESKTOP stays the separate,
// opt-in `/os` route (pages/os.tsx) — this is the lighter always-on overlay, not a replacement for it.
import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import OperatorDesk from '../os/operator-desk';

const OS_ENTER_KEY = 'os.enter';

/**
 * ux-walkthrough UX-12a, probe PR-1 (2026-10-06, read-only on audiostud): no author had ever edited an APP page in
 * place, so the in-place editor leaves every non-site case. It overlays `site/*` pages only; app realms get no dock.
 */
export default function OsLayout({ children }: { children: ReactNode }) {
    const page = usePage<{ can?: Record<string, boolean> }>();
    const can = (page.props.can as Record<string, boolean> | undefined) ?? {};
    const entitled = !!can[OS_ENTER_KEY] && (page.component ?? '').startsWith('site/');

    return (
        <>
            {children}
            {entitled && <OperatorDesk />}
        </>
    );
}
