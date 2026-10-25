import {render,screen,fireEvent,waitFor,cleanup,act} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {CanvasProvider} from './context';
import type {CanvasConfig} from './context';
import {CanvasWidget} from './CanvasWidget';
import type {JsonDoc} from '../blockdoc/json';
import type {EntryCanvasBindingsOutputData} from '@splicewire/beam-resources/types/beam-ux';
const doc:JsonDoc=[{kind:'block',name:'p',dynamic:false,isComponent:false,props:[],children:[{kind:'text',value:'Fallback',field:'fields.title'}]}];
const result=(name:string):EntryCanvasBindingsOutputData=>({bindings:{},record:{fields:{title:name}},choices:[{value:'one',label:'First'},{value:'two',label:'Second'}],hasMore:true,recordPage:true,selectedValue:name==='First live'?'one':'two'});
afterEach(cleanup);
function View({port,onChange=()=>{}}:{port?:CanvasConfig['bindingPreview'];onChange?:(doc:JsonDoc)=>void}){
 return <CanvasProvider config={{registry:{},bindingPreview:port}}><CanvasWidget value={doc} onChange={onChange}/></CanvasProvider>;
}
it('reads the first page as author and switches Record without editing or saving the document',async()=>{
 const change=vi.fn();const read=vi.fn(async(_id,_body,value)=>result(value==='two'?'Second live':'First live'));
 render(<View port={{entryId:'addressed',resolve:read}} onChange={change}/>);
 await screen.findByText('First live');expect(read).toHaveBeenCalledWith('addressed',doc,null);
 fireEvent.change(screen.getByLabelText('Preview Record'),{target:{value:'two'}});
 expect(screen.queryByText('First live')).toBeNull();await screen.findByText('Second live');
 expect(change).not.toHaveBeenCalled();expect(screen.getByText(/First page only/)).toBeTruthy();
});
it('discards a late old-entry response and clears data on refusal or unavailable port',async()=>{
 let finish!:(data:EntryCanvasBindingsOutputData)=>void;
 const old=vi.fn(()=>new Promise<EntryCanvasBindingsOutputData>(resolve=>{finish=resolve;}));
 const view=render(<View port={{entryId:'old',resolve:old}}/>);
 await waitFor(()=>expect(old).toHaveBeenCalledTimes(1));
 const denied=vi.fn(async()=>{throw Error('private');});
 view.rerender(<View port={{entryId:'new',resolve:denied}}/>);
 await act(async()=>finish(result('Old secret')));
 await screen.findByRole('alert');expect(screen.queryByText('Old secret')).toBeNull();
 view.rerender(<View port={{entryId:'new'}}/>);expect(screen.getByText(/preview unavailable/)).toBeTruthy();expect(screen.queryByLabelText('Preview Record')).toBeNull();
});
it('preserves old one-argument standalone canvas consumers without a binding port',()=>{
 render(<View/>);expect(screen.getByText('Fallback')).toBeTruthy();expect(screen.queryByRole('alert')).toBeNull();
});
