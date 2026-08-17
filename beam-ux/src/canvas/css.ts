// Theme-parametrized CSS for the canvas. The host's hardcoded audiostud colors become tokens on a
// CanvasTheme, so any host passes its own palette (audiostud passes Analog-Studio). The .beam-content-ref*
// + .mdxeditor-popup-container rules (the injected MDX island chrome) are preserved verbatim.

export interface CanvasTheme {
    /** Primary accent (selection outline, active toggles, save button). */
    accent: string;
    /** Accent hover (save button hover). */
    accentHover: string;
    /** Editable-text (contenteditable) outline. */
    editAccent: string;
    /** The canvas surface (the live page background). */
    canvas: string;
    /** Ink / body text on the canvas. */
    ink: string;
    /** Panel (bar / palette / inspector) background. */
    panelBg: string;
    /** Editor root backdrop (behind the panels, in window mode). */
    rootBg: string;
    /** Primary panel text. */
    panelFg: string;
    /** Muted panel text (hints, labels). */
    muted: string;
    /** Font family for body/panel chrome. */
    fontBody: string;
    /** Monospace family for labels + code. */
    fontMono: string;
}

export const DEFAULT_CANVAS_THEME: CanvasTheme = {
    accent: '#4F7CFF',
    accentHover: '#3A63E0',
    editAccent: '#22C7B8',
    canvas: '#FFFFFF',
    ink: '#1A1A1A',
    panelBg: '#1C1C1E',
    rootBg: '#131315',
    panelFg: '#E6E6E6',
    muted: '#8A8A8A',
    fontBody: "system-ui, sans-serif",
    fontMono: "ui-monospace, monospace",
};

const theme = (t?: Partial<CanvasTheme>): CanvasTheme => ({ ...DEFAULT_CANVAS_THEME, ...t });

/** Selection outline CSS for the currently selected path (shared by both mounts). */
export const selectionCss = (path: string, accent: string): string =>
    `[data-bd-path="${path}"]{outline:2px solid ${accent} !important;outline-offset:1px}`;

/**
 * Drop-target indicator CSS: a solid line on the hovered block's top (`before`) or bottom (`after`)
 * edge, showing exactly where a drag-reorder will land (shared by both mounts). `!important` beats the
 * hover dashed-outline rule so the indicator stays legible while dragging over an element.
 */
export const dropIndicatorCss = (path: string, edge: 'before' | 'after', accent: string): string =>
    `[data-bd-path="${path}"]{box-shadow:inset 0 ${edge === 'before' ? '3px' : '-3px'} 0 0 ${accent} !important;outline:none !important}`;

