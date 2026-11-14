// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { MessageProvider } from '@schemastud/messages/react';
import type { ClientCatalog } from '@schemastud/messages';
import { afterEach, expect, it } from 'vitest';
import { AuthMessage } from './auth-message';
import { useBeamMessages } from '../messages';
const ns = 'splicewire-beam-inertia::messages.auth_';
function catalog(translations: Record<string, string> = {}): ClientCatalog {
    return { version: 1, locale: 'en-US', realm: null, direction: 'ltr', messages: Object.fromEntries(Object.entries(translations).map(([key, text]) => [ns + key, { text, sourceLocale: 'en' }])) };
}
afterEach(cleanup);

function RichFixture() {
    const messages = useBeamMessages();
    return <p data-testid="rich"><AuthMessage text={messages.t('splicewire-beam-inertia::messages.auth_register_prompt', { action: '\uFFFC0\uFFFC' })} parts={[<a data-testid="action" href="/register">RAW link</a>]} /></p>;
}
it('keeps the complete English prompt and raw rich action without a provider', () => {
    render(<RichFixture />);
    expect(screen.getByTestId('rich').textContent).toBe("Don't have an account? RAW link");
});

it.each([':action', ':Action', ':ACTION'])('keeps rich sentence slots opaque and reorderable for %s', (alias) => {
    const view = render(<MessageProvider value={catalog({ register_prompt: `Before ${alias} after` })}><RichFixture /></MessageProvider>);
    const link = screen.getByTestId('action');
    expect(screen.getByTestId('rich').textContent).toBe('Before RAW link after');
    view.rerender(<MessageProvider value={catalog({ register_prompt: `${alias}, translated prompt` })} pseudo><RichFixture /></MessageProvider>);
    expect(screen.getByTestId('action')).toBe(link);
    expect(screen.getByTestId('rich').textContent).toContain('⟦');
    expect(screen.getByTestId('rich').textContent).toContain('RAW link');
    expect(screen.getByTestId('rich').textContent).not.toMatch(/[\u0000\uFFFC]/u);
    expect(screen.getByTestId('rich').textContent).not.toContain(alias);
});
