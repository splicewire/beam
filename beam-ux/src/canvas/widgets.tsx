// Custom RJSF widgets for @schemastud/seam's SchemaForm — the rich chip/row editing UX the old
// hand-rolled Inspector had for className/style, ported to the RJSF widget contract (`{value,
// onChange, schema, options, ...}`) so attrsSchema.ts's className/style properties (`x-widget:
// 'class-chips'|'style-rows'`) render the SAME interaction, just schema-driven now. Read
// classSuggestions/varSuggestions off CanvasConfig exactly as the old Inspector did — these widgets
// render inside the Inspector region, itself a descendant of the host's <CanvasProvider>.
import { useState } from 'react';
import { joinStyle, styleRows } from '../blockdoc/json.js';
import { useCanvas } from './context.js';
import { DEFAULT_CLASS_SUGGESTIONS, DEFAULT_VAR_SUGGESTIONS } from './templates.js';

/** The RJSF custom-widget contract (mirrors seam's own StarRatingWidget). */
interface RjsfWidgetProps {
    id?: string;
    value?: unknown;
    disabled?: boolean;
    readonly?: boolean;
    onChange: (value: unknown) => void;
}

export function ClassChipsWidget({ id, value, disabled, readonly, onChange }: RjsfWidgetProps) {
    const config = useCanvas();
    const suggestions = config.classSuggestions ?? DEFAULT_CLASS_SUGGESTIONS;
    const classes = String(value ?? '').split(/\s+/).filter(Boolean);
    const [draft, setDraft] = useState('');
    const locked = Boolean(disabled || readonly);

    return (
        <div id={id} className="ve-chips" data-widget="class-chips">
            {classes.map((c) => (
                <span key={c} className="ve-chip">
                    {c}
                    {!locked && (
                        <button
                            type="button"
                            onClick={() => onChange(classes.filter((x) => x !== c).join(' '))}
                        >
                            ×
                        </button>
                    )}
                </span>
            ))}
            {!locked && (
                <input
                    className="ve-chip-in"
                    list={`${id}-suggest`}
                    value={draft}
                    placeholder="+ class"
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && draft.trim()) {
                            e.preventDefault();
                            onChange([...classes, draft.trim()].join(' '));
                            setDraft('');
                        }
                    }}
                />
            )}
            <datalist id={`${id}-suggest`}>
                {suggestions.map((c) => (
                    <option key={c} value={c} />
                ))}
            </datalist>
        </div>
    );
}

export function StyleRowsWidget({ id, value, disabled, readonly, onChange }: RjsfWidgetProps) {
    const config = useCanvas();
    const suggestions = config.varSuggestions ?? DEFAULT_VAR_SUGGESTIONS;
    const rows = styleRows(String(value ?? ''));
    const locked = Boolean(disabled || readonly);

    return (
        <div id={id} data-widget="style-rows">
            {rows.map((r, i) => (
                <div className="ve-kv" key={i}>
                    <input
                        value={r.k}
                        disabled={locked}
                        onChange={(e) =>
                            onChange(joinStyle(rows.map((x, j) => (j === i ? { ...x, k: e.target.value } : x))))
                        }
                        placeholder="prop"
                    />
                    <input
                        list={`${id}-suggest`}
                        value={r.v}
                        disabled={locked}
                        onChange={(e) =>
                            onChange(joinStyle(rows.map((x, j) => (j === i ? { ...x, v: e.target.value } : x))))
                        }
                        placeholder="value / var(--…)"
                    />
                    {!locked && (
                        <button type="button" onClick={() => onChange(joinStyle(rows.filter((_, j) => j !== i)))}>
                            ×
                        </button>
                    )}
                </div>
            ))}
            <datalist id={`${id}-suggest`}>
                {suggestions.map((v) => (
                    <option key={v} value={v} />
                ))}
            </datalist>
            {!locked && (
                <button
                    type="button"
                    className="ve-add"
                    onClick={() => onChange(joinStyle([...rows, { k: 'color', v: 'var(--fg)' }]))}
                >
                    + declaration
                </button>
            )}
        </div>
    );
}
