// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../editor/local-session', async original => {
    const actual = await original<typeof import('../editor/local-session')>();
    return {...actual, IndexedDbSessions: class {
        async forEntry() { return []; } async write() {} close() {}
    }};
});
vi.mock('./CanvasWidget', () => ({CanvasWidget: ({onChange}: {onChange: (body: unknown[])=>void}) =>
    <button onClick={()=>onChange([{kind:'text',value:'edited'}])}>Edit test body</button>}));
vi.mock('./CanvasPalette', () => ({CanvasPalette: ()=>null}));
vi.mock('./BlockInspector', () => ({BlockInspector: ()=>null}));
import { PageEditor, type PageEditorTransport } from './PageEditor';
import { CanvasProvider } from './context';
const doc = [{kind:'text' as const,value:'server baseline'}];
const empty = {id:'entry',headVersion:null,publishedVersion:null,versions:[],draftPending:false};
const saved = {...empty,headVersion:'draft',publishedVersion:'baseline'};
afterEach(()=>{ act(()=>window.dispatchEvent(new CustomEvent('beam-ux:mode',{detail:{mode:'domain'}}))); cleanup(); });
function mount(state = empty) {
    const transport: PageEditorTransport = {
        saveBody:vi.fn(),saveDraft:vi.fn().mockResolvedValue(saved),
        publish:vi.fn().mockResolvedValue({...saved,publishedVersion:'draft'}),
        listVersions:vi.fn().mockResolvedValue(state),restoreVersion:vi.fn(),
    };
    render(<CanvasProvider config={{registry:{},MdxView:()=>null,MdxEdit:()=>null}}>
        <PageEditor slug="home" entryId="entry" userId="author" body={doc} transport={transport} />
    </CanvasProvider>);
    act(()=>window.dispatchEvent(new CustomEvent('beam-ux:mode',{detail:{mode:'window'}})));
    return transport;
}
it('mounts without a write and saves an unauthored page with null base', async()=>{
    const transport=mount();
    const save=await screen.findByRole('button',{name:'Save draft'});
    expect(transport.saveDraft).not.toHaveBeenCalled();
    fireEvent.click(save);
    await waitFor(()=>expect(transport.saveDraft).toHaveBeenCalledWith('home',doc,null));
});
it('first Publish includes pending edits and publishes only the new returned head', async()=>{
    const transport=mount();
    fireEvent.click(await screen.findByRole('button',{name:'Edit test body'}));
    fireEvent.click(screen.getByRole('button',{name:'Publish'}));
    await waitFor(()=>expect(transport.saveDraft).toHaveBeenCalledWith('home',[{kind:'text',value:'edited'}],null));
    await waitFor(()=>expect(transport.publish).toHaveBeenCalledWith('home','draft'));
});
