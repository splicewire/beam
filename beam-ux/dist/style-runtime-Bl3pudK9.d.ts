import { B as BlockStyle } from './style-DwvipGPs.js';

type StyleRegistry = {
    breakpoints: Record<string, string>;
    states: Record<string, string>;
};
/**
 * How the editor canvas previews a Block Style. The published artifact answers breakpoints with `@media`
 * (the visitor's viewport) and states with their pseudo-selector; the canvas has its own width and no real
 * pointer, so it asks for breakpoints against a named container and for one state applied as if active.
 * The class name is unchanged, so the canvas styles the same nodes the artifact does.
 */
type StylePreview = {
    container: string;
    state: string | null;
};
/** Called at render time by the compiled artifact, and by the canvas preview. */
declare function compileEntryStyles(styles: BlockStyle[], registry?: StyleRegistry, preview?: StylePreview): {
    classes: string[];
    css: string;
};

export { type StyleRegistry as S, compileEntryStyles as c };
