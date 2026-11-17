import { useFlashToast } from '../../hooks/use-flash-toast';
import { useAppearance } from '../../hooks/use-appearance';
import { useBeamMessages } from '../../messages';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/** sonner's own default shortcut and its label, computed the way sonner computes it (sonner 2.x `Toaster`). */
const DEFAULT_HOTKEY = ['altKey', 'KeyT'];
function hotkeyLabel(hotkey: readonly string[]): string {
    return hotkey.join('+').replace(/Key/g, '').replace(/Digit/g, '');
}

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();
    const messages = useBeamMessages();

    useFlashToast();

    // The region's accessible name is ONE catalog sentence with the shortcut as a parameter; sonner's English default
    // ("Notifications alt+T") otherwise reaches every page untranslated. A caller's `customAriaLabel` still wins.
    const label = messages.t('splicewire-beam-inertia::messages.chrome_notifications_region', { hotkey: hotkeyLabel(props.hotkey ?? DEFAULT_HOTKEY) });

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="bottom-right"
            customAriaLabel={label}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
