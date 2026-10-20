import * as t from '@babel/types';

/**
 * `App.<pivot>[.<Package>].*` -> real-native-namespace reference rename (surgeon-audit-viability
 * ticket 33, extended ticket 34, splicewire-app).
 *
 * Ticket 33 made `HostNamespaceProjection::locationFor()` insert a package-derived segment right
 * after the pivot (`App.Data.AgentData` -> `App.Data.Tower.AgentData`) to close the cross-package
 * short-name collision class that session hit repeatedly. Ticket 34 went further and DROPPED that
 * remap entirely — every `#[TypeScript]` class (app-owned, Splicewire-family, or third-party) now
 * emits at its real native PHP namespace (`Splicewire.Tower.Data.AgentData`, not `App.Data.Tower.
 * AgentData`), collision-proof by construction rather than by a custom projection rule. Every
 * hand-written `App.<pivot>[.<Package>].<...>.<ClassName>` reference across `ui/src/**` written
 * against the ticket-33 shape needs the same rename this codemod already does — just to a
 * different target path.
 *
 * IMPORTANT (ticket 34): since collisions between same-short-name classes no longer prevent
 * co-emission (they land at different native paths now), `generated.d.ts` CAN legitimately declare
 * two different classes with the same short name (e.g. two `MembershipResourceData`s, one under
 * `Splicewire.Tower.Data.Frame`, one under `Splicewire.Beam.Accounts.Data.Frame`). A short-name-only
 * lookup would be ambiguous for such cases. This codemod matches on the FULL current dotted path
 * instead — computing, for every class in `generated.d.ts`, what its OLD ticket-33-era `App.*` path
 * WOULD have been (via the same pivot + package-segment derivation that projection used, applied
 * historically here purely to know the shape being migrated FROM), and building an exact
 * old-full-path -> new-full-path map. App-owned and third-party classes were never remapped by
 * ticket 33 either, so their old path already equals their new path — naturally excluded (no-op).
 *
 * `App` is a global ambient namespace (`declare namespace App {...}`, no `export`) — every
 * reference is an inline `TSQualifiedName` in type position, never an `import type` specifier (no
 * binding/scope-fan-out complexity ticket 08's call-site migration needed). This makes the rewrite
 * a pure `TSQualifiedName`-rename: find the reference's full current dotted path, look it up
 * EXACTLY in the rename map, and rewrite if found and different. A no-op when the reference is
 * already at its correct current path (whether that's because it was never remapped, or because a
 * prior run already fixed it) makes this genuinely idempotent and safe to re-run after any future
 * class relocation between packages — that's the whole point: a future move is "re-run this," not
 * another hand migration.
 *
 * `recast` + `babel-ts` (not `@babel/traverse`) — same reasoning as `sdkHookMigration.ts`/
 * `blockdoc/lens.ts`: a hand-rolled walker avoids pulling traverse in at runtime, and recast's
 * format-preserving reprint means an untouched file round-trips byte-identical.
 */
/** Full dotted OLD (ticket-33-era) path -> full dotted NEW (native) path. */
type NamespaceLookup = Record<string, string>;
/**
 * Build the old-full-path -> new-full-path rename map straight from `generated.d.ts` — the single
 * source of truth, not a re-derivation of a rule that could drift from what actually emits.
 */
declare function buildNamespaceLookup(generatedDtsSource: string): NamespaceLookup;
/**
 * Rewrite one file's references whose full current dotted path is a key in `lookup` to the
 * corresponding new path. Returns the reprinted source, or null if nothing needed changing
 * (idempotent — re-running on an already-correct file is always a no-op).
 */
declare function renameFile(source: string, lookup: NamespaceLookup): string | null;
/**
 * Pure core: given every candidate file's source and the lookup, compute the
 * `{file, old, new}` literal-rewrite edits — surgeon's existing generic
 * `literal-rewrite`/`LiteralRewriteOperation`/`surgeon:rewrite` mechanism applies them, same as
 * ticket 08's SDK-hook migration and ticket 26's `->returns()` apply operation.
 */
declare function renameNamespaceReferences(files: Record<string, string>, lookup: NamespaceLookup): Array<{
    file: string;
    old: string;
    new: string;
}>;

