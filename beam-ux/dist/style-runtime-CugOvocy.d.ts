import { B as BlockStyle } from './style-DwvipGPs.js';

type StyleRegistry = {
    breakpoints: Record<string, string>;
    states: Record<string, string>;
};
/** Called at render time by the compiled artifact, and by the canvas preview. */
declare function compileEntryStyles(styles: BlockStyle[], registry?: StyleRegistry): {
    classes: string[];
    css: string;
};

export { type StyleRegistry as S, compileEntryStyles as c };
