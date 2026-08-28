/**
 * The operator desk's chrome CSS, as a **string**.
 *
 * ## Why a string and not a `.css` file
 *
 * Same reasoning `PROSE_CSS` and `DOCS_TEMPLATE_CSS` already settled for this package, and it bites
 * twice here rather than once. A host's Tailwind scans the HOST's sources, not
 * `node_modules/@splicewire/beam-ux/dist`, so a utility class shipped inside a package bundle is a
 * name with no rule behind it. And this package declares `"sideEffects": false`, which entitles a
 * bundler to DELETE a bare `import './desk.css'` as dead code. Either failure renders the dock
 * unstyled behind an HTTP 200 — correct markup, no visual, nothing red anywhere in CI.
 *
 * So the desk injects this string through a `<style>` element it renders itself. That is a value the
 * bundler can see being used, and it needs no host build configuration at all.
 *
 * ## Every colour and font is a token with a literal fallback
 *
 * The three host copies this was lifted from differed in exactly one axis besides their tool roster:
 * their palette. Two rode `var(--beam-*, …)`; one hardcoded a warm brand. Neither is the package's
 * business, so the package names an `--op-*` token for each role and supplies the beam reading as the
 * fallback:
 *
 * | token                  | role                                            |
 * |------------------------|-------------------------------------------------|
 * | `--op-surface`         | window paper (the tool body's own background)    |
 * | `--op-surface-raised`  | title bar / taskbar / menu — the chrome ground   |
 * | `--op-fg`              | chrome text                                     |
 * | `--op-fg-muted`        | chrome text, de-emphasised                      |
 * | `--op-accent`          | the one attention colour (orb open state)       |
 * | `--op-edge`            | the raised-on-raised divider ground             |
 * | `--op-font`            | the overlay's UI font                           |
 * | `--op-font-mono`       | the chrome's monospace face (titles, taskbar)   |
 *
 * The fallback chain is `var(--op-x, var(--beam-x, <literal>))` on purpose. A beam host that defines
 * only `--beam-*` renders BYTE-IDENTICALLY to what it rendered before the lift; a non-beam host that
 * defines neither gets the literal; and a host that wants to re-theme only the dock sets `--op-*` on
 * any ancestor and wins over both. Nothing here needs a host to define anything.
 *
 * The desk's OWN class names (`.op-*`) are shared with `@schemastud/mainframe/os`'s `OperatorOverlay`,
 * which emits the markup — this string is the skin for chrome that package draws.
 */
