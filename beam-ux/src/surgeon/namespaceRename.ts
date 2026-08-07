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

import * as recast from 'recast';
import * as babelTsParser from 'recast/parsers/babel-ts.js';
import type { File, TSQualifiedName, TSTypeReference } from '@babel/types';

const parser = babelTsParser;

/** Full dotted OLD (ticket-33-era) path -> full dotted NEW (native) path. */
export type NamespaceLookup = Record<string, string>;

const PIVOTS = new Set(['Data', 'Enums', 'Models', 'Spiders', 'Conduits', 'Routing']);

interface DeclaredEntry {
    /** The namespace segments enclosing the declaration, e.g. `['Splicewire','Tower','Data','Frame']`. */
    namespaceSegments: string[];
    className: string;
}

/**
 * Parse `generated.d.ts` into every declared type's (namespace segments, class name). Line-based,
 * not a full AST parse: the file is 100% machine-generated with one namespace-open/type/close per
 * line, so a simple brace-depth stack is exact and far simpler than parsing TS ambient-namespace
 * AST nodes. A bare `}` line is a namespace close; a type body's closing brace is always `};` (has
 * the trailing semicolon a namespace close never has), so the two never get confused.
 */
function parseDeclaredEntries(generatedDtsSource: string): DeclaredEntry[] {
    const entries: DeclaredEntry[] = [];
    const stack: string[] = [];

    for (const rawLine of generatedDtsSource.split('\n')) {
        const line = rawLine.trim();

        const nsOpen = line.match(/^(?:declare\s+)?namespace\s+(\w+)\s*\{$/);
        if (nsOpen) {
            stack.push(nsOpen[1]);
            continue;
        }

        if (line === '}') {
            stack.pop();
            continue;
        }

        const typeDecl = line.match(/^export\s+type\s+(\w+)\s*=/);
        if (typeDecl) {
            entries.push({ namespaceSegments: [...stack], className: typeDecl[1] });
        }
    }

    return entries;
}

/**
 * The owning package's ticket-33-era short FE segment, mirroring the PHP-side
 * `HostNamespaceProjection::packageSegmentFor()`/`ClientTypeName::packageSegmentFor()` derivation
 * exactly (those were deleted by ticket 34, since the projection no longer runs — this is a
 * historical replica, kept only so this codemod knows the shape it's migrating FROM). Null for
 * app-owned code, which stayed flat with no package segment.
 */
function legacyPackageSegmentFor(namespaceSegments: string[]): string | null {
    if (namespaceSegments[0] !== 'Splicewire') return null;
    if (namespaceSegments[1] === 'Tower') return 'Tower';
    if (namespaceSegments[1] === 'Beam') {
        const next = namespaceSegments[2];
        return next !== undefined && !PIVOTS.has(next) ? next : 'Beam';
    }
    return null;
}

/**
 * What this class's OLD ticket-33 `App.<pivot>[.<Package>].<...>.<ClassName>` path would have been,
 * or null if ticket 33 never remapped it (app-owned — already flat `App.*`, identity; or
 * third-party — deferred to native namespace even then) — in both null cases the old path already
 * equals the new native path, so there's nothing to rename.
 */
function legacyProjectedPath(namespaceSegments: string[], className: string): string | null {
    if (namespaceSegments[0] === 'App') return null;
    if (namespaceSegments[0] !== 'Splicewire') return null;

    const pivotIdx = namespaceSegments.findIndex((s) => PIVOTS.has(s));
    if (pivotIdx === -1) return null;

    const pivot = namespaceSegments[pivotIdx];
    const rest = namespaceSegments.slice(pivotIdx + 1);
    const packageSegment = legacyPackageSegmentFor(namespaceSegments);

    const path =
        packageSegment === null
            ? ['App', pivot, ...rest, className]
            : ['App', pivot, packageSegment, ...rest, className];

    return path.join('.');
}

/**
 * Build the old-full-path -> new-full-path rename map straight from `generated.d.ts` — the single
 * source of truth, not a re-derivation of a rule that could drift from what actually emits.
 */
export function buildNamespaceLookup(generatedDtsSource: string): NamespaceLookup {
    const map: NamespaceLookup = {};

    for (const entry of parseDeclaredEntries(generatedDtsSource)) {
        const newPath = [...entry.namespaceSegments, entry.className].join('.');
        const oldPath = legacyProjectedPath(entry.namespaceSegments, entry.className);

        if (oldPath !== null && oldPath !== newPath) {
            map[oldPath] = newPath;
        }
    }

    return map;
}

/** Flatten a `TSQualifiedName`/`Identifier` type-reference chain into its dotted segments. */
function segmentsOf(node: TSTypeReference['typeName']): string[] | null {
    if (node.type === 'Identifier') {
        return [node.name];
    }

    if (node.type === 'TSQualifiedName') {
        const left = segmentsOf((node as TSQualifiedName).left as TSTypeReference['typeName']);
        if (left === null) return null;
        return [...left, (node as TSQualifiedName).right.name];
    }

    return null;
}

/** Rebuild a `TSQualifiedName` chain from dotted segments (e.g. `['Splicewire','Tower','Data','X']`). */
function qualifiedNameFromSegments(segments: string[]): TSTypeReference['typeName'] {
    const bt = recast.types.builders;
    let node: TSTypeReference['typeName'] = bt.identifier(segments[0]) as unknown as TSTypeReference['typeName'];
    for (let i = 1; i < segments.length; i++) {
        node = bt.tsQualifiedName(node as never, bt.identifier(segments[i])) as unknown as TSTypeReference['typeName'];
    }
    return node;
}

/**
 * Rewrite one file's references whose full current dotted path is a key in `lookup` to the
 * corresponding new path. Returns the reprinted source, or null if nothing needed changing
 * (idempotent — re-running on an already-correct file is always a no-op).
 */
export function renameFile(source: string, lookup: NamespaceLookup): string | null {
    let ast: File;
    try {
        ast = recast.parse(source, { parser }) as File;
    } catch {
        return null; // Not a parseable TS/TSX file — leave untouched.
    }

    let changed = false;

    // Hand-rolled walk (no @babel/traverse) — same reasoning as sdkHookMigration.ts/lens.ts.
    const visit = (node: unknown): void => {
        if (node === null || typeof node !== 'object') return;

        if (Array.isArray(node)) {
            for (const item of node) visit(item);
            return;
        }

        const n = node as { type?: string; [key: string]: unknown };

        if (n.type === 'TSTypeReference') {
            const ref = n as unknown as TSTypeReference;
            const segments = segmentsOf(ref.typeName);

            if (segments !== null) {
                const currentPath = segments.join('.');
                const newPath = lookup[currentPath];

                if (newPath !== undefined && newPath !== currentPath) {
                    (ref as unknown as { typeName: unknown }).typeName = qualifiedNameFromSegments(
                        newPath.split('.'),
                    );
                    changed = true;
                }
            }
            // Don't descend into a type reference's own typeName chain further — segmentsOf already
            // consumed it; still walk typeParameters (generic args may nest more references).
            visit((ref as unknown as { typeParameters?: unknown }).typeParameters);
            return;
        }

        for (const key of Object.keys(n)) {
            if (key === 'loc' || key === 'range' || key === 'start' || key === 'end' || key === 'comments') continue;
            visit(n[key]);
        }
    };

    visit(ast.program);

    if (!changed) return null;

    return recast.print(ast).code;
}

/**
 * Pure core: given every candidate file's source and the lookup, compute the
 * `{file, old, new}` literal-rewrite edits — surgeon's existing generic
 * `literal-rewrite`/`LiteralRewriteOperation`/`surgeon:rewrite` mechanism applies them, same as
 * ticket 08's SDK-hook migration and ticket 26's `->returns()` apply operation.
 */
export function renameNamespaceReferences(
    files: Record<string, string>,
    lookup: NamespaceLookup,
): Array<{ file: string; old: string; new: string }> {
    const edits: Array<{ file: string; old: string; new: string }> = [];

    for (const [file, source] of Object.entries(files)) {
        const rewritten = renameFile(source, lookup);
        if (rewritten !== null && rewritten !== source) {
            edits.push({ file, old: source, new: rewritten });
        }
    }

    return edits;
}