/**
 * SDK-hook call-site migration scan (client-sdk-codegen #05 rollout,
 * `.scratch/surgeon-audit-viability/tickets/08-...` in splicewire-app).
 *
 * A domain's `api.ts` sometimes still hand-writes a `useX` react-query wrapper for a route that the
 * codegen pipeline has since started emitting a generated hook for (same name, same route). This scans
 * for that exact shape and, when it's safe to swap, computes the {file, old, new} literal-rewrite edits
 * that retire the hand-written wrapper in favor of the generated one — surgeon's existing generic
 * `LiteralRewriteOperation`/`surgeon:rewrite` applies them; this module only diagnoses + computes spans.
 *
 * Pure over in-memory source maps (no fs) so it unit-tests without touching disk — mirrors
 * `blockdoc/lens.ts`'s split (parse/print over strings) and the PHP `SdkEndpointDriftAudit`'s
 * pure-core-over-collected-data shape. `recast` + `babel-ts`, not `@babel/traverse` — same reason as
 * `lens.ts`: a hand-rolled walker avoids pulling traverse in at runtime.
 *
 * **v2 — plain-string/template-literal call sites.** Not every call site wraps its path in
 * `route('name')`; many hand-write the literal path directly (`api.get('fragments', ...)`,
 * `` api.get(`fragments/${id}`) ``). `ui/src/generated/routes.ts` is a `name → path-template` map
 * already generated by the same `splicewire:beam:generate:client` command that emits the hooks
 * themselves, so no new PHP-side work is needed — {@see buildReverseRouteIndex} inverts it
 * (`path-template → name`) and {@see resolveRouteNameFromSegments} matches a call site's literal path
 * against it, segment by segment, treating `{param}` template segments as wildcards that must align
 * with a `${...}` interpolation (never with literal text sharing a segment).
 */

/** A route-manifest entry — mirrors `RouteEntry`/`RouteMap` in `ui/src/lib/routes.ts`. */
type RouteManifestEntry = string | {
    path: string;
    methods?: string[];
};
/** The shape of `ui/src/generated/routes.ts`'s `defaults` export (or `adminDefaults`). */
type RouteDefaults = Record<string, RouteManifestEntry>;
/** One inverted manifest entry: a path-template split into literal segments and `{param}` wildcards. */
interface ReverseRouteEntry {
    routeName: string;
    /** `null` marks a `{param}` wildcard segment; a string is a literal segment that must match exactly. */
    segments: Array<string | null>;
    methods?: string[];
}
/**
 * Invert `ui/src/generated/routes.ts`'s `defaults` map (`name → path-template`) into
 * `path-template → name`, split into `/`-separated segments so a call site's literal path can be
 * matched positionally. `{fragment}`-style segments become wildcards ({@link ReverseRouteEntry.segments}
 * entries of `null`).
 */
declare function buildReverseRouteIndex(routeDefaults: RouteDefaults): ReverseRouteEntry[];
/**
 * Split a call site's raw path argument (a string literal or a template literal) into the same
 * `/`-separated segment shape {@link buildReverseRouteIndex} produces, so the two can be compared
 * positionally. A template literal's `${...}` interpolations become {@link INTERPOLATION_MARKER} —
 * only a segment that is *purely* an interpolation (no literal text sharing the segment) is treated as
 * a wildcard; a mixed segment (`` `fragments-${id}` ``) can't align with a manifest `{param}` segment
 * and returns `null` (unmatchable), rather than guessing.
 */
declare function pathSegmentsFromNode(node: t.Expression): string[] | null;
/**
 * Resolve a call site's path segments (from {@link pathSegmentsFromNode}) to a route name via
 * {@link ReverseRouteEntry} lookup, matching segment-by-segment and — when the manifest entry carries
 * `methods` — narrowing by the call's HTTP verb to disambiguate routes sharing one path. Returns `null`
 * on no match OR an unresolved ambiguity (multiple routes fit); never guesses.
 */
