import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PreviewBar, type PreviewBarData } from './PreviewBar.js';

// Owner-review-20261112 ticket 71: a Release's due date in the Publish notes follows the reader's catalog locale, not
// the browser's, and reformats on a live switch without remounting its note (the TakesStrip fix's contract, c3d2f72).
afterEach(cleanup);
const catalog = (locale: string): ClientCatalog => ({ version: 1, locale, realm: null, direction: 'ltr', messages: {} });
const due = '2030-01-01T09:30:00+01:00';
const when = (locale: string) =>
    new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(due));

const preview: PreviewBarData = {
    label: 'Spring release',
    exitUrl: '/_beam/preview/exit',
    mode: 'preview',
    switchUrl: null,
    previewUrl: '/_beam/preview/switch?to=preview',
    readiness: {
        ready: true,
        blockers: [],
        notes: [{ code: 'other-release', entryId: 'about', message: 'Also in the Release "Summer" (scheduled).', fixes: [], releaseDueAt: due }],
    },
};

const note = () => screen.getByText(/Also in the Release "Summer"/).closest('li');

it('formats a Release due date in the reader locale and reformats it on a locale switch', () => {
    const tree = (locale: string) => (
        <MessageProvider value={catalog(locale)}>
            <PreviewBar preview={preview} />
        </MessageProvider>
    );
    const view = render(tree('en-US'));
    const li = note();
    expect(li?.textContent).toContain(`Publishes ${when('en-US')}.`);

    view.rerender(tree('fr-FR'));

    expect(note()).toBe(li);
    expect(note()?.textContent).toContain(when('fr-FR'));
    expect(when('fr-FR')).not.toBe(when('en-US'));
});

it('formats it in English with no message provider', () => {
    render(<PreviewBar preview={preview} />);
    expect(note()?.textContent).toContain(`Publishes ${when('en')}.`);
});
