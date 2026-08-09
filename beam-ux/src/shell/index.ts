/**
 * `@splicewire/beam-ux/shell` — the REALM-AWARE OS-shell layer (editor-promotion ticket 07 / ADR-0017).
 *
 * The generic desktop chrome + window manager are canonical in `@schemastud/mainframe/os`. This subpath
 * re-exports them (so a host imports the OS story from one place) and ADDS the thin realm-awareness:
 * `buildAppsFromManifest` turns the server realm manifest into the chrome's generic `DesktopApp[]`,
 * applying entitlement gating (locked/upsell) + auto-surfacing. The `RealmManifestEntry` /
 * `RealmSurfaceBinding` types live here and NOWHERE in the chrome tier.
 *
 * The old ticket-11 `<Shell>` + its duplicate `windowManager.ts` reducer were ORPHANED (the live path
 * used `@schemastud/mainframe/os`) and are retired — this subpath is now the realm layer, not a second
 * shell. See `.scratch/editor-promotion/issues/07-*` + ADR-0017.
 */
export {
    // Realm-aware builder + its (manifest-side) types — the beam layer's own vocabulary.
    buildAppsFromManifest,
    type RealmManifestEntry,
    type RealmSurfaceBinding,
    type BuildAppsOptions,
    // Re-exported canonical chrome + window manager (from @schemastud/mainframe/os).
    buildDesktopChrome,
    Dock,
    Launcher,
    Clock,
    UpsellPopover,
    WorkspacePersistence,
    OperatorOverlay,
    useWindowManager,
    type DesktopApp,
    type DesktopUpsell,
    type DesktopChromeConfig,
    type OperatorOverlayProps,
    type OverlayWindow,
    type WindowManager,
} from './realm';
