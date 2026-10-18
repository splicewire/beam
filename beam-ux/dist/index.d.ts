import { BeamUxEntryBodyData } from '@splicewire/beam-resources/types/beam-ux';
export { BeamUxEntryBodyData } from '@splicewire/beam-resources/types/beam-ux';
import * as react from 'react';
import { ReactNode } from 'react';
import { a as UxBuilderServices, N as NotifyEvent, R as Region, T as TreeNode, P as PaletteItem, b as RegionKind } from './types-D6AwYR17.js';
export { E as EntryPublicationState, c as EntryVersion, U as UxBuilderClient } from './types-D6AwYR17.js';
import * as _tanstack_react_query from '@tanstack/react-query';
import { SchemaNode } from '@schemastud/seam';

declare function UxBuilderProvider({ services, children, }: {
    services: UxBuilderServices;
    children: ReactNode;
}): react.JSX.Element;
declare function useUxBuilderServices(): UxBuilderServices;
/** The injected `notify`, or the console default when the host supplied none. */
declare function useNotify(): (event: NotifyEvent) => void;

/** Load a region's schema + body through the injected `client.loadBody`, addressed by entry id. */
declare function useEntryBody(id: string | null): _tanstack_react_query.UseQueryResult<BeamUxEntryBodyData, Error>;
/**
 * Save a region's body through the injected `client.saveBody`. On success it seeds the fresh
 * projection back into the query cache, invalidates the entry-body key, and fires the feedback sink.
 */
declare function useSaveEntryBody(): _tanstack_react_query.UseMutationResult<BeamUxEntryBodyData, Error, {
    id: string;
    body: Record<string, unknown>;
}, unknown>;

/**
 * Whether the current manifest admits one resource operation for this actor.
 *
 * CRUD stays on Frame's injected `can` seam, which a host wires from the manifest and may enrich.
 * Declared custom operations read their server-projected `can.actions` value directly. Both paths
 * deny while the manifest is absent, so a loading or older host never flashes a control that 403s.
 */
declare function useCan(resource: string, operation: string): boolean;

/** Shared props for the region editor surfaces (inspector + overlay). */
interface RegionEditorProps {
    region: Region;
    schema: SchemaNode | null;
    body: Record<string, unknown>;
    onChange: (body: Record<string, unknown>) => void;
    onSave: () => void;
    /**
     * Drop the in-flight edit buffer, returning the editor to the last persisted body. Optional
     * because the surfaces are also mounted by hosts that own the buffer themselves and have no
     * separate draft to discard; the control renders disabled when it is omitted rather than
     * rendering an affordance that does nothing.
     */
    onDiscard?: () => void;
    saving?: boolean;
}
/**
 * The docked region-editor panel — the always-present right-hand inspector column. Header carries the
 * kind icon + label + record mono + a neutral kind badge (residency/facade chips deliberately dropped:
 * both resolve BELOW the surface); body is the kind-driven editor.
 */
declare function RegionInspector({ region, schema, body, onChange, onSave, onDiscard, saving, }: RegionEditorProps): react.JSX.Element;

/**
 * The THEME ENTRY's editor seat — the one surface that lets an author change a theme token through a
 * UI instead of hand-editing a seeder and reseeding (G2-BEAM-THEME-NAV).
 *
 * ## It is Frame's form on the entry, not a bespoke theme UI — deliberately
 *
 * `theme-entries-and-authoring`'s PRD closed Part A §5 with exactly this ruling: the theme editor is
 * "Frame's edit form on the `ParticleResource`, not a bespoke UI". So this component invents no
 * widget, no color picker, no token taxonomy. It is the same three moving parts every other region
 * editor in this package already is, wired to one entry id:
 *
 *   {@link useEntryBody} → {@link RegionInspector} (`kind: 'form'` ⇒ the REAL `@schemastud/seam`
 *   SchemaForm over `{schema, body}`) → {@link useSaveEntryBody}.
 *
 * The schema is the SERVER's: `Splicewire\Beam\Ux\Particle\EntryBodyEnvelope::schemaFor()` answers a
 * `UxType::Theme` entry with `ThemeSchemas`' `{canvas, site}` JSON Schema, so the fields an author
 * sees are generated from the same declaration `ThemeResolver::defaults()` reads its defaults from.
 * Adding a token in PHP adds a field here with no change to this file — which is the whole point of
 * routing a theme through the entry-body transport rather than a bespoke endpoint.
 *
 * ## The un-schema'd namespaces must round-trip — and today something else already ensures that
 *
 * A theme BODY carries three namespaces (`{canvas, shell, site}`); the schema the server hands the
 * form carries TWO — `shell` is omitted on purpose (`schemaFor()`'s docblock: no consuming host has an
 * `/os` chrome to theme, so it would be dead form fields). Writing back a body with no `shell` key
 * would reset every OS-shell token to its package default on the first theme save, silently, since
 * nothing on the screen ever showed that namespace.
 *
 * The edit buffer is therefore the form's output MERGED OVER the loaded body rather than a
 * replacement for it — the same "edit one key, spread the rest through untouched" discipline
 * {@link RegionEditorBody}'s `RichtextEditor` applies to MDX frontmatter.
 *
 * ⚠️ **Measured 2026-09-12: that merge is a belt, not the braces.** `@rjsf`'s `omitExtraData` defaults
 * to `false`, so the SchemaForm's `formData` ALREADY carries `shell` straight through untouched, and
 * `ThemeEditor.test.tsx`'s round-trip case passes against a version of this file that writes
 * `setDraft(next)` with no merge at all (verified by running it that way). Its value is what it pins —
 * the OUTCOME, that a theme save preserves what the form never rendered — which would start failing
 * the day `FormEditor` gained `omitExtraData: true` or the buffer stopped being seeded from the loaded
 * body. What the merge buys is that this component owes that outcome to its own code rather than to a
 * third-party default; it does not buy a case that distinguishes the two today, and no comment here
 * should claim otherwise.
 *
 * ## Host responsibilities
 *
 * The host supplies the entry id (only the server knows the per-database uuid of the
 * `namespace=theme, slug=default` row), mounts this inside its `<UxBuilderProvider>` + a
 * `QueryClientProvider`, and gates the route — the `save-body` operation declares
 * `ability: 'ux.author'` and refuses a guest or a member on its own, but a screen nobody may write
 * through should not be a door either.
 */
