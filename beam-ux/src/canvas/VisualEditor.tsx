// The composed window-mode editor (controlled): a full-screen surface with Insert palette + live canvas +
// Inspector, over a single-root JsonDoc body. Port of the host `VisualEditor`, re-based on JsonNode +
// injected config/theme. `value`/`onChange` carry the body so a host persists it.
import { useMemo, useState } from 'react';
import {
    duplicateAt,
    getAt,
    indexOf,
    insertInto,
    isJsonBlock,
    isLeafText,
    jsonToTsx,
    moveAfter,
    moveBefore,
    parentOf,
    removeAt,
    setProp,
    setText,
    updateAt,
} from '../blockdoc/json.js';
import type { JsonBlock, JsonDoc } from '../blockdoc/json.js';
import { Breadcrumb } from './Breadcrumb.js';
import { CanvasNode } from './CanvasNode.js';
import type { DropEdge } from './CanvasNode.js';
import { ContextMenu } from './ContextMenu.js';
import type { ContextMenuState } from './ContextMenu.js';
import { useCanvas } from './context.js';
import type { BlockTemplate } from './context.js';
import { dropIndicatorCss, selectionCss, veCss } from './css.js';
import type { CanvasTheme } from './css.js';
import { Inspector } from './Inspector.js';
import { insertRelativeTo } from './insert.js';
import { setAttrs } from './props.js';
import { DEFAULT_BLOCK_TEMPLATES } from './templates.js';

export interface VisualEditorProps {
    /** The body — a single-root JsonDoc. */
    value: JsonDoc;
    onChange: (doc: JsonDoc) => void;
    onSave?: () => void;
    theme?: Partial<CanvasTheme>;
    /** Brand label shown in the top bar (host-supplied). Defaults to a generic label. */
    brand?: string;
    /**
     * Undo/redo — entirely host-injected (the package stays version-blind, ADR-0116 four-kind seam).
     * A host typically backs these with its own version-history mechanism (e.g.
     * `@splicewire/beam-versioning`'s `useRestoreVersion`). Buttons render only when supplied.
     */
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
}

