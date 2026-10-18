import type { EntryPublicationState } from '../types';
/** Null head is editable only when the server reports no history and no pin at all. */
export const isUnauthored = (state: EntryPublicationState): boolean =>
    state.headVersion === null && state.publishedVersion === null && state.versions.length === 0;
export const canMountPublication = (state: EntryPublicationState): boolean =>
    isUnauthored(state) || (!!state.headVersion && !!state.publishedVersion);
