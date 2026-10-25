import {render,screen,fireEvent,waitFor,cleanup,act} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {CanvasProvider} from './context';
import type {CanvasConfig} from './context';
import {CanvasWidget} from './CanvasWidget';
import type {JsonDoc} from '../blockdoc/json';
import type {EntryCanvasBindingsOutputData} from '@splicewire/beam-resources/types/beam-ux';
const doc:JsonDoc=[{kind:'block',name:'p',dynamic:false,isComponent:false,props:[],children:[{kind:'text',value:'Fallback',field:'fields.title'}]}];
const result=(name:string):EntryCanvasBindingsOutputData=>({bindings:{},record:{fields:{title:name}},choices:[{value:'one',label:'First'},{value:'two',label:'Second'}],hasMore:true,recordPage:true,pagePublic:null,selectedValue:name==='First live'?'one':'two'});
afterEach(cleanup);
function View({port,onChange=()=>{}}:{port?:CanvasConfig['bindingPreview'];onChange?:(doc:JsonDoc)=>void}){
 return <CanvasProvider config={{registry:{},bindingPreview:port}}><CanvasWidget value={doc} onChange={onChange}/></CanvasProvider>;
}
it('reads the first page as author and switches Record without editing or saving the document',async()=>{
 const change=vi.fn();const read=vi.fn(async(_id,_body,value)=>result(value==='two'?'Second live':'First live'));
 render(<View port={{entryId:'addressed',resolve:read}} onChange={change}/>);
 await screen.findByText('First live');expect(read).toHaveBeenCalledWith('addressed',doc,null,expect.objectContaining({signal:expect.any(AbortSignal)}));
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

function EnvelopeRepeat({port}:{port:CanvasConfig['bindingPreview']}){
 const repeat:JsonDoc=[{kind:'block',name:'p',id:'rows',dynamic:false,isComponent:false,props:[],repeat:{collection:'posts'},children:[{kind:'text',value:'Empty',field:'fields.title'}]}];
 return <CanvasProvider config={{registry:{},bindingPreview:port,bindings:{rows:{records:[{fields:{title:'Existing envelope Record'}}],hasMore:false,page:1}}}}><CanvasWidget value={repeat}/></CanvasProvider>;
}
it('retains the envelope Repeat data when an injected host has no live-read port',()=>{
 render(<EnvelopeRepeat port={{entryId:'existing'}}/>);
 expect(screen.getByText('Existing envelope Record')).toBeTruthy();expect(screen.getByText(/preview unavailable/)).toBeTruthy();
});
it('retains the envelope Repeat data after an addressed preview read is refused',async()=>{
 render(<EnvelopeRepeat port={{entryId:'existing',resolve:async()=>{throw Object.assign(Error('denied'),{status:403});}}}/>);
 await screen.findByRole('alert');expect(screen.getByText('Existing envelope Record')).toBeTruthy();
});

it('aborts the previous request on a document edit and the current request on unmount',async()=>{
 const signals:AbortSignal[]=[];
 const read=vi.fn<NonNullable<import('../types').UxBuilderClient['canvasBindings']>>((_id,_body,_value,options)=>{if(options?.signal)signals.push(options.signal);return new Promise<EntryCanvasBindingsOutputData>(()=>{});});
 const port={entryId:'same',resolve:read};
 function Document({body}:{body:JsonDoc}){return <CanvasProvider config={{registry:{},bindingPreview:port}}><CanvasWidget value={body}/></CanvasProvider>;}
 const view=render(<Document body={doc}/>);await waitFor(()=>expect(read).toHaveBeenCalledTimes(1));
 expect(signals[0]?.aborted).toBe(false);
 view.rerender(<Document body={[...doc,{kind:'text',value:'New local edit'}]}/>);
 expect(signals[0]?.aborted).toBe(true);await waitFor(()=>expect(read).toHaveBeenCalledTimes(2));
 view.unmount();expect(signals[1]?.aborted).toBe(true);
});

it('warns at canvas level only about referenced Collections on a guest-readable page',async()=>{
 const body:JsonDoc=[{kind:'block',name:'p',id:'rows',dynamic:false,isComponent:false,props:[],repeat:{collection:'posts',empty:[{kind:'block',name:'p',id:'empty',dynamic:false,isComponent:false,props:[],children:[],repeat:{collection:'fallback'}}]},children:[]}];
 const profile={profile:'content',version:1,doc:{admitsChildCategories:['html']},nodes:[], 'x-collections':[
  {name:'posts',schema:{type:'object'},publicRead:false}, {name:'fallback',schema:{type:'object'},publicRead:null}, {name:'unused',schema:{type:'object'},publicRead:false}]};
 const read=async()=>({...result('First live'),pagePublic:true});
 const view=render(<CanvasProvider config={{registry:{},profile,bindingPreview:{entryId:'page',resolve:read}}}><CanvasWidget value={body}/></CanvasProvider>);
 expect(await screen.findByText(/posts: This Collection has no Public Read/)).toBeTruthy();
 expect(screen.getByText(/fallback: Public Read is unknown/)).toBeTruthy();
 expect(screen.queryByText(/unused:/)).toBeNull();
 const privateRead=async()=>({...result('First live'),pagePublic:false});
 view.rerender(<CanvasProvider config={{registry:{},profile,bindingPreview:{entryId:'private',resolve:privateRead}}}><CanvasWidget value={body}/></CanvasProvider>);
 await waitFor(()=>expect(screen.queryByText(/posts: This Collection has no Public Read/)).toBeNull());
 expect(await screen.findByLabelText('Preview Record')).toBeTruthy();
 expect(screen.queryByText(/has no Public Read/)).toBeNull();
});
