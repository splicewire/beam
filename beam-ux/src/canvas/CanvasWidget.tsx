import { blockStyleFields, applyBlockStyle } from './block-style.js';
import { useStyleSelection } from './StyleSelection';
import { DEFAULT_STYLE_REGISTRY, compileEntryStyles, stylesIn } from '../blockdoc/style-runtime';
import {useCanvasSelection} from './CanvasSelection';
import {CanvasOutline} from './CanvasOutline';
import {clipboardText,parseClipboard,pasteBlocks,wrapBlocks,unwrapBlock,removeBlocks,editStyles,assertPasteProfile} from './commands';
// The registered heavyweight widget (WIDGET_NAME in registry.ts) FiveRegionEditShell mounts
// full-surface in its canvas region. Everything about the block tree itself — text edit, drag-reorder,
// opaque islands, entitlement sealing, breadcrumb, context menu — is UNCHANGED, still CanvasNode/
// blockdoc all the way down; only SELECTION, node-attrs read/write, and insert candidates now route
// through the shared `editShellMount` instead of local component state, so the shell's Inspector/
// palette/save-pill drive (and are driven by) the same channel a plain `<VisualEditor>` used to own
// entirely by itself.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { EditShellMountValue } from '@schemastud/frame';
import {
    duplicateAt,
    getAt,
    indexOf,
    insertInto,
    isJsonBlock,
    moveAfter,
    moveBefore,
    parentOf,
    removeAt,
    setProp,
    updateAt,
} from '../blockdoc/json.js';
import type { ContextMenuAction } from './ContextMenu.js';
import type { JsonBlock, JsonDoc, JsonNode } from '../blockdoc/json.js';
import { attrsSchemaFor } from './attrsSchema.js';
import { Breadcrumb } from './Breadcrumb.js';
import { CanvasSiblings } from './CanvasSiblings.js';
import { proseRole } from './prose';
import type { DropEdge } from './CanvasNode.js';
import { ContextMenu } from './ContextMenu.js';
import type { ContextMenuState } from './ContextMenu.js';
import { useCanvasBindings } from './use-canvas-bindings';
import { CanvasBindingWarnings } from './CanvasBindingWarnings';
import { ComponentTools } from './ComponentTools';
import { CanvasRecordPicker } from './CanvasRecordPicker';
import { CanvasRuntimeProvider, useCanvas, isEditGated, isIsland } from './context.js';
import { DEFAULT_CANVAS_THEME, dropIndicatorCss, selectionCss } from './css.js';
import type { CanvasTheme } from './css.js';
import { setAttrs } from './props.js';
import { insertRelativeTo } from './insert.js';
import { freshBlockIds } from '../blockdoc/identity.js';
import { DEFAULT_BLOCK_TEMPLATES } from './templates.js';
import { profileAttrs, profileTemplates, profileTemplatesAtParent, setProfileAttrs } from './profile';

/** The `DataTransfer` key a palette drag stashes its template's `nodeType` under — the bridge for a
 * drag that starts in the shell's palette region (a REACT SIBLING of this widget, not an ancestor/
 * descendant) with no shared React state to use instead. See CanvasPalette.tsx (the drag source). */
export const TEMPLATE_DATA_KEY = 'application/x-beam-ux-template';
const EMPTY_DOC:JsonDoc=[];

export interface CanvasWidgetProps {
    /** WidgetSurface passes the record as BOTH `value` and `formData`; either is accepted. */
    value?: JsonDoc;
    formData?: JsonDoc;
    onChange?: (doc: JsonDoc) => void;
    editShellMount?: EditShellMountValue;
    readOnly?: boolean;
    /** The host's theme (same object VisualEditor/PageEditor thread into `veCss()`/`peCss()`) — drives
     * the selection/drop-indicator accent color. Defaults to `DEFAULT_CANVAS_THEME.accent` when absent. */
    theme?: Partial<CanvasTheme>;
    /** Suppress the built-in in-flow breadcrumb — for a host that renders {@see Breadcrumb} itself
     * elsewhere (PageEditor puts it in the floating Inspector panel; in-flow here would render behind
     * that same panel, since both sit at the top of the real page's content flow). Default false keeps
     * FiveRegionEditShell/VisualEditor's own docked-region layout, where in-flow is correct, unchanged. */
    hideBreadcrumb?: boolean;
}

