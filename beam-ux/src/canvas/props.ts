// Prop mapping between a JsonBlock and React props — the runtime mirror of the host's `attrsToProps`,
// plus the `Record<string,string>` attribute view the Inspector edits (className/style stay named as on
// the host; everything else is a string-kind prop).
import {
    isJsonText,
    parseStyle,
    propValue,
    removeProp,
    setProp,
} from '../blockdoc/json.js';
import type { JsonBlock, JsonProp } from '../blockdoc/json.js';

/** Props whose editing lives OUTSIDE the "other attributes" list (className/style edited specially; md
 * is the MDX island body, edited in the canvas). Mirrors the host's `class`/`style`/`md` exclusion. */
export const RESERVED_ATTRS = new Set(['className', 'style', 'md']);

/**
 * Map a JsonBlock's props into React element props (mirror host `attrsToProps`):
 *   className prop → className; style prop (string) → parseStyle; other scalar props → their value;
 *   expression-kind props are skipped (they can't render on an intrinsic element).
 */
export function blockToProps(block: JsonBlock): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const p of block.props) {
        if (p.kind === 'expression') continue;
        if (p.name === 'className') out.className = String(p.value);
        else if (p.name === 'style' && p.kind === 'string') out.style = parseStyle(String(p.value));
        else out[p.name] = p.value;
    }
    return out;
}

/** Scalar props for an opaque-island component: a plain object of string/number/boolean prop values. */
export function islandProps(block: JsonBlock): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const p of block.props) {
        if (p.kind === 'expression') continue;
        out[p.name] = p.value;
    }
    return out;
}

/** The `Record<string,string>` attribute view the Inspector reads/writes (string-kind props only). */
export function attrsView(block: JsonBlock): Record<string, string> {
    const out: Record<string, string> = {};
    for (const p of block.props) {
        if (p.kind === 'string' || p.kind === 'number' || p.kind === 'boolean') {
            out[p.name] = String(p.value);
        }
    }
    return out;
}

/** Read a leaf block's text content (the concatenated text children). */
export const blockText = (block: JsonBlock): string =>
    block.children.filter(isJsonText).map((c) => c.value).join('');

/**
 * Apply an attribute patch (the Inspector's `Record<string,string|undefined>` shape) back onto a block as
 * string-kind prop set/remove ops. `undefined` removes the prop. Reads the current attr view to compute
 * the diff so removals of no-longer-present keys drop cleanly.
 */
export function applyAttrs(block: JsonBlock, patch: Record<string, string | undefined>): JsonBlock {
    let next = block;
    const current = attrsView(block);
    // Any string-kind attr present now but absent from the patch's *replacement intent* is left as-is;
    // the Inspector always passes the FULL next attr set, so we reconcile by set-union of keys.
    const keys = new Set([...Object.keys(current), ...Object.keys(patch)]);
    for (const k of keys) {
        const has = Object.prototype.hasOwnProperty.call(patch, k);
        const v = patch[k];
        if (has && v === undefined) {
            next = removeProp(next, k);
        } else if (has) {
            next = setProp(next, k, v as string, 'string');
        }
    }
    return next;
}

/**
 * Replace a block's full string-attr set from a `Record<string,string>` (the shape the host Inspector's
 * `onAttrs` emits). Non-string props (expression/etc.) are preserved; every string-kind prop is rebuilt
 * from `attrs`, so a key dropped from `attrs` is removed.
 */
export function setAttrs(block: JsonBlock, attrs: Record<string, string>): JsonBlock {
    // Keep non-string props (expression/number/boolean/shorthand) untouched.
    const kept: JsonProp[] = block.props.filter(
        (p) => p.kind !== 'string' && !(p.name in attrs),
    );
    const rebuilt: JsonProp[] = Object.entries(attrs).map(([name, value]) => ({
        name,
        kind: 'string' as const,
        value,
    }));
    return { ...block, props: [...kept, ...rebuilt] };
}

export { propValue };
