/**
 * The registry index widget's rules (docs-feedback ticket 07), injected at render like {@link DOCS_LAYOUT_CSS} and for
 * the same reason: a host's Tailwind does not scan this bundle, so a utility class here would be a name with no rule.
 *
 * `@schemastud/combobox` writes a few utility classes of its own inside its popover (`bg-accent` on the active option,
 * `border-b` on the input row). They are matched here by structure and by those class NAMES, which are in the DOM
 * whether or not the host emitted a rule for them, so the keyboard highlight shows on every host.
 *
 * Ink is the docs token family: names at --beam-ink-70 (the rail's 4.5:1 choice), and an unserved root's note is the
 * same ink in a smaller, italic face rather than a fainter one, so "not available on this host" stays legible.
 */
export const REGISTRY_INDEX_CSS = `
.beam-registry-index { display: flex; flex-direction: column; gap: 0.5rem; margin: 0.25rem 0 0.5rem; }
.beam-registry-index-search { position: relative; }
.beam-registry-index-trigger { display: flex; width: 100%; align-items: center; gap: 0.5rem; padding: 0.375rem 0.625rem;
  border: 1px solid var(--beam-border, var(--beam-line)); border-radius: var(--beam-radius, 0.5rem);
  background: var(--beam-paper-raised, var(--beam-paper)); color: var(--beam-ink-70); font: inherit; font-size: 12.5px; cursor: pointer; text-align: left; }
.beam-registry-index-trigger:hover { color: var(--beam-fg, var(--beam-ink)); }
.beam-registry-index-trigger:focus-visible, .beam-registry-index-header:focus-visible, .beam-registry-index-link:focus-visible,
.beam-registry-index-input:focus-visible, .beam-registry-index-root:focus { outline: 2px solid var(--beam-fg, var(--beam-ink)); outline-offset: 1px; }
.beam-registry-index-trigger > span:nth-child(2) { flex: 1; }
.beam-registry-index-count { font-size: 11px; font-variant-numeric: tabular-nums; opacity: 0.8; }
.beam-registry-index-popover { position: absolute; z-index: 40; top: calc(100% + 0.25rem); left: 0; right: 0; box-sizing: border-box;
  border: 1px solid var(--beam-border, var(--beam-line)); border-radius: var(--beam-radius, 0.5rem);
  background: var(--beam-paper-raised, var(--beam-paper)); box-shadow: 0 8px 24px rgb(0 0 0 / 0.14); }
.beam-registry-index-popover > div:first-child { padding: 0.375rem; border-bottom: 1px solid var(--beam-border, var(--beam-line)); }
.beam-registry-index-input { width: 100%; box-sizing: border-box; padding: 0.375rem 0.5rem; font: inherit; font-size: 13px;
  border: 1px solid var(--beam-border, var(--beam-line)); border-radius: calc(var(--beam-radius, 0.5rem) - 2px);
  background: var(--beam-paper); color: var(--beam-fg, var(--beam-ink)); }
.beam-registry-index-results { max-height: 20rem; overflow-y: auto; padding: 0.25rem; }
.beam-registry-index-results > div { padding: 0.5rem; font-size: 12.5px; color: var(--beam-ink-70); }
.beam-registry-index-results [role='option'] { display: flex; width: 100%; gap: 0.375rem; align-items: flex-start; padding: 0.375rem 0.5rem;
  border: 0; border-radius: calc(var(--beam-radius, 0.5rem) - 2px); background: none; color: var(--beam-fg, var(--beam-ink));
  font: inherit; font-size: 12.5px; text-align: left; cursor: pointer; }
.beam-registry-index-results [role='option'].bg-accent { background: var(--beam-line, rgb(127 127 127 / 0.16)); }
.beam-registry-index-results [role='option'] > span:first-child { width: 0.75rem; flex: none; }
.beam-registry-index-results [role='option'] > span:last-child { min-width: 0; flex: 1; }
.beam-registry-index-results [role='option'] > span:last-child > span { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.beam-registry-index-results [role='option'] > span:last-child > span + span { font-size: 11px; color: var(--beam-ink-70); }
.beam-registry-index-tree { display: flex; flex-direction: column; gap: 0.5rem; }
.beam-registry-index-track-label { margin: 0.25rem 0 0.125rem; padding: 0 0.625rem; font-size: 10px; font-weight: 500;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--beam-ink-70); }
.beam-registry-index-track-label:empty { display: none; }
.beam-registry-index-header { display: flex; width: 100%; align-items: center; gap: 0.375rem; padding: 0.3rem 0.625rem; border: 0;
  border-radius: calc(var(--beam-radius, 0.5rem) - 2px); background: none; color: var(--beam-fg, var(--beam-ink));
  font: inherit; font-size: 13px; text-align: left; cursor: pointer; }
.beam-registry-index-header:hover { background: var(--beam-line, rgb(127 127 127 / 0.12)); }
.beam-registry-index-chevron { opacity: 0.7; }
.beam-registry-index-panel { padding-left: 1.4rem; }
.beam-registry-index-item { padding: 0.0625rem 0; }
.beam-registry-index-children { padding-left: 0.75rem; border-left: 1px solid var(--beam-border, var(--beam-line)); margin-left: 0.25rem; }
.beam-registry-index-link, .beam-registry-index-root { display: block; padding: 0.2rem 0.5rem; border-radius: calc(var(--beam-radius, 0.5rem) - 2px);
  font-size: 12.5px; text-decoration: none; overflow-wrap: break-word; }
.beam-registry-index-link { color: var(--beam-ink-70); }
.beam-registry-index-link:hover { color: var(--beam-fg, var(--beam-ink)); }
.beam-registry-index-link[data-active='true'] { color: var(--beam-fg, var(--beam-ink)); font-weight: 600; }
.beam-registry-index-root { color: var(--beam-ink-70); cursor: default; }
.beam-registry-index-root[data-revealed] { background: var(--beam-line, rgb(127 127 127 / 0.16)); }
.beam-registry-index-name { font-family: var(--beam-font-mono, ui-monospace, SFMono-Regular, Menlo, monospace); font-size: 11.5px; }
.beam-registry-index-note { display: block; font-size: 11px; font-style: italic; }
.beam-registry-index-root[data-availability] .beam-registry-index-name { text-decoration: line-through dotted; text-decoration-thickness: 1px; }
.beam-registry-index-root[data-availability='exempt'] .beam-registry-index-name { text-decoration: none; }
`;
