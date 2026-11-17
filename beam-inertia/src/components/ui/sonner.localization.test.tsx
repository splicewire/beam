// @vitest-environment jsdom
// localization 28b: the notifications region's accessible name was sonner's English default ("Notifications alt+T") on every
// page. It reads from the catalog as ONE sentence with the shortcut as a parameter: a provider in pseudo mode marks the whole
// name, and with no provider the English is byte-identical to sonner's.
import { cleanup, render } from '@testing-library/react';
import { MessageProvider } from '@schemastud/messages/react';
import type { ClientCatalog } from '@schemastud/messages';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('../../hooks/use-flash-toast', () => ({ useFlashToast: () => {} }));
vi.mock('../../hooks/use-appearance', () => ({ useAppearance: () => ({ appearance: 'light', updateAppearance: () => {} }) }));
import { Toaster } from './sonner';

afterEach(() => { cleanup(); });

const englishXa: ClientCatalog = { version: 1, locale: 'en-XA', realm: null, direction: 'ltr', messages: {} };
const regionLabel = () => document.querySelector('section[aria-label]')?.getAttribute('aria-label') ?? null;

it("keeps sonner's English name with no provider (parity)", () => {
    render(<Toaster />);
    expect(regionLabel()).toBe('Notifications alt+T');
});

it('is ONE marked sentence, shortcut inside, under the pseudo-locale', () => {
    render(<MessageProvider value={englishXa} pseudo><Toaster /></MessageProvider>);
    const label = regionLabel();
    expect(label?.startsWith('⟦')).toBe(true);
    expect(label?.trimEnd().endsWith('⟧')).toBe(true);
    expect(label).toContain('alt+T');
    expect(label).not.toContain('Notifications');
});

it("lets a caller's shortcut and label win", () => {
    render(<Toaster hotkey={['shiftKey', 'KeyN']} />);
    expect(regionLabel()).toBe('Notifications shift+N');
    cleanup();
    render(<Toaster customAriaLabel="Alerts" />);
    expect(regionLabel()).toBe('Alerts');
});
