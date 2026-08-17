// In-place page editor: renders the entry's body INSIDE the real page (host layout chrome + full class
// hierarchy intact, so styles are correct), read-only until an operator enters window mode (via the host's
// dock "Edit content"), then the same content region becomes editable with FLOATING panels (Insert ·
// Inspector) + Save + Exit. Port of the host `PageEditor`, re-based on JsonNode + injected transport/notify
// (no `sonner`, no app imports). The mode seam (`beam-ux:mode` / `beam-ux:exit` window events) is preserved.
import { useEffect, useState } from 'react';
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
import type { JsonBlock, JsonDoc } from '../blockdoc/json.js';
import { Breadcrumb } from './Breadcrumb.js';
import { CanvasNode } from './CanvasNode.js';
import type { DropEdge } from './CanvasNode.js';
import { ContextMenu } from './ContextMenu.js';
import type { ContextMenuState } from './ContextMenu.js';
import { useCanvas } from './context.js';
import type { BlockTemplate } from './context.js';
import { dropIndicatorCss, peCss, selectionCss, veCss } from './css.js';
import type { CanvasTheme } from './css.js';
import { Inspector } from './Inspector.js';
import { insertRelativeTo } from './insert.js';
import { setAttrs } from './props.js';
import { TreeRender } from './TreeRender.js';
import { DEFAULT_BLOCK_TEMPLATES } from './templates.js';

/** The persistence seam — the host injects load/save (audiostud routes them through puckClient). */
export interface PageEditorTransport {
    saveBody: (slug: string, body: JsonDoc) => Promise<unknown>;
    loadBody?: (slug: string) => Promise<{ body?: unknown } | unknown>;
}

/** Optional toast seam (host injects; the package never imports a toast lib). */
export interface Notify {
    success: (msg: string) => void;
    error: (msg: string) => void;
}

export interface PageEditorProps {
    slug: string;
    /** The initial body (a JsonDoc, or a legacy/absent body → falls back to `fallbackDoc` or empty). */
    body?: JsonDoc | null;
    transport: PageEditorTransport;
    notify?: Notify;
    theme?: Partial<CanvasTheme>;
    /** A per-slug default body when `body` is absent (host-supplied, e.g. `defaultTreeFor`). */
    fallbackDoc?: (slug: string) => JsonDoc | null;
    /** Brand label shown in the floating bar. */
    brand?: string;
    /**
     * Undo/redo — entirely host-injected (the package stays version-blind, ADR-0116 four-kind seam).
     * Buttons render only when supplied. See {@link VisualEditorProps} for the same seam in window mode.
     */
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
}

const EMPTY_DOC: JsonDoc = [
    { kind: 'block', name: 'div', isComponent: false, props: [], children: [], dynamic: false },
];

const isDoc = (b: unknown): b is JsonDoc =>
    Array.isArray(b) && b.every((n) => !!n && typeof n === 'object' && 'kind' in (n as object));

/** Track window (edit) mode off the host MainframeHost's `beam-ux:mode` broadcast. */
export function useEditMode(): boolean {
    const [editing, setEditing] = useState(false);
    useEffect(() => {
        const onMode = (e: Event) =>
            setEditing((e as CustomEvent<{ mode?: string }>).detail?.mode === 'window');
        window.addEventListener('beam-ux:mode', onMode);
        return () => window.removeEventListener('beam-ux:mode', onMode);
    }, []);
    return editing;
}

