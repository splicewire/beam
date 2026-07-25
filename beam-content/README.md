# @splicewire/beam-content

Bespoke **blockdoc NodeViews** for the composition `content` profile's block vocabulary. They
replace blockdoc's generic `BlockChromeFallback` (the grey "edit via the inspector" scaffold) so
custom content blocks render as clean, inline **WYSIWYG** in the shared
[`@schemastud/blockdoc`](../../schemastud/blockdoc) editor.

Part of the **component-seams** catalog (the content-node seam). Free-tier beam twin: headless and
host-agnostic — each NodeView is a presentational component over the blockdoc `NodeViewComponentProps`
contract; `@schemastud/blockdoc`, `lucide-react`, and `react` are host-provided peers.

## What it ships

| NodeView | Node | Renders |
|---|---|---|
| `ContentSectionNodeView` | `content_section` | The section heading (single authored title) + a collapsible generation-context strip (strategy / image prompt / grounding) + PM-managed child prose via `contentRef`. |
| `ContentOutlineNodeView` | `content_outline` | The article plan — title, one-line excerpt, and an editable ordered list of section headings (add / edit / remove). A leaf node (no child prose). |

## Host wiring

The host registers them once on its blockdoc `nodeViewRegistry`:

```ts
import { registerContentNodeViews } from '@splicewire/beam-content';
registerContentNodeViews(nodeViewRegistry); // content_section + content_outline
```

## Verification

- **§8a runtime:** `npm test` — each NodeView mounts off a plain attrs bag (no editor, no Laravel)
  and patches attrs through the injected `updateAttrs`.
- **§8b static:** `npm run lint:imports` (deny-list) + `npm run typecheck`.
- **Catalog:** colocated `*.stories.tsx` (storybook-authoring convention) under `Content/…`, exercised
  in the beam per-repo Storybook.
