// The OS-styled inspector: class chips · style rows (CSS + vars) · arbitrary attributes. Port of the host
// `Inspector`, re-based on a JsonBlock (its string-kind props are the attribute view). It keeps the host's
// `onAttrs(Record<string,string>)` contract — the mount translates that back onto the block via
// `setAttrs`. `className`/`style`/`md` are handled specially / excluded, mirroring the host.
import { useState } from 'react';
import { joinStyle, styleRows } from '../blockdoc/json.js';
import type { JsonBlock } from '../blockdoc/json.js';
import { useCanvas } from './context.js';
import { attrsView, EDIT_GATE_ATTR, RESERVED_ATTRS, VIEW_GATE_ATTR } from './props.js';
import { DEFAULT_CLASS_SUGGESTIONS, DEFAULT_VAR_SUGGESTIONS } from './templates.js';

export interface InspectorProps {
    block: JsonBlock;
    /** Emits the FULL next string-attr set (host `onAttrs` contract). */
    onAttrs: (attrs: Record<string, string>) => void;
    onDelete: () => void;
}

export function Inspector({ block, onAttrs, onDelete }: InspectorProps) {
    const config = useCanvas();
    const classSuggestions = config.classSuggestions ?? DEFAULT_CLASS_SUGGESTIONS;
    const varSuggestions = config.varSuggestions ?? DEFAULT_VAR_SUGGESTIONS;

    const view = attrsView(block);
    const classes = (view.className ?? '').split(/\s+/).filter(Boolean);
    const rows = styleRows(view.style ?? '');
    // `md` is the MDX node's inline-edited body (edited in the canvas) — keep it out of the attrs list,
    // alongside className/style (which have their own sections).
    const otherAttrs = Object.entries(view).filter(([k]) => !RESERVED_ATTRS.has(k));
    const [newClass, setNewClass] = useState('');
    const tag = block.name ?? 'fragment';

    const set = (patch: Record<string, string | undefined>) => {
        const next = { ...view };
        for (const [k, v] of Object.entries(patch)) {
            if (v === undefined) delete next[k];
            else next[k] = v;
        }
        onAttrs(next);
    };

    return (
        <div className="ve-insp">
            <div className="ve-insp-top">
                <span className="ve-insp-tag">{tag}</span>
                <button className="ve-insp-del" onClick={onDelete} title="Delete element">
                    Delete
                </button>
            </div>

            <div className="ve-insp-sec">
                <div className="ve-insp-h">Classes</div>
                <div className="ve-chips">
                    {classes.map((c) => (
                        <span key={c} className="ve-chip">
                            {c}
                            <button
                                onClick={() =>
                                    set({ className: classes.filter((x) => x !== c).join(' ') })
                                }
                            >
                                ×
                            </button>
                        </span>
                    ))}
                    <input
                        className="ve-chip-in"
                        list="ve-class-suggest"
                        value={newClass}
                        placeholder="+ class"
                        onChange={(e) => setNewClass(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && newClass.trim()) {
                                set({ className: [...classes, newClass.trim()].join(' ') });
                                setNewClass('');
                            }
                        }}
                    />
                    <datalist id="ve-class-suggest">
                        {classSuggestions.map((c) => (
                            <option key={c} value={c} />
                        ))}
                    </datalist>
                </div>
            </div>

            <div className="ve-insp-sec">
                <div className="ve-insp-h">Style · CSS + vars</div>
                {rows.map((r, i) => (
                    <div className="ve-kv" key={i}>
                        <input
                            value={r.k}
                            onChange={(e) =>
                                set({
                                    style: joinStyle(
                                        rows.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)),
                                    ),
                                })
                            }
                            placeholder="prop"
                        />
                        <input
                            list="ve-var-suggest"
                            value={r.v}
                            onChange={(e) =>
                                set({
                                    style: joinStyle(
                                        rows.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)),
                                    ),
                                })
                            }
                            placeholder="value / var(--…)"
                        />
                        <button
                            onClick={() => set({ style: joinStyle(rows.filter((_, j) => j !== i)) })}
                        >
                            ×
                        </button>
                    </div>
                ))}
                <datalist id="ve-var-suggest">
                    {varSuggestions.map((v) => (
                        <option key={v} value={v} />
                    ))}
                </datalist>
                <button
                    className="ve-add"
                    onClick={() =>
                        set({ style: joinStyle([...rows, { k: 'color', v: 'var(--fg)' }]) })
                    }
                >
                    + declaration
                </button>
            </div>

            <div className="ve-insp-sec">
                <div className="ve-insp-h">Access</div>
                <div className="ve-kv">
                    <input value={view[VIEW_GATE_ATTR] ?? ''} placeholder="view gate (entitlement key)" onChange={(e) => set({ [VIEW_GATE_ATTR]: e.target.value || undefined })} />
                    {view[VIEW_GATE_ATTR] && (
                        <button onClick={() => set({ [VIEW_GATE_ATTR]: undefined })}>×</button>
                    )}
                </div>
                <div className="ve-kv">
                    <input value={view[EDIT_GATE_ATTR] ?? ''} placeholder="edit gate (entitlement key)" onChange={(e) => set({ [EDIT_GATE_ATTR]: e.target.value || undefined })} />
                    {view[EDIT_GATE_ATTR] && (
                        <button onClick={() => set({ [EDIT_GATE_ATTR]: undefined })}>×</button>
                    )}
                </div>
                <div className="ve-pal-note">
                    View gate hides this element (and everything inside it) from a viewer lacking the key —
                    enforced server-side. Edit gate leaves it visible but seals it from an author lacking
                    the key, here in the canvas.
                </div>
            </div>

            <div className="ve-insp-sec">
                <div className="ve-insp-h">Attributes</div>
                {otherAttrs.map(([k, v]) => (
                    <div className="ve-kv" key={k}>
                        <input value={k} readOnly />
                        <input value={v} onChange={(e) => set({ [k]: e.target.value })} />
                        <button onClick={() => set({ [k]: undefined })}>×</button>
                    </div>
                ))}
                <AddAttr onAdd={(k, v) => set({ [k]: v })} />
            </div>
        </div>
    );
}

function AddAttr({ onAdd }: { onAdd: (k: string, v: string) => void }) {
    const [k, setK] = useState('');
    return (
        <div className="ve-kv">
            <input
                value={k}
                placeholder="data-* / id / aria-*"
                onChange={(e) => setK(e.target.value)}
            />
            <button
                className="ve-add"
                onClick={() => {
                    if (k.trim()) {
                        onAdd(k.trim(), '');
                        setK('');
                    }
                }}
            >
                + attribute
            </button>
        </div>
    );
}