export function PageEditor({
    slug,
    body = null,
    transport,
    notify,
    theme,
    fallbackDoc,
    brand,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
}: PageEditorProps) {
    const config = useCanvas();
    const templates = config.blockTemplates ?? DEFAULT_BLOCK_TEMPLATES;
    const editing = useEditMode();
    const initial: JsonDoc = isDoc(body) ? body : fallbackDoc?.(slug) ?? EMPTY_DOC;
    const [doc, setDoc] = useState<JsonDoc>(initial);
    const [sel, setSel] = useState<string | null>(null);
    const [editText, setEditText] = useState<string | null>(null);
    const [dragPath, setDragPath] = useState<string | null>(null);
    const [dragTemplate, setDragTemplate] = useState<BlockTemplate | null>(null);
    const [dropTarget, setDropTarget] = useState<{ path: string; edge: DropEdge } | null>(null);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);
    const [leftOpen, setLeftOpen] = useState(true);
    // Closed by default (nothing to show); auto-opens on selection, and the Inspector button forces it open.
    const [rightOpen, setRightOpen] = useState(false);

    // Read mode: the plain page (correct chrome + styles), no editing overhead.
    if (!editing) {
        return <TreeRender tree={doc} />;
    }

    const selNode = sel ? getAt(doc, sel) : null;
    const selBlock: JsonBlock | null = selNode && isJsonBlock(selNode) ? selNode : null;

    const onCanvasClick = (e: React.MouseEvent) => {
        // Clicks inside the mdxeditor belong to it — don't hijack them for selection.
        if ((e.target as HTMLElement).closest('[data-mdx-edit]')) return;
        const el = (e.target as HTMLElement).closest('[data-bd-path]');
        const path = el ? el.getAttribute('data-bd-path') : null;
        // A click inside the node currently being text-edited places the caret — see VisualEditor's
        // onCanvasClick for why intercepting it here would both block that and exit edit mode instantly.
        if (editText && path === editText) return;
        e.preventDefault();
        setSel(path);
        setEditText(null);
        if (path) setRightOpen(true);
    };
    const onCanvasDbl = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('[data-mdx-edit]')) return;
        const p = (e.target as HTMLElement)
            .closest('[data-bd-path]')
            ?.getAttribute('data-bd-path');
        const node = p ? getAt(doc, p) : null;
        if (p && node && isJsonBlock(node) && isLeafText(node)) setEditText(p);
    };
    const onCanvasContextMenu = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('[data-mdx-edit]')) return;
        const p = (e.target as HTMLElement)
            .closest('[data-bd-path]')
            ?.getAttribute('data-bd-path');
        if (!p) return;
        e.preventDefault();
        setSel(p);
        setRightOpen(true);
        setMenu({ x: e.clientX, y: e.clientY, path: p });
    };
    const addBlock = (make: () => JsonBlock) => setDoc(insertRelativeTo(doc, sel, make));
    const save = async () => {
        try {
            await transport.saveBody(slug, doc);
            notify?.success('Saved');
        } catch {
            notify?.error('Save failed');
        }
    };
    const exit = () => window.dispatchEvent(new CustomEvent('beam-ux:exit'));
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
                    setDoc(insertInto(doc, parentOf(dropTarget.path), index, dragTemplate.make()));
                } else if (dragPath) {
                    const move = dropTarget.edge === 'before' ? moveBefore : moveAfter;
                    setDoc(move(doc, dragPath, dropTarget.path));
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
        <>
            <style dangerouslySetInnerHTML={{ __html: veCss(theme) + peCss(theme) }} />
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

            {/* The content region — IN PLACE (inside the page's layout), so classes + scoped CSS apply. */}
            <div
                className="pe-canvas"
                onClickCapture={onCanvasClick}
                onDoubleClick={onCanvasDbl}
                onContextMenu={onCanvasContextMenu}
            >
                {doc.map((n, i) => (
                    <CanvasNode
                        key={i}
                        node={n}
                        path={String(i)}
                        editing={editText}
                        onEditText={(p, text) => {
                            setDoc(
                                updateAt(doc, p, (el) => (isJsonBlock(el) ? setText(el, text) : el)),
                            );
                            setEditText(null);
                        }}
                        onEditMd={(p, md) =>
                            setDoc(
                                updateAt(doc, p, (el) =>
                                    isJsonBlock(el) ? setProp(el, 'md', md, 'string') : el,
                                ),
                            )
                        }
                        dnd={dnd}
                    />
                ))}
            </div>

            {/* Floating editor chrome — fixed over the page. */}
            <div className="pe-bar">
                <span className="pe-brand">
                    <span className="pe-mark" />
                    {brand ?? `editing · ${slug}`}
                </span>
                <span style={{ flex: 1 }} />
                {(onUndo || onRedo) && (
                    <>
                        <button className="pe-btn" onClick={onUndo} disabled={!canUndo} title="Undo">
                            ↶ Undo
                        </button>
                        <button className="pe-btn" onClick={onRedo} disabled={!canRedo} title="Redo">
                            ↷ Redo
                        </button>
                    </>
                )}
                <button className="pe-btn" onClick={() => setLeftOpen((v) => !v)}>
                    Insert
                </button>
                <button className="pe-btn" onClick={() => setRightOpen((v) => !v)}>
                    Inspector
                </button>
                <button className="pe-btn primary" onClick={save}>
                    Save
                </button>
                <button className="pe-btn" onClick={exit}>
                    Exit
                </button>
            </div>

            {leftOpen && (
                <aside className="pe-panel pe-left">
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

            {/* Closed by default; the Inspector button opens it (empty hint until you select something),
                and selecting an element auto-opens it with that element's properties. */}
            {rightOpen && (
                <aside className="pe-panel pe-right">
                    {sel && <Breadcrumb doc={doc} path={sel} onSelect={setSel} />}
                    {selBlock ? (
                        <Inspector
                            block={selBlock}
                            onAttrs={(attrs) =>
                                setDoc(
                                    updateAt(doc, sel!, (el) =>
                                        isJsonBlock(el) ? setAttrs(el, attrs) : el,
                                    ),
                                )
                            }
                            onDelete={() => {
                                if (sel && sel !== '0') {
                                    setDoc(removeAt(doc, sel));
                                    setSel(null);
                                }
                            }}
                        />
                    ) : (
                        <div className="ve-insp-empty">Click an element to edit it.</div>
                    )}
                </aside>
            )}

            {menu && (
                <ContextMenu
                    state={menu}
                    onClose={() => setMenu(null)}
                    actions={[
                        {
                            label: 'Duplicate',
                            onSelect: () => setDoc(duplicateAt(doc, menu.path)),
                        },
                        {
                            label: 'Delete',
                            danger: true,
                            onSelect: () => {
                                if (menu.path === '0') return;
                                setDoc(removeAt(doc, menu.path));
                                if (sel === menu.path) setSel(null);
                            },
                        },
                    ]}
                />
            )}
        </>
    );
}

export default PageEditor;
