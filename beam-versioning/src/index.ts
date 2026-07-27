// @splicewire/beam-versioning — the version-history beam surface, authored pre-packaged and
// DTO-first (rehome-components; ADR-0116; ADR-0092 vendor seam). Mirrors PHP
// `splicewire/laravel-beam-versioning`.
//
// The record-agnostic version-history UI extracted from the composition VersionsDrawer. A host
// renders it by supplying ONE transport adapter (+ optional feedback / chrome) through
// <VersionsProvider>; everything else — the react-query data logic, the DTO typing, the
// presentation — travels inside the package. Mount the batteries-included <VersionsPanel />, or
// compose <VersionsList /> + <VersionRestoreDialog /> directly against your own state.

export { VersionsProvider, useVersionsServices, useNotify } from './provider';
export { useVersions, useSaveVersion, useRestoreVersion } from './hooks';
export { VersionsPanel } from './versions-panel';
export { VersionsList } from './versions-list';
export { VersionRestoreDialog } from './version-restore-dialog';
export { relativeTime } from './relative-time';
export type {
    VersionData,
    SaveVersionInput,
    VersionsClient,
    VersionsServices,
    NotifyEvent,
} from './types';
