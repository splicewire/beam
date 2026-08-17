// The registered heavyweight widget (WIDGET_NAME in registry.ts) FiveRegionEditShell mounts
// full-surface in its canvas region. Everything about the block tree itself — text edit, drag-reorder,
// opaque islands, entitlement sealing, breadcrumb, context menu — is UNCHANGED, still CanvasNode/
// blockdoc all the way down; only SELECTION, node-attrs read/write, and insert candidates now route
// through the shared `editShellMount` instead of local component state, so the shell's Inspector/
// palette/save-pill drive (and are driven by) the same channel a plain `<VisualEditor>` used to own
// entirely by itself.
import { useEffect, useState } from 'react';
import type { EditShellMountValue } from '@schemastud/frame';
import {
    duplicateAt,
    getAt,
    indexOf,
    insertInto,
    isJsonBlock,
    isLeafText,
    moveAfter,
    moveBefore,
    parentOf,
    removeAt,
    setProp,
    setText,
    updateAt,
} from '../blockdoc/json.js';
import type { ContextMenuAction } from './ContextMenu.js';
import type { JsonDoc, JsonNode } from '../blockdoc/json.js';
import { attrsSchemaFor } from './attrsSchema.js';
import { Breadcrumb } from './Breadcrumb.js';
import { CanvasNode } from './CanvasNode.js';
import type { DropEdge } from './CanvasNode.js';
import { ContextMenu } from './ContextMenu.js';
import type { ContextMenuState } from './ContextMenu.js';
import { useCanvas } from './context.js';
import { dropIndicatorCss, selectionCss } from './css.js';
import { setAttrs } from './props.js';
import { insertRelativeTo } from './insert.js';
import { DEFAULT_BLOCK_TEMPLATES } from './templates.js';

/** The `DataTransfer` key a palette drag stashes its template's `nodeType` under — the bridge for a
 * drag that starts in the shell's palette region (a REACT SIBLING of this widget, not an ancestor/
 * descendant) with no shared React state to use instead. See CanvasPalette.tsx (the drag source). */
export const TEMPLATE_DATA_KEY = 'application/x-beam-ux-template';

export interface CanvasWidgetProps {
    /** WidgetSurface passes the record as BOTH `value` and `formData`; either is accepted. */
    value?: JsonDoc;
    formData?: JsonDoc;
    onChange?: (doc: JsonDoc) => void;
    editShellMount?: EditShellMountValue;
    readOnly?: boolean;
}

/** The path of `path`'s sibling `delta` positions over (-1 previous, +1 next), or `null` past either
 * end. Root-level paths ("0", "1", …) have no dot; nested paths ("0.2") keep their parent prefix. */
function siblingPath(path: string, delta: number): string | null {
    const parent = parentOf(path);
    const idx = indexOf(path) + delta;
    if (idx < 0) return null;
    return parent === '' ? String(idx) : `${parent}.${idx}`;
}

function countNodes(nodes: JsonNode[]): number {
    let n = 0;
    for (const node of nodes) {
        n += 1;
        if (isJsonBlock(node)) n += countNodes(node.children);
    }
    return n;
}

