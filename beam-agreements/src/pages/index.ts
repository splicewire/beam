import type { ComponentType } from 'react';

/**
 * agreements 07: the pages this package draws for a host's Inertia page map, by page name, loaded on demand. Merge them
 * into the host's `pages` as the starter does `beamDocsPages`:
 *
 *     beamInertiaOptions({ pages: { ...beamAgreementsPages, ...pages } })
 */
export const beamAgreementsPages: Record<string, () => Promise<{ default: ComponentType<never> }>> = {
    'agreements/required': () => import('./AgreementsRequired') as Promise<{ default: ComponentType<never> }>,
};