/** The path of `path`'s sibling `delta` positions over (-1 previous, +1 next), or `null` past either
 * end. Root-level paths ("0", "1", …) have no dot; nested paths ("0.2") keep their parent prefix. */
function siblingPath(path: string, delta: number): string | null {
    const parent = parentOf(path);
    const idx = indexOf(path) + delta;
    if (idx < 0) return null;
    return parent === '' ? String(idx) : `${parent}.${idx}`;
}

/**
 * Do two prop lists say the same thing? Order-insensitive on NAME, because the shell's schema form
 * rebuilds the list from an object and JS object key order is not the authored order — comparing the
 * serialized lists directly would report a difference that does not exist.
 */
function samePropList(a: JsonBlock['props'], b: JsonBlock['props']): boolean {
    if (a.length !== b.length) return false;

    const key = (props: JsonBlock['props']) =>
        props
            .map((p) => JSON.stringify([p.name, p.kind, p.value]))
            .sort()
            .join('\u0000');

    return key(a) === key(b);
}

function countNodes(nodes: JsonNode[]): number {
    let n = 0;
    for (const node of nodes) {
        n += 1;
        if (isJsonBlock(node)) n += countNodes([...node.children, ...Object.values(node.slots ?? {}).flat()]);
    }
    return n;
}

