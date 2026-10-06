import { useAppearance, type Appearance } from '@splicewire/beam-ux/appearance';

const NEXT: Record<Appearance, Appearance> = { system: 'dark', dark: 'light', light: 'dark' };
const LABEL: Record<Appearance, string> = { system: 'System', light: 'Light', dark: 'Dark' };

/**
 * The docs header's appearance control (docs-walkthrough DM5, DOCS-13): the header's default `appearance` slot. It drives
 * the ONE appearance contract (`@splicewire/beam-ux/appearance`: `.dark` and `color-scheme` on <html>, persisted), so the
 * guides, the rail and the API reference all follow it. A click flips the RESOLVED scheme; the first click from `system`
 * goes to dark when the system is light, and to light when it is dark.
 */
export function AppearanceToggle() {
    const { appearance, resolvedAppearance, updateAppearance } = useAppearance();
    const next: Appearance = appearance === 'system' ? (resolvedAppearance === 'dark' ? 'light' : 'dark') : NEXT[appearance];

    return (
        <button
            type="button"
            className="beam-docs-appearance"
            aria-label={`Appearance: ${LABEL[appearance]} (switch to ${LABEL[next]})`}
            onClick={() => updateAppearance(next)}
        >
            {resolvedAppearance === 'dark' ? '☾' : '☀'}
        </button>
    );
}
