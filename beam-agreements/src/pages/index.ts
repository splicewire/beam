import type { ComponentType } from 'react';

/**
 * agreements 07 and 09: the pages this package draws for a host's Inertia page map, by page name, loaded on demand. Merge them
 * into the host's `pages` as the starter does `beamDocsPages`:
 *
 *     beamInertiaOptions({ pages: { ...beamAgreementsPages, ...pages } })
 */
export const beamAgreementsPages: Record<string, () => Promise<{ default: ComponentType<any> }>> = {
    'agreements/required': () => import('./AgreementsRequired') as Promise<{ default: ComponentType<any> }>,
    // agreements 09: the public legal pages (the seam's AgreementsRoutes::mountPublic()).
    'agreements/legal': () => import('./Legal') as Promise<{ default: ComponentType<any> }>,
    'agreements/legal-version': () => import('./LegalVersion') as Promise<{ default: ComponentType<any> }>,
    // agreements 12: the counterparty's signed page (the seam's AgreementsRoutes::mountConsent()).
    'agreements/consent': () => import('./Consent') as Promise<{ default: ComponentType<any> }>,
};
