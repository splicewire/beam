import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CELL_REVISION } from './TakesStrip.stories';
import { TakesStrip } from './TakesStrip';

// An older take's short date follows the reader's catalog locale, not the browser's, and reformats on a live switch
// without remounting its row (tower-ux localization 32a's studio-copy contract).
afterEach(cleanup);
const catalog = (locale: string): ClientCatalog => ({ version: 1, locale, realm: null, direction: 'ltr', messages: {} });
const labels = { region: 'Takes', empty: 'None.', note: 'Note.' };
const at = '2020-01-09T12:00:00Z';
const short = (locale: string) => new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(at));

it('formats an older take date in the reader locale and reformats it on a locale switch', () => {
    const takes = [{ ...CELL_REVISION, at }];
    const tree = (locale: string) => (
        <MessageProvider value={catalog(locale)}>
            <TakesStrip takes={takes} labels={labels} onRevert={vi.fn()} />
        </MessageProvider>
    );
    const view = render(tree('en-US'));
    const when = () => view.container.querySelector('[data-take-when]');
    const row = view.container.querySelector('li[data-take-kind]');
    expect(when()?.textContent).toContain(short('en-US'));

    view.rerender(tree('fr-FR'));

    expect(view.container.querySelector('li[data-take-kind]')).toBe(row);
    expect(when()?.textContent).toContain(short('fr-FR'));
    expect(short('fr-FR')).not.toBe(short('en-US'));
});