/** The window-mode composed editor CSS (host `VE_CSS`), theme-parametrized. */
export function veCss(t?: Partial<CanvasTheme>): string {
    const c = theme(t);
    return `
.ve-root{position:fixed;inset:0;z-index:2147483100;display:flex;flex-direction:column;background:${c.rootBg};font-family:${c.fontBody}}
.ve-bar{display:flex;align-items:center;gap:16px;height:40px;flex:none;padding:0 16px;background:${c.panelBg};color:${c.panelFg};border-bottom:1px solid rgba(255,255,255,.08);font-family:${c.fontMono};font-size:11px;letter-spacing:.06em}
.ve-brand{display:flex;align-items:center;gap:8px;color:#fff}
.ve-mark{width:15px;height:15px;border-radius:23%;background:${c.accent}}
.ve-hint{color:${c.muted}}
.ve-spacer{flex:1}
.ve-toggle{background:none;border:1px solid rgba(255,255,255,.14);border-radius:8px;color:${c.panelFg};cursor:pointer;font:inherit;font-size:11px;padding:5px 11px}
.ve-toggle:disabled{opacity:.35;cursor:not-allowed}
.ve-toggle.on{color:#fff;background:${c.accent}28;border-color:${c.accent}66}
.ve-toggle.ve-save{color:#fff;background:${c.accent};border-color:${c.accent}}
.ve-toggle.ve-save:hover{background:${c.accentHover}}
.ve-body{flex:1;min-height:0;display:flex}
.ve-palette{width:190px;flex:none;background:${c.panelBg};color:${c.panelFg};border-right:1px solid rgba(255,255,255,.08);padding:14px 12px;display:flex;flex-direction:column;gap:7px;overflow:auto}
.ve-pal-item{text-align:left;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:${c.panelFg};cursor:pointer;font:inherit;font-size:12px;padding:8px 11px}
.ve-pal-item:hover{color:#fff;background:${c.accent}24;border-color:${c.accent}66}
.ve-pal-note{margin-top:6px;color:${c.muted};font-size:10px;line-height:1.4}
.ve-canvas{flex:1;overflow:auto;background:${c.canvas};color:${c.ink}}
.ve-canvas [data-bd-path]:hover{outline:1.5px dashed ${c.accent}80;outline-offset:1px}
.ve-canvas [contenteditable="true"]{outline:2px solid ${c.editAccent} !important;cursor:text}
.ve-canvas .ve-island{position:relative}
.ve-canvas .ve-opaque{position:relative}
.ve-opaque-src{margin:0;padding:10px 12px;background:rgba(0,0,0,.05);border:1px dashed rgba(0,0,0,.18);border-radius:8px;font-family:${c.fontMono};font-size:11px;white-space:pre-wrap;color:${c.muted};overflow:auto}
.ve-mdx-block{position:relative}
.ve-mdx-handle{display:inline-flex;align-items:center;gap:6px;cursor:pointer;font:10px ${c.fontMono};letter-spacing:.1em;text-transform:uppercase;color:${c.muted};background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.14);border-radius:6px;padding:3px 9px;margin-bottom:8px;user-select:none}
.ve-mdx-handle:hover{color:${c.accent};border-color:${c.accent}80}
.beam-content-ref{border:1px solid rgba(0,0,0,.14);border-radius:10px;overflow:hidden;margin:12px 0;background:#fff}
.beam-content-ref-bar{display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(0,0,0,.04);border-bottom:1px solid rgba(0,0,0,.1)}
.beam-content-ref-tag{font:10px ${c.fontMono};letter-spacing:.1em;text-transform:uppercase;color:${c.muted}}
.beam-content-ref-pick{margin-left:auto;font:11px ${c.fontMono};color:${c.ink};background:${c.canvas};border:1px solid rgba(0,0,0,.16);border-radius:6px;padding:3px 6px;max-width:220px}
.beam-content-ref-body{padding:12px 14px;color:${c.ink}}
/* mdxeditor popups (link dialog, selects) must sit ABOVE the fixed editor panels. */
.mdxeditor-popup-container{z-index:2147483600 !important}
.ve-canvas .ve-island::before,.pe-canvas .ve-island::before{content:"◆ component";position:absolute;top:0;left:0;z-index:5;background:${c.panelBg};color:${c.muted};font:10px ${c.fontMono};letter-spacing:.1em;padding:2px 6px;border-radius:0 0 6px 0;opacity:0;pointer-events:none}
.ve-canvas .ve-island:hover::before,.pe-canvas .ve-island:hover::before{opacity:.9}
.ve-canvas .ve-gated::before,.pe-canvas .ve-gated::before{content:"sealed"}
.ve-canvas .ve-gated::after,.pe-canvas .ve-gated::after{content:"";position:absolute;inset:0;z-index:4;outline:1.5px dashed #E0A030;outline-offset:-1px;pointer-events:none}
.ve-crumbs{display:flex;flex-wrap:wrap;align-items:center;gap:2px;padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.08);font-family:${c.fontMono};font-size:11px}
.ve-crumb-seg{display:inline-flex;align-items:center;gap:2px}
.ve-crumb-sep{color:${c.muted};margin:0 2px}
.ve-crumb{background:none;border:none;color:${c.muted};cursor:pointer;font:inherit;padding:2px 4px;border-radius:4px}
.ve-crumb:hover:not(:disabled){color:#fff;background:rgba(255,255,255,.08)}
.ve-crumb:disabled{color:${c.panelFg};cursor:default}
.ve-menu{position:fixed;z-index:2147483500;background:${c.panelBg};border:1px solid rgba(255,255,255,.14);border-radius:8px;box-shadow:0 12px 32px -10px rgba(0,0,0,.6);padding:4px;min-width:150px;font-family:${c.fontMono};font-size:12px}
.ve-menu-item{display:block;width:100%;text-align:left;background:none;border:none;color:${c.panelFg};cursor:pointer;padding:7px 10px;border-radius:5px;font:inherit;white-space:nowrap}
.ve-menu-item:not(:disabled):hover{background:${c.accent}28;color:#fff}
.ve-menu-item.danger:not(:disabled):hover{background:#e0433033;color:#ff8a7a}
.ve-menu-item:disabled{opacity:.35;cursor:not-allowed}
.ve-insp-h{font-family:${c.fontMono};font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:${c.muted}}
.ve-src{margin-top:auto;border-top:1px solid rgba(255,255,255,.08);padding:12px 16px}
.ve-src pre{margin:6px 0 0;font-family:${c.fontMono};font-size:10px;line-height:1.5;color:${c.muted};white-space:pre-wrap;max-height:180px;overflow:auto}
${inspectorCss}
`;
}