declare function resolveRouteNameFromSegments(segments: string[], verb: string, reverseIndex: ReverseRouteEntry[]): string | null;
/**
 * Extract a {@link RouteDefaults} object straight from `ui/src/generated/routes.ts`'s source text —
 * pulls the `export const defaults: RouteMap = {...}` (or `adminDefaults`) object literal's static
 * value via the AST. Safe to evaluate structurally rather than `import`ing: the file is auto-generated,
 * so every entry is a plain string or `{ path, methods }` object literal, never a computed value — this
 * lets the CLI load it without a TypeScript loader/register step.
 */
declare function extractRouteDefaultsFromSource(source: string, exportName?: string): RouteDefaults;
interface QueryWrapper {
    functionName: string;
    routeName: string;
    httpVerb: string;
    safe: boolean;
    unsafeReason?: string;
    start: number;
    end: number;
}
interface HookIndexEntry {
    functionName: string;
    routeName: string;
    hookModule: string;
}
interface EditEntry {
    file: string;
    old: string;
    new: string;
}
interface MigrationCandidate {
    functionName: string;
    routeName: string;
    apiFile: string;
    hookModule: string;
    edits: EditEntry[];
}
interface MigrationException {
    functionName: string;
    routeName: string;
    apiFile: string;
    reason: string;
}
interface ScanReport {
    candidates: MigrationCandidate[];
    exceptions: MigrationException[];
}
/** A path → source-text map — the in-memory filesystem stand-in every pure function here operates over. */
type FileMap = Record<string, string>;
/**
 * Every top-level `export function useX(...) { return useQuery({ queryKey: ['route.name', ...], queryFn:
 * async () => { ... api.<verb>(route('route.name', ...)) ... } }); }` wrapper in a module — the shape
 * both a hand-written domain `api.ts` AND a generated `generated/hooks/*.ts` file share, so this one
 * extractor indexes both sides.
 */
declare function findQueryWrappers(source: string, reverseIndex?: ReverseRouteEntry[]): QueryWrapper[];
/** Index every generated hook file's exported `useX` wrappers by (functionName, routeName). */
declare function buildHookIndex(hookFiles: FileMap, reverseIndex?: ReverseRouteEntry[]): HookIndexEntry[];
interface ImportSite {
    start: number;
    end: number;
    specifiers: string[];
    onlyThisName: boolean;
}
/**
 * The import statement in `source` that imports `functionName` from one of `moduleCandidates` (a
 * consumer's relative-specifier resolution of the api module), or null if this file doesn't import it
 * from there.
 */
declare function findImportSite(source: string, functionName: string, moduleCandidates: string[]): ImportSite | null;
/** The relative import specifier a file at `fromFile` would use to import `toFile` (no extension). */
declare function importSpecifierFor(fromFile: string, toFile: string): string;
/**
 * Scan `apiFiles` (the domain `api.ts` files a wrapper may live in) for hand-written `useX` wrappers
 * that a `hookFiles` entry already covers, then search `importerSearchFiles` (a superset — every source
 * file that could plausibly import the wrapper, not just the scoped domain) for the sites that need
 * their import specifier repointed. A wrapper only becomes a `MigrationCandidate` when EVERY importer
 * found resolves cleanly (a single, unbundled `{ useX }` import) — a bundled or unresolved importer
 * downgrades the whole wrapper to an exception rather than emitting a partial, build-breaking edit set.
 *
 * `routeDefaults` is `ui/src/generated/routes.ts`'s `defaults` export (or equivalent) — optional
 * because the v1 `route('name')` shape doesn't need it; passing it in additionally recognizes call
 * sites that hand-write their path as a string/template literal instead (see module docblock).
 */
declare function scan(hookFiles: FileMap, apiFiles: FileMap, importerSearchFiles: FileMap, routeDefaults?: RouteDefaults): ScanReport;

export { type EditEntry, type FileMap, type HookIndexEntry, type MigrationCandidate, type MigrationException, type NamespaceLookup, type QueryWrapper, type ReverseRouteEntry, type RouteDefaults, type RouteManifestEntry, type ScanReport, buildHookIndex, buildNamespaceLookup, buildReverseRouteIndex, extractRouteDefaultsFromSource, findImportSite, findQueryWrappers, importSpecifierFor, pathSegmentsFromNode, renameFile, renameNamespaceReferences, resolveRouteNameFromSegments, scan };
