// @vitest-environment jsdom
/**
 * Localization 31 follow-up (frame-foundation 68's one beam-ux finding): with no `brand`, the visual editor bar names
 * itself from the catalog, so it switches locale live. A destructured string default would keep it English.
 */
import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { CanvasProvider } from './context';
import { VisualEditor } from './VisualEditor';

afterEach(cleanup);

const config = { registry: {}, MdxView: () => null, MdxEdit: () => null };
const body = [{ kind: 'block' as const, name: 'p', isComponent: false, dynamic: false, props: [], children: [{ kind: 'text' as const, value: 'Body' }] }];
const english: ClientCatalog = { version: 1, locale: 'en', realm: null, direction: 'ltr', messages: {} };
const spanish: ClientCatalog = {
    version: 1,
    locale: 'es',
    realm: null,
    direction: 'ltr',
    messages: { 'splicewire-beam-ux::messages.visual_editor_brand': { text: 'editor visual', sourceLocale: 'es' } },
};

it("names the visual editor bar in the reader's locale when the host passes no brand", () => {
    const tree = (catalog: ClientCatalog) => (
        <MessageProvider value={catalog}>
            <CanvasProvider config={config}>
                <VisualEditor value={body} onChange={() => {}} onSave={async () => {}} />
            </CanvasProvider>
        </MessageProvider>
    );
    const view = render(tree(english));
    expect(view.container.querySelector('.ve-brand')?.textContent).toBe('Vvisual editor');

    view.rerender(tree(spanish));

    expect(view.container.querySelector('.ve-brand')?.textContent).toBe('Eeditor visual');
});
