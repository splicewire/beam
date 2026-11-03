import {useState} from 'react';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {beforeEach,afterEach,it,expect,vi} from 'vitest';
import {CanvasProvider,type CanvasConfig} from './context';
import {RepeatRecordSelection} from './RepeatRecordSelection';
import type {RepeatQuery} from '../blockdoc/bindings';
import type {EntryCanvasBindingsOutputData} from '@splicewire/beam-resources/types/beam-ux';
const id='019a3456-7890-7000-8000-000000000001';
const offer={name:'posts',schema:{type:'object',properties:{id:{type:'string'},fields:{type:'object',properties:{title:{type:'string'}}}}},publicRead:false,hasRecordPage:false};
const response=(label:string):EntryCanvasBindingsOutputData=>({bindings:{saved:{records:[{id,fields:{title:label}}],hasMore:false,page:1}},record:null,choices:[],hasMore:false,recordPage:false,selectedValue:null,pagePublic:false});
beforeEach(()=>vi.stubGlobal('ResizeObserver',class{observe(){}unobserve(){}disconnect(){}}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
function Harness({port,disabled=false}:{port?:CanvasConfig['bindingPreview'];disabled?:boolean}){
 const [query,setQuery]=useState<RepeatQuery>({ids:[]});
 return <CanvasProvider config={{registry:{},bindingPreview:port}}><RepeatRecordSelection doc={[{kind:'block',name:'p',id:'saved',dynamic:false,isComponent:false,props:[],children:[],repeat:{collection:'posts',query}}]} path="0" offer={offer} query={query} disabled={disabled} onChange={setQuery}/><output>{JSON.stringify(query)}</output></CanvasProvider>;
}
it('retires old actor/address results and aborts the read before a new choice list can be edited',async()=>{
 let finish:((data:EntryCanvasBindingsOutputData)=>void)|undefined;let oldSignal:AbortSignal|undefined;
 const old={entryId:'old',resolve:vi.fn<NonNullable<NonNullable<CanvasConfig['bindingPreview']>['resolve']>>((_id,_body,_value,options)=>{oldSignal=options?.signal;return new Promise(resolve=>{finish=resolve;});})};
 const fresh={entryId:'new',resolve:vi.fn(async()=>response('Current Article'))};
 const view=render(<Harness port={old}/>);expect(screen.getByText(/Reading Record choices/)).toBeTruthy();
 view.rerender(<Harness port={fresh}/>);expect(await screen.findByRole('checkbox',{name:'Current Article'})).toBeTruthy();
 finish?.(response('Retired Article'));await waitFor(()=>expect(oldSignal?.aborted).toBe(true));
 expect(screen.queryByRole('checkbox',{name:'Retired Article'})).toBeNull();
});
it('distinguishes refused, unavailable and read-only choices without changing the saved selection',async()=>{
 const refused={entryId:'page',resolve:vi.fn(async()=>{throw Error('403');})};
 const view=render(<Harness port={refused}/>);expect(await screen.findByRole('alert')).toHaveProperty('textContent',expect.stringContaining('refused or failed'));
 expect(screen.queryByText(/No readable matching/)).toBeNull();
 view.rerender(<Harness/>);expect(screen.getByText(/Record choices unavailable/)).toBeTruthy();
 view.rerender(<Harness port={refused} disabled/>);expect(screen.getByText(/selection is read-only/)).toBeTruthy();
 fireEvent.change(screen.getByLabelText('Record selection'),{target:{value:'matching'}});
 expect(screen.getByText('{"ids":[]}')).toBeTruthy();
});
