// @vitest-environment jsdom
import type { ClientCatalog } from '@schemastud/messages';
import { MessageProvider } from '@schemastud/messages/react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../editor/local-session', async original => {
    const actual = await original<typeof import('../editor/local-session')>();
    return {...actual, IndexedDbSessions: class {
        async forEntry() { return []; } async write() {} close() {}
    }};
});
vi.mock('./CanvasWidget', () => ({CanvasWidget: () => null}));
vi.mock('./CanvasPalette', () => ({CanvasPalette: () => null}));
vi.mock('./BlockInspector', () => ({BlockInspector: () => null}));
import { PageEditor, type PageEditorTransport } from './PageEditor';
import { CanvasProvider } from './context';

// REVIEW-31B: the editor's load failure is kept as a catalog line plus its data and translated when it renders, so
// switching the locale after the one-shot load effect failed re-renders the alert (a stored string would stay English).
const english: ClientCatalog = {version:1,locale:'en',realm:null,direction:'ltr',messages:{}};
const spanish: ClientCatalog = {version:1,locale:'es',realm:null,direction:'ltr',messages:{
    'splicewire-beam-ux::messages.page_history_load_failed':{text:'No se pudo cargar el historial de publicación.',sourceLocale:'es'},
}};
afterEach(()=>{ act(()=>window.dispatchEvent(new CustomEvent('beam-ux:mode',{detail:{mode:'domain'}}))); cleanup(); });

it('re-renders a publication-history load failure in the new locale after a live switch', async()=>{
    const transport: PageEditorTransport = {
        saveBody:vi.fn(),saveDraft:vi.fn(),publish:vi.fn(),restoreVersion:vi.fn(),
        listVersions:vi.fn().mockRejectedValue(new Error('offline')),
    };
    const tree=(catalog: ClientCatalog)=><MessageProvider value={catalog}>
        <CanvasProvider config={{registry:{},MdxView:()=>null,MdxEdit:()=>null}}>
            <PageEditor slug="home" entryId="entry" userId="author" body={[{kind:'text',value:'baseline'}]} transport={transport} />
        </CanvasProvider>
    </MessageProvider>;
    const view=render(tree(english));
    act(()=>window.dispatchEvent(new CustomEvent('beam-ux:mode',{detail:{mode:'window'}})));
    expect(await screen.findByText('Could not load publication history. Verify the versions and publication-pin migrations.')).toBeTruthy();

    view.rerender(tree(spanish));

    expect(screen.getByText('No se pudo cargar el historial de publicación.')).toBeTruthy();
    expect(transport.listVersions).toHaveBeenCalledTimes(1);
});
