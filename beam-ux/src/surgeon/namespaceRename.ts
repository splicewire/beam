/**
 * Package-namespaced `App.Data.*`/`App.Enums.*`/etc. reference rename (surgeon-audit-viability
 * ticket 33, splicewire-app). `HostNamespaceProjection::locationFor()` now inserts a package-derived
 * segment right after the pivot (`App.Data.AgentData` -> `App.Data.Tower.AgentData`) to close the
 * cross-package short-name collision class this session hit repeatedly (`ThreadMessageData`,
 * `CreateInvitationData`, `MembershipResourceData`, `TokenResourceData`, `PlanData`). Every
 * hand-written `App.<pivot>.<ClassName>` reference across `ui/src/**` needs the same segment
 * inserted to keep compiling.
 *
 * `App` is a global ambient namespace (`declare namespace App {...}`, no `export`) — every
 * reference is an inline `TSQualifiedName` in type position, never an `import type` specifier (no
 * binding/scope-fan-out complexity ticket 08's call-site migration needed). This makes the rewrite
 * a pure `TSQualifiedName`-rename: find `App.<pivot>...<ClassName>`, look up `<ClassName>`'s real
 * current full path (derived straight from `generated.d.ts`, the single source of truth — not a
 * re-derivation of the PHP-side package rule, so this can never drift from what actually emits),
 * and rewrite if the reference doesn't already match. A no-op on an already-correct reference makes
 * this genuinely idempotent and safe to re-run after any future class relocation between packages —
 * that's the whole point: a future move is "re-run this," not another hand migration.
 *
 * `recast` + `babel-ts` (not `@babel/traverse`) — same reasoning as `sdkHookMigration.ts`/
 * `blockdoc/lens.ts`: a hand-rolled walker avoids pulling traverse in at runtime, and recast's
 * format-preserving reprint means an untouched file round-trips byte-identical.
 */

import * as recast from 'recast';
import * as babelTsParser from 'recast/parsers/babel-ts.js';
import type { File, TSQualifiedName, TSTypeReference } from '@babel/types';

const parser = babelTsParser;

/** Short class/enum name -> its full dotted `App.<pivot>[.<Package>][.<subdir>...].<Name>` path. */
export type NamespaceLookup = Record<string, string>;

/**
 * Parse `generated.d.ts` into a short-name -> full-path lookup. Line-based, not a full AST parse:
 * the file is 100% machine-generated with one namespace-open/type/close per line, so a simple
 * brace-depth stack is exact and far simpler than parsing TS ambient-namespace AST nodes. A bare
 * `}` line is a namespace close; a type body's closing brace is always `};` (has the trailing
 * semicolon a namespace close never has), so the two never get confused.
 */
export function buildNamespaceLookup(generatedDtsSource: string): NamespaceLookup {
    const lookup: NamespaceLookup = {};
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
            const name = typeDecl[1];
            lookup[name] = [...stack, name].join('.');
        }
    }

    return lookup;
}

const PIVOTS = new Set(['Data', 'Enums', 'Models', 'Spiders', 'Conduits', 'Routing']);

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

/** Rebuild a `TSQualifiedName` chain from dotted segments (e.g. `['App','Data','Tower','X']`). */
function qualifiedNameFromSegments(segments: string[]): TSTypeReference['typeName'] {
    const bt = recast.types.builders;
    let node: TSTypeReference['typeName'] = bt.identifier(segments[0]) as unknown as TSTypeReference['typeName'];
    for (let i = 1; i < segments.length; i++) {
        node = bt.tsQualifiedName(node as never, bt.identifier(segments[i])) as unknown as TSTypeReference['typeName'];
    }
    return node;
}

/**
 * Rewrite one file's `App.<pivot>...<ClassName>` references to match `lookup`'s current correct
 * paths. Returns the reprinted source, or null if nothing needed changing (idempotent — re-running
 * on an already-correct file is always a no-op).
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

            if (
                segments !== null &&
                segments.length >= 3 &&
                segments[0] === 'App' &&
                PIVOTS.has(segments[1])
            ) {
                const className = segments[segments.length - 1];
                const correctPath = lookup[className];

                if (correctPath !== undefined) {
                    const correctSegments = correctPath.split('.');
                    const current = segments.join('.');

                    if (current !== correctPath) {
                        (ref as unknown as { typeName: unknown }).typeName =
                            qualifiedNameFromSegments(correctSegments);
                        changed = true;
                    }
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
