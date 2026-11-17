import type { ReactNode } from 'react';
import { useBeamUxMessages } from '../messages.js';

/**
 * The ONE home for author chrome (app-walkthrough APP-10, APP-22, M14): wire types, routes, ADR numbers, config paths
 * and guards. Authors want them beside the surface they describe; users must never read them as copy. So this renders
 * only in a development build (`import.meta.env.DEV`) and is `null` in production, which keeps the production-bundle
 * probe (APP-23) clean. Product copy states what the user can do and what happens; the mechanism lives here or in a
 * docblock.
 */
export function AuthorNote({ children, className }: { children: ReactNode; className?: string }) {
    // A shared development build is read by people who are not its authors, so the title is copy (31 ruling 04:30Z).
    const m = useBeamUxMessages();
    if (!import.meta.env?.DEV) {
        return null;
    }

    return (
        <span
            data-author-note=""
            title={m.t('splicewire-beam-ux::messages.author_note_title')}
            className={['font-mono text-[10px] text-muted-foreground/70', className].filter(Boolean).join(' ')}
        >
            {children}
        </span>
    );
}