export function CanvasWidget({
    value,
    formData,
    onChange,
    editShellMount: mount,
    readOnly = false,
    theme,
    hideBreadcrumb = false,
}: CanvasWidgetProps) {
    const config = useCanvas();
    const selection = useCanvasSelection();
    const [commandError,setCommandError] = useState<string|null>(null);
    const { selection: styleSelection } = useStyleSelection();
    const doc: JsonDoc = value ?? formData ?? EMPTY_DOC;
    const preview = useCanvasBindings(config.bindingPreview, doc);
    const runtime = config.bindingPreview ? {...config, bindings: preview.data?.bindings ?? config.bindings, record: preview.data?.record ?? undefined} : config;
    // ux-0233: without an MDX island (it retires per host, EP-42) the palette offers no new `Mdx` node.
    const allTemplates = useMemo(() => (config.blockTemplates ?? DEFAULT_BLOCK_TEMPLATES)
        .filter((template) => config.MdxEdit !== undefined || template.make().name !== 'Mdx'), [config.blockTemplates, config.MdxEdit]);
    // Was hardcoded to a fixed blue regardless of the host's actual theme — found live: it clashed
    // (near-invisible) against block content whose own background happened to be a similar hue.
    const accent = theme?.accent ?? DEFAULT_CANVAS_THEME.accent;

    const [editing, setEditing] = useState<string | null>(null);
    const firstClickPath = useRef<{ path: string | null } | null>(null);
    const [dragPath, setDragPath] = useState<string | null>(null);
    const [dropTarget, setDropTarget] = useState<{ path: string; edge: DropEdge } | null>(null);
    const [menu, setMenu] = useState<ContextMenuState | null>(null);

    const sel = mount?.selectedNodeId ?? null;
    const templates = useMemo(() => config.profile ? profileTemplates(allTemplates, config.profile, doc, sel) : allTemplates, [allTemplates, config.profile, doc, sel]);
    const setSel = (path: string | null, add = false) => {
        selection.setPaths(path ? (add ? selection.paths.includes(path) ? selection.paths.filter(p=>p!==path) : [...selection.paths,path] : [path]) : []);
        mount?.selectNode(path);
    };

    // Every doc mutation funnels through here, and a NO-OP must not reach the host or the dirty flag.
    // Measured 2026-09-11 (G2-BEAM-AUTHOR-EMPTY-ENTRY): "+ Heading" on the empty `/about` document
    // inserted nothing and still flipped the status bar to "Unsaved", so the editor reported pending
    // work that did not exist and a Save would have written the same document back. The tree ops here
    // are immutable and return the SAME object when they change nothing, so reference identity is the
    // exact, cheap test for "nothing happened" — see `insertRelativeTo`'s unresolvable-selection branch.
    const emit = (next: JsonDoc) => {
        if (readOnly || next === doc) return;
        onChange?.(next);
        mount?.markDirty(true);
    };

    // The LATEST document, for the handlers that outlive the render they were registered in.
    //
    // `registerNodeAccess` and `registerInsertHandler` hand the shell a closure and the shell keeps it
    // in a ref; a closure over this render's `doc` is therefore a SNAPSHOT that the shell may invoke
    // arbitrarily later, overwriting everything committed in between. Measured on beam.test 2026-09-11
    // (G2-BEAM-AUTHOR-FIRST-EDIT-LOST): the first inline text edit of a session reverted on click-away,
    // the second and third did not — because the first selection is also frame's Inspector's first
    // RJSF/ajv mount, which fires `onChange` once when normalization differs from the seed and is the
    // slowest one. That echo arrived AFTER the blur commit carrying a pre-commit snapshot, and the
    // typed text was gone. The handlers below read `docRef.current` instead.
    //
    // A ref and not a dependency: re-registering on every doc change (which the effects do anyway) does
    // not help — the shell can invoke a handler between the commit and the re-registration, which is
    // exactly the window that was measured.
    //
    // The other candidate fix — committing the contenteditable's text into the document on `input`
    // rather than on blur — is deliberately NOT taken. It re-renders the node being typed into on every
    // keystroke (caret risk), and it does not address the cause: the text was never the thing that got
    // lost, the COMMIT did, because a later writer rebuilt the tree from a document that predated it.
    const docRef = useRef(doc);
    docRef.current = doc;
    const readOnlyRef=useRef(readOnly);readOnlyRef.current=readOnly;
    const alive=useRef(true);
    useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);

    const emitFromRef = (next: JsonDoc) => {
        if (readOnly || next === docRef.current) return;
        onChange?.(next);
        mount?.markDirty(true);
    };

    // One commit for a batch edit: the host's Local Session supplies its single undo step.
    useEffect(()=>{
        selection.register({doc,readOnly,editBinding:(path,change)=>{
            if(readOnlyRef.current)return;
            const node=getAt(docRef.current,path);
            if(!node||!isJsonBlock(node)||isEditGated(config,node))return;
            const next=change(node);
            if(next!==node)emitFromRef(updateAt(docRef.current,path,()=>next));
        },editStyle:(paths,layer,property,value)=>{
            if(readOnly)return;
            emitFromRef(editStyles(docRef.current,paths,layer,property,value,config.styleRegistry??DEFAULT_STYLE_REGISTRY));
        }});
        return ()=>selection.register(null);
    },[doc,readOnly,config.styleRegistry,config.can,selection.register]);
    useEffect(()=>{
        if(sel&&!selection.paths.includes(sel))selection.setPaths([sel]);
        if(!sel&&selection.paths.length)selection.setPaths([]);
    },[sel]);

    const command=(run:()=>JsonDoc)=>{
        if(readOnlyRef.current)return;
        try{emitFromRef(run());setSel(null);setCommandError(null);}
        catch(error){setCommandError(error instanceof Error?error.message:String(error));}
    };
    const copy=async(cut=false)=>{
        if(cut&&readOnly)return;
        try{
            if(!navigator.clipboard?.writeText)throw Error('Clipboard is unavailable in this browser');
            const snapshot=docRef.current,paths=[...selection.paths];
            await navigator.clipboard.writeText(clipboardText(snapshot,paths));
            if(!alive.current)return;
            if(cut){
                if(readOnlyRef.current)throw Error('Editor became read-only; copied blocks were not cut');
                // A slow clipboard prompt must never delete paths from a newer document.
                if(docRef.current!==snapshot)throw Error('Document changed while copying; copied blocks were not cut');
                command(()=>removeBlocks(docRef.current,paths));
            }
            setCommandError(null);
        }catch(error){setCommandError(error instanceof Error?error.message:String(error));}
    };
    const paste=async()=>{
        if(readOnly)return;
        try{
            if(!navigator.clipboard?.readText)throw Error('Clipboard is unavailable in this browser');
            const snapshot=docRef.current,target=sel??'';
            const nodes=parseClipboard(await navigator.clipboard.readText());
            if(!alive.current)return;
            if(readOnlyRef.current)throw Error('Editor is read-only');
            if(docRef.current!==snapshot)throw Error('Document changed while reading clipboard; choose the destination again');
            const parent=target?getAt(docRef.current,target):null;
            if(parent&&isJsonBlock(parent)&&(isEditGated(config,parent)||isIsland(config,parent.name)))throw Error('Paste into an editable container');
            command(()=>pasteBlocks(docRef.current,target,nodes,config.profile,config.styleRegistry));
        }catch(error){setCommandError(error instanceof Error?error.message:String(error));}
    };

    // Node access: the shell's generic Inspector calls getNode(selectedNodeId)/setNodeAttrs(...) —
    // re-registered whenever the doc or the entitlement-key pool changes so these closures are never
    // stale (a registration overwrites the mount's single NodeAccess slot; see EditShellMount).
    useEffect(() => {
        if (!mount) return;
        return mount.registerNodeAccess({
            getNode: (nodeId) => {
                const node = getAt(docRef.current, nodeId);
                if (!node || !isJsonBlock(node)) return null;
                const { schema, attrs } = blockStyleFields(node, config.profile ? profileAttrs(node, config.profile) : attrsSchemaFor(node, config.entitlementKeys ?? []), config.styleRegistry);
                return { type: node.name ?? 'fragment', attrsSchema: schema, attrs };
            },
            setNodeAttrs: (nodeId, attrs) => {
                const node = getAt(docRef.current, nodeId);
                if (!node || !isJsonBlock(node)) return;

                const { bdStyle, ...props } = attrs;
                const changed = config.profile ? setProfileAttrs(node, props, config.profile) : setAttrs(node, props as Record<string, string>);
                const next = bdStyle === undefined ? changed : applyBlockStyle(changed, bdStyle);

                // The no-op guard, and the reason the race above had anything to race WITH. RJSF fires
                // `onChange` on first mount whenever ajv's normalization differs from the seed, handing
                // back the attrs it was given. That echo is not an edit: it must not reach the document,
                // the host, or the dirty flag. `updateAt` always rebuilds, so identity cannot answer
                // this — the props themselves are what changed or did not.
                if (samePropList(node.props, next.props) && JSON.stringify(node.style ?? { layers: [] }) === JSON.stringify(next.style ?? { layers: [] })) return;

                emitFromRef(updateAt(docRef.current, nodeId, () => next));
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
    }, [doc, config.entitlementKeys, config.profile]);

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
            if (template) emitFromRef(insertRelativeTo(docRef.current, sel, template.make));
        });
        // `mount` omitted — see the previous effect's comment (this is one of the two that WOULD
        // infinite-loop if it depended on `mount`: publishCandidates changes mount's identity, which
        // would re-trigger this effect, which publishes again).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [doc, sel, templates]);

    // Conformance: an honest PARTIAL readout for the status bar — a real node count, but no
    // required-slot/grammar concept exists for a JsonDoc today, so those report as trivially
    // satisfied (0 of 0, valid) rather than fabricated.
    // mount.flush() is what every write drains first (Save draft, Publish), but the canvas commits an inline text edit
    // on BLUR, so an edit still in a focused editor reached no write. Blur the active inline editor inside this canvas on
    // flush, which commits it through the ordinary blur path (build.qa on 05d10b9: a press that did not blur first).
    useEffect(() => {
        if (!mount) return;
        return mount.registerFlush(async () => {
            const active = document.activeElement as HTMLElement | null;
            const editing = active?.isContentEditable || active?.getAttribute('contenteditable') === 'true';
            if (active && editing && active.closest('[data-bd-path]')) active.blur();
        });
    }, [mount]);

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
        if ((e.target as HTMLElement).closest('[data-prose-edit]')) return;
        const el = (e.target as HTMLElement).closest('[data-bd-path]');
        const path = el ? el.getAttribute('data-bd-path') : null;
        // Selection can open the Inspector and move the node before click two.
        // Keep the first click's target for this double-click sequence.
        if (e.detail === 1) firstClickPath.current = { path };
        // A click inside the node currently being text-edited places the caret — let the browser
        // handle it natively (see CanvasNode's own docs for why intercepting it here breaks typing).
        if (editing && path === editing) return;
        e.preventDefault();
        setSel(path,e.ctrlKey||e.metaKey||e.shiftKey);
        setEditing(null);
    };
    const onCanvasDbl = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('[data-prose-edit]')) return;
        const p = firstClickPath.current
            ? firstClickPath.current.path
            : (e.target as HTMLElement).closest('[data-bd-path]')?.getAttribute('data-bd-path');
        firstClickPath.current = null;
        const node = p ? getAt(doc, p) : null;
        if (!readOnly && p && node && isJsonBlock(node) && config.profile && proseRole(node.name, config.profile)) setEditing(p);
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
                const offered = config.profile ? profileTemplatesAtParent(allTemplates, config.profile, doc, parentOf(dropTarget.path)) : allTemplates;
                const template = offered.find((t) => t.label === templateNodeType);
                if (template) {
                    const index = indexOf(dropTarget.path) + (dropTarget.edge === 'after' ? 1 : 0);
                    emit(insertInto(doc, parentOf(dropTarget.path), index, freshBlockIds(template.make())));
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
            { label: 'Duplicate', onSelect: () => command(()=>{
                const node=getAt(docRef.current,path),parent=parentOf(path)?getAt(docRef.current,parentOf(path)):null;
                if(!node)throw Error('Selection no longer exists');
                assertPasteProfile([node],config.profile,parent as JsonBlock|null,config.styleRegistry);
                return duplicateAt(docRef.current,path);
            }) },
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
                children: (config.profile ? profileTemplates(allTemplates, config.profile, doc, path) : allTemplates).map((t) => ({
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
        <CanvasRuntimeProvider config={runtime}><div className="ve-canvas-widget" onDoubleClick={onCanvasDbl} onClickCapture={event=>{
            if (event.detail === 1 && !(event.target as HTMLElement).closest('.ve-canvas')) firstClickPath.current = null;
        }} onKeyDown={event=>{
            if(!(event.ctrlKey||event.metaKey)||(event.target as HTMLElement).closest('input,textarea,[contenteditable="true"]'))return;
            const key=event.key.toLowerCase();
            if(['c','x','v'].includes(key)){event.preventDefault();if(key==='v')void paste();else void copy(key==='x');}
        }} style={{containerType:'inline-size',containerName:'beam-canvas',width: styleSelection.breakpoint ? (config.styleRegistry ?? DEFAULT_STYLE_REGISTRY).breakpoints[styleSelection.breakpoint] : undefined, maxWidth: '100%'}}>
            {/* The canvas previews Block Styles against its own width and the inspector's state, not the
                author's viewport: breakpoints answer to this `beam-canvas` container, the selected state applies
                as if active. Same class names as the published artifact, which keeps @media and real states. */}
            <style data-beam-block-style="" data-beam-canvas-preview="">{compileEntryStyles(stylesIn(doc), config.styleRegistry, {container: 'beam-canvas', state: styleSelection.state}).css}</style>
            <div className="ve-command-bar" role="toolbar" aria-label="Block commands">
                <button className="ve-command-button" type="button" disabled={!selection.paths.length} onClick={()=>void copy()}>Copy blocks</button>
                <button className="ve-command-button" type="button" disabled={readOnly||!selection.paths.length} onClick={()=>void copy(true)}>Cut blocks</button>
                <button className="ve-command-button" type="button" disabled={readOnly} onClick={()=>void paste()}>Paste into {sel??'document'}</button>
                <button className="ve-command-button" type="button" disabled={readOnly||!selection.paths.length} onClick={()=>command(()=>wrapBlocks(docRef.current,selection.paths,'flex',config.profile))}>Wrap in flex</button>
                <button className="ve-command-button" type="button" disabled={readOnly||!selection.paths.length} onClick={()=>command(()=>wrapBlocks(docRef.current,selection.paths,'grid',config.profile))}>Wrap in grid</button>
                <button className="ve-command-button" type="button" disabled={readOnly||selection.paths.length!==1} onClick={()=>command(()=>unwrapBlock(docRef.current,selection.paths[0],config.profile))}>Unwrap</button>
                <span>{selection.paths.length} blocks selected</span>
            </div>
            <ComponentTools doc={doc} paths={selection.paths} readOnly={readOnly} onChange={(next,expected)=>{
                if(readOnlyRef.current||docRef.current!==expected)throw Error('The Local Session changed while the component operation was running.');
                emitFromRef(next);setSel(null);
            }}/>
            {config.bindingPreview && <CanvasRecordPicker preview={preview}/> }
            <CanvasBindingWarnings doc={doc} profile={config.profile} pagePublic={preview.data?.pagePublic ?? config.bindingPreview?.pagePublic} recordCollection={config.bindingPreview?.recordCollection}/>
            {commandError&&<p role="alert">{commandError}</p>}
            <div className="ve-canvas-layout">
            <CanvasOutline doc={doc} onSelect={setSel} onHide={(path,hidden)=>command(()=>editStyles(docRef.current,[path],{breakpoint:styleSelection.breakpoint,state:null},'display',hidden?'none':null,config.styleRegistry??DEFAULT_STYLE_REGISTRY))}/>
            <div style={{minWidth:0}}>
            {selection.paths.filter(path=>path!==sel).map(path=>{
                const node=getAt(doc,path);
                return <style key={path} dangerouslySetInnerHTML={{__html:selectionCss(path,accent,!!node&&isJsonBlock(node)&&node.isComponent)}}/>;
            })}
            {sel &&
                (() => {
                    const selNode = getAt(doc, sel);
                    const selIsComponent = !!selNode && isJsonBlock(selNode) && selNode.isComponent;

                    return (
                        <style dangerouslySetInnerHTML={{ __html: selectionCss(sel, accent, selIsComponent) }} />
                    );
                })()}
            {dropTarget && (
                <style
                    dangerouslySetInnerHTML={{
                        __html: dropIndicatorCss(dropTarget.path, dropTarget.edge, accent),
                    }}
                />
            )}

            {!hideBreadcrumb && sel && <Breadcrumb doc={doc} path={sel} onSelect={setSel} />}

            <div
                className="ve-canvas"
                onClickCapture={onCanvasClick}
                onContextMenu={onCanvasContextMenu}
            >
                <CanvasSiblings nodes={doc} parent="" editing={editing}
                    onEditProse={(parent,start,end,body)=>{
                        const replace=(children:JsonDoc)=>[...children.slice(0,start),...body,...children.slice(end)];
                        emit(parent ? updateAt(doc,parent,node=>isJsonBlock(node)?{...node,children:replace(node.children)}:node) : replace(doc));
                    }}
                    onEditMd={(p, md)=>emit(updateAt(doc,p,node=>isJsonBlock(node)?setProp(node,'md',md,'string'):node))}
                    dnd={dnd}/>

            </div>

            {menu && (
                <ContextMenu
                    state={menu}
                    onClose={() => setMenu(null)}
                    actions={contextMenuActions(menu.path)}
                />
            )}
            </div></div>
        </div></CanvasRuntimeProvider>
    );
}