/**
 * Shared Inspector-region CSS — the schema-driven Inspector (@schemastud/frame's own
 * `[data-frame-region="inspector"]`, rendering GroupedObjectFieldTemplate's stacked
 * sections/tabs) ships with no self-padding (frame is headless), so both mounts supply
 * it here. `.ve-chip`/`.ve-chip-in`/`.ve-kv`/`.ve-add` (the class-chips/style-rows
 * custom widget CSS, widgets.tsx) are sized to match the surrounding shadcn Input/Select
 * fields (~36px tall, 13px type) and themed off the standard shadcn CSS variables
 * (`--border`/`--foreground`/`--muted`/etc, bridged dark for the editor by the
 * consuming app's stud-tokens.css) rather than hardcoded rgba values, so they read as
 * ONE form, not a denser hand-rolled section bolted onto lighter shadcn fields.
 */
const inspectorCss = `
[data-frame-region="inspector"]{padding:16px}
[data-frame-region="inspector"][data-frame-inspector-empty]{padding:0}
.ve-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
.ve-chip{display:inline-flex;align-items:center;gap:6px;height:28px;background:var(--muted);border:1px solid var(--border);border-radius:6px;padding:0 4px 0 10px;font-size:13px;color:var(--foreground)}
.ve-chip button{background:none;border:none;color:var(--muted-foreground);cursor:pointer;font-size:15px;line-height:1;padding:0 4px}
.ve-chip button:hover{color:var(--foreground)}
.ve-chip-in{background:transparent;border:1px dashed var(--border);border-radius:6px;color:var(--foreground);font:inherit;font-size:13px;height:28px;padding:0 10px;width:104px}
.ve-chip-in:focus{outline:none;border-style:solid;border-color:var(--ring)}
.ve-kv{display:flex;gap:6px;align-items:center;margin-bottom:6px}
.ve-kv input{flex:1;min-width:0;height:36px;background:transparent;border:1px solid var(--border);border-radius:8px;color:var(--foreground);font-size:13px;padding:0 12px}
.ve-kv input:focus{outline:none;border-color:var(--ring)}
.ve-kv input[readonly]{color:var(--muted-foreground);background:var(--muted)}
.ve-kv button{background:none;border:none;color:var(--muted-foreground);cursor:pointer;font-size:15px;padding:0 6px}
.ve-kv button:hover{color:var(--foreground)}
.ve-add{align-self:flex-start;background:none;border:1px dashed var(--border);border-radius:8px;color:var(--muted-foreground);cursor:pointer;font:inherit;font-size:13px;height:32px;padding:0 12px}
.ve-add:hover{color:var(--foreground);border-color:var(--ring)}
`;

/** The in-place page-editor floating-panel CSS (host `PE_CSS`), theme-parametrized. */
export function peCss(t?: Partial<CanvasTheme>): string {
    const c = theme(t);
    return `
.pe-canvas{position:relative}
.pe-canvas [data-bd-path]:hover{outline:1.5px dashed ${c.accent}80;outline-offset:1px}
.pe-canvas [contenteditable="true"]{outline:2px solid ${c.editAccent} !important;cursor:text}
.pe-canvas .ve-island{position:relative}
.pe-bar{position:fixed;top:0;left:0;right:0;z-index:2147483200;display:flex;align-items:center;gap:8px;height:40px;padding:0 14px;background:${c.panelBg};color:${c.panelFg};border-bottom:1px solid rgba(255,255,255,.1);font-family:${c.fontMono};font-size:11px}
.pe-brand{display:flex;align-items:center;gap:8px;color:#fff}
.pe-mark{width:14px;height:14px;border-radius:23%;background:${c.accent}}
.pe-btn{background:none;border:1px solid rgba(255,255,255,.16);border-radius:8px;color:${c.panelFg};cursor:pointer;font:inherit;font-size:11px;padding:5px 12px}
.pe-btn:hover{color:#fff;border-color:${c.accent}80}
.pe-btn:disabled{opacity:.35;cursor:not-allowed}
.pe-btn.primary{background:${c.accent};border-color:${c.accent};color:#fff}
.pe-panel{position:fixed;top:48px;bottom:14px;width:300px;z-index:2147483200;background:${c.panelBg};border:1px solid rgba(255,255,255,.1);border-radius:12px;overflow:auto;box-shadow:0 24px 60px -18px rgba(0,0,0,.6)}
.pe-left{left:14px;width:200px;padding:14px 12px;display:flex;flex-direction:column;gap:7px}
.pe-right{right:14px}
${inspectorCss}
`;
}
