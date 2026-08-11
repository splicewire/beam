/**
 * The **inline leaf-engine registry** — the indirection that lets a manifest's `engine` name SELECT a
 * rich-text binding at runtime, so a second engine (ProseMirror) becomes bindable by registering it
 * here, with ZERO changes to any call site.
 *
 * A host registers its engine bindings once at boot (`registerLeafEngine(mdxLeafEngine)`); the generated
 * leaf field resolves the engine the manifest named via `resolveLeafEngine('mdx')`.
 */

import type { EditorDoc, InlineLeafEditor } from './types.js';

/** The process-wide engine table, keyed by engine name. */
const REGISTRY = new Map<string, InlineLeafEditor>();

/**
 * Register an engine binding under its `engine` key. Re-registering the same key REPLACES the prior
 * binding (last-writer-wins) — a host can swap the default mdx binding for a customized one without
 * touching call sites. Returns the binding so a registration can be one expression.
 */
export function registerLeafEngine<Doc extends EditorDoc>(
    engine: InlineLeafEditor<Doc>,
): InlineLeafEditor<Doc> {
    REGISTRY.set(engine.engine, engine as InlineLeafEditor);
    return engine;
}

/** Look up a registered engine by name, or `undefined` if none is registered under that key. */
export function getLeafEngine(engine: string): InlineLeafEditor | undefined {
    return REGISTRY.get(engine);
}

/**
 * Resolve the engine the manifest named — the call-site entry point. Throws a clear error naming the
 * missing engine + the engines that ARE registered, so a manifest typo (`engine: 'prosmirror'`) fails
 * loudly at wire-up instead of silently dropping the leaf editor. Use {@link getLeafEngine} for the
 * soft (may-be-absent) lookup.
 */
export function resolveLeafEngine(engine: string): InlineLeafEditor {
    const found = REGISTRY.get(engine);
    if (!found) {
        const known = [...REGISTRY.keys()];
        throw new Error(
            `No inline leaf engine registered for '${engine}'. ` +
                (known.length
                    ? `Registered engines: ${known.map((k) => `'${k}'`).join(', ')}. `
                    : 'No engines are registered. ') +
                `Register one with registerLeafEngine() before the leaf field mounts.`,
        );
    }
    return found;
}

/** The engine names currently registered — for diagnostics / a manifest validator. */
export function registeredLeafEngines(): string[] {
    return [...REGISTRY.keys()];
}

/** Clear the registry — test-only, so a suite starts from a known-empty table. */
export function __clearLeafEngines(): void {
    REGISTRY.clear();
}
