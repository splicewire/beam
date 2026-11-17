import { useAppearance, type Appearance } from '@splicewire/beam-ux/appearance';
import { useBeamDocsMessages, type BeamDocsMessageKey } from './messages.js';

const NEXT: Record<Appearance, Appearance> = { system: 'dark', dark: 'light', light: 'dark' };
// Catalog keys, translated where they render (localization 30).
const LABEL: Record<Appearance, BeamDocsMessageKey> = {
    system: 'splicewire-beam-docs::messages.appearance_system',
    light: 'splicewire-beam-docs::messages.appearance_light',
    dark: 'splicewire-beam-docs::messages.appearance_dark',
};

/**
 * The docs header's appearance control (docs-walkthrough DM5, DOCS-13): the header's default `appearance` slot. It drives
 * the ONE appearance contract (`@splicewire/beam-ux/appearance`: `.dark` and `color-scheme` on <html>, persisted), so the
 * guides, the rail and the API reference all follow it. A click flips the RESOLVED scheme; the first click from `system`
 * goes to dark when the system is light, and to light when it is dark.
 */
export function AppearanceToggle() {
    const m = useBeamDocsMessages();
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();
    const next: Appearance = appearance === 'system' ? (resolvedAppearance === 'dark' ? 'light' : 'dark') : NEXT[appearance];

    return (
        <button
            type="button"
            className="beam-docs-appearance"
            aria-label={m.t('splicewire-beam-docs::messages.appearance_toggle_label', { current: m.t(LABEL[appearance]), next: m.t(LABEL[next]) })}
            onClick={() => updateAppearance(next)}
        >
            {resolvedAppearance === 'dark' ? '☾' : '☀'}
        </button>
    );
}
