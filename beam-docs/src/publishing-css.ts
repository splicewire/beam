/** Structural defaults inherit the host's existing Beam/shadcn palette and font. */
export const PUBLISHING_CSS = `
.beam-docs-publishing-page { width: 100%; max-width: 64rem; margin-inline: auto; padding: clamp(1.25rem, 4vw, 3rem); }
.beam-docs-publishing-page > header { margin-bottom: 2.5rem; }
.beam-docs-publishing-page h1 { margin: 0 0 0.75rem; font-size: clamp(1.75rem, 3vw, 2.25rem); line-height: 1.2; font-weight: 650; text-wrap: balance; }
.beam-docs-back { display: inline-block; margin-bottom: 1.5rem; }
.beam-docs-publishing { color: var(--foreground, CanvasText); font: inherit; line-height: 1.5; }
.beam-docs-publishing h2 { margin: 0; font-size: 1.125rem; font-weight: 650; }
.beam-docs-publishing h3 { margin: 0; font-size: 1rem; font-weight: 650; overflow-wrap: anywhere; }
.beam-docs-publishing p { margin: 0.375rem 0 0; max-width: 72ch; }
.beam-docs-help { color: var(--muted-foreground, CanvasText); font-size: 0.875rem; }
.beam-docs-publish-form { padding-bottom: 2rem; }
.beam-docs-publish-controls { display: flex; align-items: end; flex-wrap: wrap; gap: 0.75rem; margin-block: 1.25rem 0.75rem; }
.beam-docs-version-field { flex: 1 1 16rem; max-width: 25rem; }
.beam-docs-version-field label { display: block; margin-bottom: 0.375rem; font-size: 0.875rem; font-weight: 600; }
.beam-docs-publishing input { width: 100%; min-height: 2.75rem; box-sizing: border-box; border: 1px solid var(--input, currentColor); border-radius: var(--radius, 0.375rem); padding: 0.625rem 0.75rem; color: inherit; background: var(--background, Canvas); font: inherit; }
.beam-docs-publishing input::placeholder { color: var(--muted-foreground, GrayText); opacity: 1; }
.beam-docs-publishing button { min-height: 2.75rem; border: 1px solid transparent; border-radius: var(--radius, 0.375rem); padding: 0.625rem 1rem; background: var(--primary, CanvasText); color: var(--primary-foreground, Canvas); font: inherit; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
.beam-docs-publishing button:hover:not(:disabled) { filter: brightness(0.92); }
.beam-docs-publishing .beam-docs-secondary { background: var(--background, Canvas); color: inherit; border-color: var(--border, currentColor); }
.beam-docs-publishing button:disabled { opacity: 0.55; cursor: default; }
.beam-docs-publishing :is(button,input,a):focus-visible, .beam-docs-back:focus-visible { outline: 2px solid var(--ring, Highlight); outline-offset: 3px; }
.beam-docs-publishing a, .beam-docs-back { color: inherit; text-decoration: underline; text-underline-offset: 0.2em; font-size: 0.875rem; }
.beam-docs-error { color: var(--destructive, CanvasText); overflow-wrap: anywhere; }
.beam-docs-announcement:empty { display: none; }
.beam-docs-attempts-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-top: 1.5rem; border-top: 1px solid var(--border, currentColor); }
.beam-docs-attempts { padding: 0; margin: 1rem 0 0; list-style: none; }
.beam-docs-attempt { display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 1rem; padding-block: 1.25rem; border-bottom: 1px solid var(--border, currentColor); }
.beam-docs-attempt-summary { min-width: 0; overflow-wrap: anywhere; }
.beam-docs-attempt-meta { display: flex; flex-wrap: wrap; gap: 0.375rem 1rem; color: var(--muted-foreground, CanvasText); font-size: 0.8125rem; }
.beam-docs-attempt-meta code { font-size: inherit; }
.beam-docs-attempt-actions { display: flex; flex-direction: column; align-items: end; gap: 0.625rem; }
.beam-docs-attempt-status { font-size: 0.875rem; font-weight: 600; text-transform: capitalize; }
.beam-docs-attempt-status[data-status='failed'] { color: var(--destructive, CanvasText); }
.beam-docs-attempt-error { grid-column: 1 / -1; overflow-wrap: anywhere; }
.beam-docs-empty { padding-block: 1.25rem; }
@media (max-width: 36rem) {
  .beam-docs-version-field { max-width: none; }
  .beam-docs-publish-controls > button { width: 100%; }
  .beam-docs-attempt { grid-template-columns: minmax(0,1fr); }
  .beam-docs-attempt-actions { flex-direction: row; align-items: center; flex-wrap: wrap; justify-content: space-between; }
}
`;
