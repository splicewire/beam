import type { EntryPublicationState } from '../types';
/** Null head is editable only when the server reports no history and no pin at all. */
export const isUnauthored = (state: EntryPublicationState): boolean =>
    state.headVersion === null && state.publishedVersion === null && state.versions.length === 0;
export const canMountPublication = (state: EntryPublicationState, authoredComponent = false): boolean =>
    isUnauthored(state) || (!!state.headVersion && !!state.publishedVersion)
    || (authoredComponent && state.publishedVersion === null && !!state.headVersion && state.versions.some(version => version.id === state.headVersion));

/** The native body read supplies the type and declared blocks interface; no client entry-ref flag grants this. */
export function isAuthoredComponentEnvelope(envelope: unknown): boolean {
    if (!envelope || typeof envelope !== 'object') return false;
    const read = envelope as {type?: unknown;body?: unknown};
    if (read.type !== 'component' || !Array.isArray(read.body) || read.body.length !== 1) return false;
    const root = read.body[0];
    return !!root && root.kind === 'block' && !!root.component && typeof root.component.name === 'string' && Array.isArray(root.component.props);
}
