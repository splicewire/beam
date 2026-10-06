// beam·os — the OS layout, thickened per this file's own prior invitation ("a host that wants the
// persistent OS chrome thickens this file... see audiostud's os-layout for the full pattern").
//
// A logged-in user WITH `os.enter` (staff/operator) gets the operator meta-editor overlay on EVERY
// authed page: the REAL page renders normally underneath (its own chrome, scroll, interaction intact),
// with a floating operator dock + tool windows ON TOP. A guest / non-`os.enter` principal falls through
// to the plain standalone page, unchanged. The full floating-window OS DESKTOP stays the separate,
// opt-in `/os` route (pages/os.tsx) — this is the lighter always-on overlay, not a replacement for it.
import { usePage } from '@inertiajs/react';
import { type ReactNode, useEffect } from 'react';
import OperatorDesk from '../os/operator-desk';

const OS_ENTER_KEY = 'os.enter';

/**
 * The room the dock takes at the viewport's foot: its orb sits 16px from the bottom and is about 38px tall, plus a gap.
 * Published as `--beam-page-dock-clearance` while the dock is mounted, so the site footer can pad its links clear of it
 * (UX-12a follow-up 2: the orb covered the footer's last link).
 */
const DOCK_CLEARANCE = '72px';

/**
 * ux-walkthrough UX-12a, probe PR-1 (2026-10-06, read-only on audiostud): no author had ever edited an APP page in
 * place, so the in-place editor leaves every non-site case. It overlays `site/*` pages only; app realms get no dock.
 */
export default function OsLayout({ children }: { children: ReactNode }) {
    const page = usePage<{ can?: Record<string, boolean> }>();
    const can = (page.props.can as Record<string, boolean> | undefined) ?? {};
    const entitled = !!can[OS_ENTER_KEY] && (page.component ?? '').startsWith('site/');

    useEffect(() => {
        if (!entitled) return;
        const root = document.documentElement.style;
        root.setProperty('--beam-page-dock-clearance', DOCK_CLEARANCE);
        return () => {
            root.removeProperty('--beam-page-dock-clearance');
        };
    }, [entitled]);

    return (
        <>
            {children}
            {entitled && <OperatorDesk />}
        </>
    );
}
