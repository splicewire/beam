// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {MediaPicker} from './MediaPicker';
afterEach(cleanup);
const image={id:'image-a',name:'cat.png',url:'/storage/entry-a/cat.png'};
it('lists only the addressed entry library and choosing changes the local value',async()=>{
 const list=vi.fn().mockResolvedValue({items:[image]});const choose=vi.fn();
 render(<MediaPicker label="src" library={{list,upload:vi.fn()}} onChoose={choose}/>);
 fireEvent.click(screen.getByRole('button',{name:'Choose image for src'}));
 await screen.findByRole('button',{name:'Use cat.png'});
 expect(list).toHaveBeenCalledTimes(1);
 expect(choose).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'Use cat.png'}));
 expect(choose).toHaveBeenCalledExactlyOnceWith(image.url);
 expect(screen.queryByRole('group',{name:'src image library'})).toBeNull();
});
it('uploads a real File through the injected entry adapter and selects its returned URL',async()=>{
 const upload=vi.fn().mockResolvedValue(image);const choose=vi.fn();
 render(<MediaPicker label="Social image" library={{list:async()=>({items:[]}),upload}} onChoose={choose}/>);
 fireEvent.click(screen.getByRole('button',{name:'Choose image for Social image'}));
 await screen.findByText('No images for this entry yet.');
 const file=new File(['raster'],'cat.png',{type:'image/png'});
 fireEvent.change(screen.getByLabelText('Upload image for Social image'),{target:{files:[file]}});
 await waitFor(()=>expect(choose).toHaveBeenCalledWith(image.url));
 expect(upload).toHaveBeenCalledExactlyOnceWith(file);
});
it('shows a refused read separately from an empty library and permits cancel without writes',async()=>{
 const choose=vi.fn();
 render(<MediaPicker label="src" library={{list:async()=>{throw new Error('Forbidden');},upload:vi.fn()}} onChoose={choose}/>);
 fireEvent.click(screen.getByRole('button',{name:'Choose image for src'}));
 expect((await screen.findByRole('alert')).textContent).toContain('Forbidden');
 expect(screen.queryByText('No images for this entry yet.')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Cancel image choice'}));
 expect(choose).not.toHaveBeenCalled();
});

it('finishes an upload through the latest selection callback after a parent edit',async()=>{
 let finish!:(value:typeof image)=>void;
 const upload=vi.fn(()=>new Promise<typeof image>(resolve=>{finish=resolve;}));
 const before=vi.fn();const after=vi.fn();const library={list:async()=>({items:[]}),upload};
 const view=render(<MediaPicker label="src" library={library} onChoose={before}/>);
 fireEvent.click(screen.getByRole('button',{name:'Choose image for src'}));
 await screen.findByText('No images for this entry yet.');
 fireEvent.change(screen.getByLabelText('Upload image for src'),{target:{files:[new File(['raster'],'cat.png')]}});
 view.rerender(<MediaPicker label="src" library={library} onChoose={after}/>);
 finish(image);
 await waitFor(()=>expect(after).toHaveBeenCalledExactlyOnceWith(image.url));
 expect(before).not.toHaveBeenCalled();
});