export const OPERATOR_DESK_CSS = `
.op-desk-overlay{position:fixed;inset:0;z-index:2000;pointer-events:none;font-family:var(--op-font, system-ui, sans-serif)}
.op-desk-overlay > *{pointer-events:auto}
.op-win-inner{display:flex;flex-direction:column;height:100%;background:var(--op-surface, #f8fafc);border:1px solid rgba(15,23,42,.14);border-radius:12px;box-shadow:0 30px 90px -24px rgba(0,0,0,.5);overflow:hidden}
.op-win-bar{display:flex;align-items:center;gap:9px;height:38px;flex:none;padding:0 12px;background:var(--op-surface-raised, var(--beam-paper-raised, #0e1b18));color:var(--op-fg, var(--beam-ink, #dcede8));cursor:move;user-select:none}
.op-win-dot{width:10px;height:10px;border-radius:30%;flex:none}
.op-win-title{font-family:var(--op-font-mono, ui-monospace, monospace);font-size:11px;letter-spacing:.12em;text-transform:uppercase}
.op-win-ctrls{margin-left:auto;display:flex;align-items:center;gap:1px}
.op-win-x{background:none;border:none;color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)));font-size:16px;line-height:1;cursor:pointer;padding:4px 8px;border-radius:6px;display:flex;align-items:center;justify-content:center;min-width:28px}
.op-win-x:hover{color:var(--op-fg, var(--beam-ink, #dcede8));background:rgba(255,255,255,.1)}
.op-win-x.on{color:var(--op-surface-raised, var(--beam-paper-raised, #0e1b18))}
.op-win-body{flex:1;min-height:0;overflow:auto;background:var(--op-surface, #f8fafc);color:#0f172a}
.op-taskbar{position:absolute;left:16px;bottom:16px;display:flex;align-items:center;gap:4px;padding:6px;border-radius:13px;border:1px solid rgba(255,255,255,.1);background:color-mix(in srgb, var(--op-surface-raised, var(--beam-paper-raised, #0e1b18)) 94%, transparent);backdrop-filter:blur(14px);box-shadow:0 18px 55px -14px rgba(0,0,0,.6)}
.op-taskbar button{display:flex;align-items:center;gap:7px;border:none;background:none;color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)));cursor:pointer;font-family:var(--op-font-mono, ui-monospace, monospace);font-size:11px;letter-spacing:.06em;padding:8px 12px;border-radius:9px}
.op-taskbar button:hover{color:var(--op-fg, var(--beam-ink, #dcede8));background:rgba(255,255,255,.08)}
.op-taskbar button.focused{color:var(--op-fg, var(--beam-ink, #dcede8));background:rgba(255,255,255,.12)}
.op-taskbar button.minned{opacity:.55}
.op-taskbar .glyph{width:9px;height:9px;border-radius:30%;flex:none}
.op-orb{position:absolute;right:16px;bottom:16px;display:flex;align-items:center;gap:9px;padding:9px 15px;border-radius:13px;border:1px solid rgba(255,255,255,.1);background:color-mix(in srgb, var(--op-surface-raised, var(--beam-paper-raised, #0e1b18)) 94%, transparent);backdrop-filter:blur(14px);color:var(--op-fg, var(--beam-ink, #dcede8));cursor:pointer;font-family:var(--op-font-mono, ui-monospace, monospace);font-size:11px;letter-spacing:.14em;text-transform:uppercase;box-shadow:0 18px 55px -14px rgba(0,0,0,.6)}
.op-orb:hover{border-color:var(--op-edge, var(--beam-line, #1b2e2a))}
.op-orb.is-open{border-color:var(--op-accent, var(--beam-accent, #00b3c8));background:var(--op-edge, var(--beam-line, #1b2e2a))}
.op-orb .mark{width:16px;height:16px;flex:none;color:var(--op-fg, var(--beam-ink, #dcede8))}
.op-scrim{position:absolute;inset:0;background:transparent}
.op-menu{position:absolute;right:16px;bottom:66px;width:240px;padding:7px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:color-mix(in srgb, var(--op-surface-raised, var(--beam-paper-raised, #0e1b18)) 97%, transparent);backdrop-filter:blur(16px);box-shadow:0 26px 70px -18px rgba(0,0,0,.65);display:flex;flex-direction:column;gap:2px}
.op-menu-brand{display:flex;align-items:center;gap:8px;padding:9px 10px 11px;margin-bottom:3px;border-bottom:1px solid rgba(255,255,255,.08);color:var(--op-fg, var(--beam-ink, #dcede8));font-family:var(--op-font-mono, ui-monospace, monospace);font-size:13px;font-weight:600;letter-spacing:.02em}
.op-menu-brand-mark{width:18px;height:18px;flex:none;color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)))}
.op-menu .head{padding:8px 10px 6px;color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)));font-family:var(--op-font-mono, ui-monospace, monospace);font-size:9px;letter-spacing:.18em;text-transform:uppercase}
.op-menu button,.op-menu a{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:9px 11px;border-radius:9px;border:none;background:none;color:var(--op-fg, var(--beam-ink, #dcede8));cursor:pointer;font:inherit;font-size:13px;text-decoration:none}
.op-menu button:hover,.op-menu a:hover{background:rgba(255,255,255,.07);color:var(--op-fg, var(--beam-ink, #dcede8))}
.op-menu button:disabled{opacity:.4;cursor:default}
.op-menu button:disabled:hover{background:none;color:var(--op-fg, var(--beam-ink, #dcede8))}
.op-menu button.active{color:var(--op-fg, var(--beam-ink, #dcede8));background:var(--op-edge, var(--beam-line, #1b2e2a))}
.op-menu .glyph{width:10px;height:10px;border-radius:30%;flex:none}
.op-menu .ico{width:16px;text-align:center;flex:none;opacity:.85}
.op-menu .op-div{height:1px;background:rgba(255,255,255,.1);margin:5px 4px}
.op-menu .muted{color:var(--op-fg-muted, var(--beam-ink-muted, rgba(220, 237, 232, .5)))}
`;

/**
 * The `taskbarPlacement: 'center'` variant, appended AFTER the base rule.
 *
 * The taskbar element is drawn by `OperatorOverlay` in `@schemastud/mainframe/os`, which exposes no
 * `className` or `style` seam on it — so the anchor cannot be set from the markup side. An override
 * rule of equal specificity, emitted later in the same `<style>`, is the whole mechanism: last one
 * wins, no `!important`, and a host that redefines `.op-taskbar` itself still beats both.
 *
 * `left` is reset explicitly rather than left to `auto`, because the base rule sets it.
 */
export const OPERATOR_DESK_TASKBAR_CENTER_CSS = `
.op-taskbar{left:50%;transform:translateX(-50%)}
`;