export function VisualEditor({
    value,
    onChange,
    onSave,
    theme,
    brand = 'visual editor',
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
}: VisualEditorProps) {
    const config = useCanvas();
    const templates = config.blockTemplates ?? DEFAULT_BLOCK_TEMPLATES;
    const [sel, setSel] = useState<string | null>(null);
    const [editing, setEditing] = useState<string | null>(null);
    const [dragPath, setDragPath] = useState<string | null>(null);
    const [dragTemplate, setDragTemplate] = useState<BlockTemplate | null>(null);
    const [dropTarget, setDropTarget] = useState<{ path: string; edge: DropEdge } | null>(null);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);
    const selNode = sel ? getAt(value, sel) : null;
    const selBlock: JsonBlock | null = selNode && isJsonBlock(selNode) ? selNode : null;
    const serialized = useMemo(() => jsonToTsx(value), [value]);

    const onCanvasClick = (e: React.MouseEvent) => {
        const el = (e.target as HTMLElement).closest('[data-bd-path]');
        const path = el ? el.getAttribute('data-bd-path') : null;
        // A click inside the node currently being text-edited places the caret — let the browser handle
        // it natively. Intercepting here (as every other click is, to drive selection) would both steal
        // the click's default caret-placement behavior AND immediately drop out of edit mode, so typing
        // would never get a chance to start.
        if (editing && path === editing) return;
        e.preventDefault();
        setSel(path);
        setEditing(null);
    };
    const onCanvasDbl = (e: React.MouseEvent) => {
        const p = (e.target as HTMLElement)
            .closest('[data-bd-path]')
            ?.getAttribute('data-bd-path');
        const node = p ? getAt(value, p) : null;
        if (p && node && isJsonBlock(node) && isLeafText(node)) setEditing(p);
    };
    const onCanvasContextMenu = (e: React.MouseEvent) => {
        const p = (e.target as HTMLElement)
            .closest('[data-bd-path]')
            ?.getAttribute('data-bd-path');
        if (!p) return;
        e.preventDefault();
        setSel(p);
        setMenu({ x: e.clientX, y: e.clientY, path: p });
    };

    const addBlock = (make: () => JsonBlock) => onChange(insertRelativeTo(value, sel, make));

    const dnd = {
        onDragStart: (path: string) => {
            setDragTemplate(null);
            setDragPath(path);
        },
        onDragOverNode: (path: string, edge: DropEdge) => setDropTarget({ path, edge }),
        onDrop: () => {
            if (dropTarget) {
                if (dragTemplate) {
                    const index = indexOf(dropTarget.path) + (dropTarget.edge === 'after' ? 1 : 0);
                    onChange(insertInto(value, parentOf(dropTarget.path), index, dragTemplate.make()));
                } else if (dragPath) {
                    const move = dropTarget.edge === 'before' ? moveBefore : moveAfter;
                    onChange(move(value, dragPath, dropTarget.path));
                }
            }
            setDragPath(null);
            setDragTemplate(null);
            setDropTarget(null);
        },
        onDragEnd: () => {
            setDragPath(null);
            setDragTemplate(null);
            setDropTarget(null);
        },
    };

    return (
        <div className="ve-root">
            <style dangerouslySetInnerHTML={{ __html: veCss(theme) }} />
            {sel && (
                <style
                    dangerouslySetInnerHTML={{ __html: selectionCss(sel, theme?.accent ?? '#4F7CFF') }}
                />
            )}
            {(dragPath || dragTemplate) && dropTarget && (
                <style
                    dangerouslySetInnerHTML={{
                        __html: dropIndicatorCss(dropTarget.path, dropTarget.edge, theme?.accent ?? '#4F7CFF'),
                    }}
                />
            )}

            <div className="ve-bar">
                <span className="ve-brand">
                    <span className="ve-mark" />
                    {brand}
                </span>
                <span className="ve-hint">
                    click = select · double-click text = edit · drag = reorder · right-click = actions
                </span>
                <span className="ve-spacer" />
                {(onUndo || onRedo) && (
                    <>
                        <button className="ve-toggle" onClick={onUndo} disabled={!canUndo} title="Undo">
                            ↶ Undo
                        </button>
                        <button className="ve-toggle" onClick={onRedo} disabled={!canRedo} title="Redo">
                            ↷ Redo
                        </button>
                    </>
                )}
                <button
                    className={`ve-toggle${leftOpen ? ' on' : ''}`}
                    onClick={() => setLeftOpen((v) => !v)}
                >
                    Insert
                </button>
                <button
                    className={`ve-toggle${rightOpen ? ' on' : ''}`}
                    onClick={() => setRightOpen((v) => !v)}
                >
                    Inspector
                </button>
                {onSave && (
                    <button className="ve-toggle ve-save" onClick={onSave}>
                        Save
                    </button>
                )}
            </div>

            <div className="ve-body">
                {leftOpen && (
                    <aside className="ve-palette">
                        <div className="ve-insp-h">Insert block</div>
                        {templates.map((b) => (
                            <button
                                key={b.label}
                                className="ve-pal-item"
                                draggable
                                onDragStart={() => setDragTemplate(b)}
                                onDragEnd={() => setDragTemplate(null)}
                                onClick={() => addBlock(b.make)}
                            >
                                + {b.label}
                            </button>
                        ))}
                        <div className="ve-pal-note">
                            click inserts into / after the selection · drag to drop at a specific position
                        </div>
                    </aside>
                )}

                <div
                    className="ve-canvas"
                    onClickCapture={onCanvasClick}
                    onDoubleClick={onCanvasDbl}
                    onContextMenu={onCanvasContextMenu}
                >
                    {value.map((n, i) => (
                        <CanvasNode
                            key={i}
                            node={n}
                            path={String(i)}
                            editing={editing}
                            onEditText={(p, text) => {
                                onChange(
                                    updateAt(value, p, (el) =>
                                        isJsonBlock(el) ? setText(el, text) : el,
                                    ),
                                );
                                setEditing(null);
                            }}
                            onEditMd={(p, md) =>
                                onChange(
                                    updateAt(value, p, (el) =>
                                        isJsonBlock(el) ? setProp(el, 'md', md, 'string') : el,
                                    ),
                                )
                            }
                            dnd={dnd}
                        />
                    ))}
                </div>

                {rightOpen && (
                    <aside className="ve-side">
                        {sel && <Breadcrumb doc={value} path={sel} onSelect={setSel} />}
                        {selBlock ? (
                            <Inspector
                                block={selBlock}
                                onAttrs={(attrs) =>
                                    onChange(
                                        updateAt(value, sel!, (el) =>
                                            isJsonBlock(el) ? setAttrs(el, attrs) : el,
                                        ),
                                    )
                                }
                                onDelete={() => {
                                    if (sel && sel !== '0') {
                                        onChange(removeAt(value, sel));
                                        setSel(null);
                                    }
                                }}
                            />
                        ) : (
                            <div className="ve-insp-empty">Select an element to edit it.</div>
                        )}
                        <div className="ve-src">
                            <div className="ve-insp-h">Serialized</div>
                            <pre>{serialized}</pre>
                        </div>
                    </aside>
                )}
            </div>

            {menu && (
                <ContextMenu
                    state={menu}
                    onClose={() => setMenu(null)}
                    actions={[
                        {
                            label: 'Duplicate',
                            onSelect: () => onChange(duplicateAt(value, menu.path)),
                        },
                        {
                            label: 'Delete',
                            danger: true,
                            onSelect: () => {
                                if (menu.path === '0') return;
                                onChange(removeAt(value, menu.path));
                                if (sel === menu.path) setSel(null);
                            },
                        },
                    ]}
                />
            )}
        </div>
    );
}