declare function ThemeEditor({ entryId, label, note, }: {
    /** The `namespace=theme, slug=default` entry's id, resolved server-side and shared as a prop. */
    entryId: string;
    label?: string;
    note?: string;
}): react.JSX.Element;

/**
 * The floating in-context region editor — the OVERLAY-placement variant of {@link RegionInspector}. A
 * self-managing popover hovering over the live page canvas, with a close button. Same kind-driven body
 * as the inspector; only the chrome (shadow, ring, dismiss) differs.
 */
declare function RegionOverlay({ region, schema, body, onChange, onSave, onDiscard, saving, onClose, }: RegionEditorProps & {
    onClose: () => void;
}): react.JSX.Element;

/**
 * The structural CSS the UX-builder chrome injects, as a **string** — the same contract as
 * `docs/css.ts` and `<Prose>`: the package ships no `.css` file and is `sideEffects: false`, so a
 * stylesheet import is something a bundler is entitled to drop, and an import-time injection is
 * exactly what tree-shaking removes. Each component renders this sheet itself, inline, so it travels
 * with the markup it styles.
 *
 * ## Why these rules are not Tailwind utilities
 *
 * They were (beam-docs-satellite 62). A host's Tailwind scans the host's own sources, not
 * `node_modules/@splicewire/beam-ux/dist`, so a utility that exists only inside this package's bundle
 * is a class name with no rule behind it: correct markup, absent styling, HTTP 200 — and only an
 * emitted-class-set diff can see it. Sixteen literals depended on the host deriving its scan scope
 * (`familySources()` in `@schemastud/seam/vite`); the ones that belong to the builder chrome live
 * here now, and `utility-literals.test.tsx` is what stops the seventeenth.
 *
 * ## Every value is a token with a plain fallback
 *
 * The package picks the ARRANGEMENT (a rail width, an inset, a ring); the host picks what those are by
 * redefining `--beam-ux-*` on any ancestor. Colour is read from the shadcn semantic set every host
 * already defines at `:root` (`--primary`, `--background`, `--card`) — never a hex, never one host's
 * brand prefix. The defaults are the numbers the utilities had hardcoded (`300px`, `360px`/`400px`,
 * `1.5rem` for `right-6`, `6rem` for `top-24`, `-0.625rem` for `-top-2.5`), so the lift changes no
 * pixel on a host that redefines nothing.
 */
declare const UX_BUILDER_CSS = "\n/* the floating in-context region editor (RegionOverlay) \u2014 Tailwind's 2xl shadow. Utility names are\n   kept out of this string's comments on purpose: the string ships in dist, and a host that scans it\n   would generate a rule from the prose (beam-docs-satellite 63). */\n.beam-ux-overlay { box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25); }\n\n/* the fixed dock the overlay floats in, in overlay placement (UxBuilder) */\n.beam-ux-overlay-dock {\n  position: fixed;\n  right: var(--beam-ux-overlay-inset, 1.5rem);\n  top: var(--beam-ux-overlay-top, 6rem);\n  z-index: 40;\n  width: var(--beam-ux-overlay-width, 380px);\n}\n\n/* an engageable region on the live canvas (RegionBlock): hover ring, and the label tab that\n   reveals on hover or engage */\n.beam-ux-region:not([data-engaged]):hover {\n  box-shadow: 0 0 0 1px color-mix(in oklab, var(--primary) 20%, transparent);\n}\n.beam-ux-region-tab {\n  top: -0.625rem;\n  opacity: 0;\n  transition-property: opacity;\n  transition-duration: 150ms;\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);\n}\n.beam-ux-region:hover .beam-ux-region-tab,\n.beam-ux-region[data-engaged] .beam-ux-region-tab { opacity: 1; }\n\n/* the \"opaque island\" scrim over a self-loading frame preview (RegionEditorBody) */\n.beam-ux-scrim {\n  background-image: linear-gradient(to top, color-mix(in oklab, var(--background) 70%, transparent), transparent);\n}\n\n/* the caption beside the mode toggle \u2014 hidden on a narrow viewport (UxBuilder) */\n.beam-ux-mode-hint { display: none; }\n@media (min-width: 48rem) { .beam-ux-mode-hint { display: inline; } }\n\n/* the two-column geometries: composition tree + editor (StructurePanel), canvas + docked inspector\n   (UxBuilder). Single column below the lg breakpoint, as the utilities were. */\n@media (min-width: 64rem) {\n  .beam-ux-structure-grid { grid-template-columns: minmax(0, 1fr) var(--beam-ux-structure-aside, 300px); }\n  .beam-ux-inspector-grid { grid-template-columns: minmax(0, 1fr) minmax(var(--beam-ux-inspector-min, 360px), var(--beam-ux-inspector-max, 400px)); }\n}\n";