export function CanvasWidget({ value, formData, onChange, editShellMount: mount, readOnly = false }: CanvasWidgetProps) {
    const config = useCanvas();
    const doc: JsonDoc = value ?? formData ?? [];
    const templates = config.blockTemplates ?? DEFAULT_BLOCK_TEMPLATES;
    const accent = '#4F7CFF';

    const [editing, setEditing] = useState<string | null>(null);
    const [dragPath, setDragPath] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<{ path: string; edge: DropEdge } | null>(null);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);

    const sel = mount?.selectedNodeId ?? null;
    const setSel = (path: string | null) => mount?.selectNode(path);

    const emit = (next: JsonDoc) => {
        if (readOnly) return;
        onChange?.(next);
        mount?.markDirty(true);
    };

    // Node access: the shell's generic Inspector calls getNode(selectedNodeId)/setNodeAttrs(...) —
    // re-registered whenever the doc or the entitlement-key pool changes so these closures are never
    // stale (a registration overwrites the mount's single NodeAccess slot; see EditShellMount).
    useEffect(() => {
        if (!mount) return;
        return mount.registerNodeAccess({
            getNode: (nodeId) => {
                const node = getAt(doc, nodeId);
                if (!node || !isJsonBlock(node)) return null;
                const { schema, attrs } = attrsSchemaFor(node, config.entitlementKeys ?? []);
                return { type: node.name ?? 'fragment', attrsSchema: schema, attrs };
            },
            setNodeAttrs: (nodeId, attrs) => {
                emit(
                    updateAt(doc, nodeId, (el) =>
                        isJsonBlock(el) ? setAttrs(el, attrs as Record<string, string>) : el,
                    ),
                );
            },
        });
        // `mount` is deliberately OMITTED — useEditShellMountController() returns a NEW object identity
        // whenever ANY of its internal state changes (selectedNodeId/dirty/saving/candidates/
        // conformance), so depending on the whole object here would re-run this effect on every
        // unrelated mount change; that's wasteful for this one (it just re-registers into a ref, no
        // state churn), but genuinely an INFINITE LOOP for the two effects below, which both call a
        // setState-backed publish method — publish -> mount identity changes -> effect re-runs (because
        // it depended on `mount`) -> publishes again -> forever. `mount` itself is read fresh from
        // this render's props regardless (it's not stale — only the DEPENDENCY LIST omits it).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doc, config.entitlementKeys]);

    // Insert candidates: the palette region reads mount.candidates and calls mount.insert(candidate)
    // on click (drag goes through TEMPLATE_DATA_KEY instead, handled in onDrop below) — this widget
    // resolves the candidate back to its template's make() and inserts relative to the current
    // selection, mirroring the old in-canvas addBlock().
    useEffect(() => {
        if (!mount) return;
        mount.publishCandidates(templates.map((t) => ({ nodeType: t.label, label: t.label })));
        return mount.registerInsertHandler((candidate) => {
            const nodeType = (candidate as { nodeType?: string } | null)?.nodeType;
            const template = templates.find((t) => t.label === nodeType);
            if (template) emit(insertRelativeTo(doc, sel, template.make));
        });
        // `mount` omitted — see the previous effect's comment (this is one of the two that WOULD
        // infinite-loop if it depended on `mount`: publishCandidates changes mount's identity, which
        // would re-trigger this effect, which publishes again).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doc, sel, templates]);

    // Conformance: an honest PARTIAL readout for the status bar — a real node count, but no
    // required-slot/grammar concept exists for a JsonDoc today, so those report as trivially
    // satisfied (0 of 0, valid) rather than fabricated.
    useEffect(() => {
        mount?.publishConformance({
            nodes: countNodes(doc),
            requiredTotal: 0,
            requiredFilled: 0,
            grammarValid: true,
            incompleteNodeIds: [],
        });
        // `mount` omitted — the other infinite-loop-prone effect (publishConformance changes mount's
        // identity too).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doc]);

    const onCanvasClick = (e: React.MouseEvent) => {
        const el = (e.target as HTMLElement).closest('[data-bd-path]');
        const path = el ? el.getAttribute('data-bd-path') : null;
        // A click inside the node currently being text-edited places the caret — let the browser
        // handle it natively (see CanvasNode's own docs for why intercepting it here breaks typing).
        if (editing && path === editing) return;
        e.preventDefault();
        setSel(path);
        setEditing(null);
    };
    const onCanvasDbl = (e: React.MouseEvent) => {
        const p = (e.target as HTMLElement).closest('[data-bd-path]')?.getAttribute('data-bd-path');
        const node = p ? getAt(doc, p) : null;
        if (!readOnly && p && node && isJsonBlock(node) && isLeafText(node)) setEditing(p);
    };
    const onCanvasContextMenu = (e: React.MouseEvent) => {
        const p = (e.target as HTMLElement).closest('[data-bd-path]')?.getAttribute('data-bd-path');
        if (!p) return;
        e.preventDefault();
        setSel(p);
        setMenu({ x: e.clientX, y: e.clientY, path: p });
    };

    const dnd = {
        onDragStart: (path: string) => setDragPath(path),
        onDragOverNode: (path: string, edge: DropEdge) => setDropTarget({ path, edge }),
        onDrop: (dataTransfer: DataTransfer | null) => {
            const templateNodeType = dataTransfer?.getData(TEMPLATE_DATA_KEY);
            if (dropTarget && templateNodeType) {
                const template = templates.find((t) => t.label === templateNodeType);
                if (template) {
                    const index = indexOf(dropTarget.path) + (dropTarget.edge === 'after' ? 1 : 0);
                    emit(insertInto(doc, parentOf(dropTarget.path), index, template.make()));
                }
            } else if (dropTarget && dragPath) {
                const move = dropTarget.edge === 'before' ? moveBefore : moveAfter;
                emit(move(doc, dragPath, dropTarget.path));
            }
            setDragPath(null);
            setDropTarget(null);
        },
        onDragEnd: () => {
            setDragPath(null);
            setDropTarget(null);
        },
    };

    const contextMenuActions = (path: string): ContextMenuAction[] => {
        const prev = siblingPath(path, -1);
        const next = siblingPath(path, 1);
        return [
            { label: 'Duplicate', onSelect: () => emit(duplicateAt(doc, path)) },
            {
                label: 'Move up',
                disabled: !prev || !getAt(doc, prev),
                onSelect: () => {
                    if (prev) emit(moveBefore(doc, path, prev));
                },
            },
            {
                label: 'Move down',
                disabled: !next || !getAt(doc, next),
                onSelect: () => {
                    if (next) emit(moveAfter(doc, path, next));
                },
            },
            {
                label: 'Insert',
                children: templates.map((t) => ({
                    label: t.label,
                    onSelect: () => emit(insertRelativeTo(doc, path, t.make)),
                })),
            },
            {
                label: 'Delete',
                danger: true,
                disabled: path === '0',
                onSelect: () => {
                    if (path === '0') return;
                    emit(removeAt(doc, path));
                    if (sel === path) setSel(null);
                },
            },
        ];
    };

    return (
        <div className="ve-canvas-widget">
            {sel && <style dangerouslySetInnerHTML={{ __html: selectionCss(sel, accent) }} />}
            {dropTarget && (
                <style
                    dangerouslySetInnerHTML={{
                        __html: dropIndicatorCss(dropTarget.path, dropTarget.edge, accent),
                    }}
                />
            )}

            {sel && <Breadcrumb doc={doc} path={sel} onSelect={setSel} />}

            <div
                className="ve-canvas"
                onClickCapture={onCanvasClick}
                onDoubleClick={onCanvasDbl}
                onContextMenu={onCanvasContextMenu}
            >
                {doc.map((n, i) => (
                    <CanvasNode
                        key={i}
                        node={n}
                        path={String(i)}
                        editing={editing}
                        onEditText={(p, text) => {
                            emit(updateAt(doc, p, (el) => (isJsonBlock(el) ? setText(el, text) : el)));
                            setEditing(null);
                        }}
                        onEditMd={(p, md) =>
                            emit(
                                updateAt(doc, p, (el) =>
                                    isJsonBlock(el) ? setProp(el, 'md', md, 'string') : el,
                                ),
                            )
                        }
                        dnd={dnd}
                    />
                ))}
            </div>

            {menu && (
                <ContextMenu
                    state={menu}
                    onClose={() => setMenu(null)}
                    actions={contextMenuActions(menu.path)}
                />
            )}
        </div>
    );
}
