// The fallback theme for the promoted visual-editor canvas (@splicewire/beam-ux/canvas), used only when the server sends
// no resolved theme (`page.props.theme.canvas`, the ThemeResolver cascade). It overrides nothing: the package's
// DEFAULT_CANVAS_THEME is the app's own tokens (the Beam green accent, the dark rail panels, the body face for chrome),
// so the editor reads as the same product as the app around it (launch ticket 05 item 4). It used to pin a slate palette
// and monospace chrome here, which made the editor a third visual language. A host with its own palette sets it through
// a theme entry, or by returning the slots it wants from here.
import type { CanvasTheme } from '@splicewire/beam-ux/canvas';

export const NEUTRAL_THEME: Partial<CanvasTheme> = {};