/**
 * A single engageable region on the live page canvas — its public-facing preview as it renders on the
 * real page, wrapped in an engage affordance. A div (not a button) because regions nest real shipped
 * <Button>s in their preview; role/tabIndex keep it engageable without an invalid button-in-button.
 */
declare function RegionBlock({ region, engaged, onEngage, }: {
    region: Region;
    engaged: boolean;
    onEngage: () => void;
}): react.JSX.Element;
/** The live page canvas — every region as an engageable block, top-to-bottom. */
declare function RegionCanvas({ regions, engaged, onEngage, }: {
    regions: Region[];
    engaged: string | null;
    onEngage: (regionId: string) => void;
}): react.JSX.Element;

/**
 * Structure mode — the page-composition layer, kept SEPARATE from overlay editing. The composition
 * tree (the rungs the tree actually carries) on the left with the selected region's placement config
 * beneath it, and the component palette on the right. `renderEditor` is the editor slot for the
 * selected region (the host wires load/save through it); the palette is the drop-source structural
 * layer.
 */
declare function StructurePanel({ pageTree, palette, selected, selectedRegion, onSelect, renderEditor, }: {
    pageTree: TreeNode;
    palette: PaletteItem[];
    selected: string | null;
    selectedRegion: Region | null;
    onSelect: (regionId: string) => void;
    renderEditor: (region: Region) => ReactNode;
}): react.JSX.Element;

type BuilderMode = 'overlay' | 'structure';
/** WHERE the editor materializes in overlay mode when a region is dock-placed. */
type EditorPlacement = 'inspector' | 'overlay';
/**
 * Kind-driven placement (the S10 rule): form / richtext / frame DOCK in the inspector (or structure
 * panel); list POPS as a floating overlay. The `EditorPlacement` prop is the fork for the dock-target
 * in overlay mode; a `list`-kind region always floats regardless.
 */
declare function placementFor(kind: RegionKind, placement: EditorPlacement): EditorPlacement;
/**
 * The BeamUx UX-builder root — in-app visual editing of the beam site's OWN front-end. Composes the
 * live region canvas, the docked/floating region editors, and the composition structure panel over ONE
 * mode toggle (overlay / structure). Overlay + Structure are CO-EQUAL, kind-driven placement. Load/save
 * routes through the package's react-query hooks + the injected transport client.
 */
declare function UxBuilder({ regions, pageTree, palette, editorPlacement, initialMode, initialEngaged, }: {
    regions: Region[];
    pageTree: TreeNode;
    palette: PaletteItem[];
    /** In overlay mode, where a dock-placed editor mounts. `list`-kind regions always float. */
    editorPlacement?: EditorPlacement;
    initialMode?: BuilderMode;
    /** The region id engaged on first mount (defaults to the first region). */
    initialEngaged?: string;
}): react.JSX.Element;

/**
 * The ONE home for author chrome (app-walkthrough APP-10, APP-22, M14): wire types, routes, ADR numbers, config paths
 * and guards. Authors want them beside the surface they describe; users must never read them as copy. So this renders
 * only in a development build (`import.meta.env.DEV`) and is `null` in production, which keeps the production-bundle
 * probe (APP-23) clean. Product copy states what the user can do and what happens; the mechanism lives here or in a
 * docblock.
 */
declare function AuthorNote({ children, className }: {
    children: ReactNode;
    className?: string;
}): react.JSX.Element | null;

export { AuthorNote, type BuilderMode, type EditorPlacement, NotifyEvent, PaletteItem, Region, RegionBlock, RegionCanvas, type RegionEditorProps, RegionInspector, RegionKind, RegionOverlay, StructurePanel, ThemeEditor, TreeNode, UX_BUILDER_CSS, UxBuilder, UxBuilderProvider, UxBuilderServices, placementFor, useCan, useEntryBody, useNotify, useSaveEntryBody, useUxBuilderServices };
