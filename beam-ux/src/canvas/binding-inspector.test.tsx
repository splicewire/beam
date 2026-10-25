import {useState,useMemo,useRef} from 'react';
import {render,screen,fireEvent,cleanup,within} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {FiveRegionEditShell} from '@schemastud/frame';
import {createWidgetRegistry} from '@schemastud/seam';
import {CanvasProvider} from './context';
import {CanvasWidget} from './CanvasWidget';
import {BlockInspector} from './BlockInspector';
import type {JsonDoc} from '../blockdoc/json';
const initial:JsonDoc=[{kind:'block',name:'p',id:'paragraph',dynamic:false,isComponent:false,props:[],children:[{kind:'text',value:'Fallback'}]}];
const profile={profile:'content',version:1,doc:{admitsChildCategories:['html']},nodes:[{name:'p',category:'html',admitsChildCategories:[],attrsSchema:{type:'object',properties:{title:{type:'string'}}}}],
 'x-collections':[{name:'posts',schema:{type:'object',properties:{fields:{type:'object',properties:{title:{type:'string','x-sort':{name:'title'},'x-filter':{name:'title'}},rich:{type:'string',format:'markdown'},published:{type:'boolean'},count:{type:'integer'}}}}},publicRead:false,hasRecordPage:true}]};
afterEach(cleanup);
function Harness({readOnly=false,change=()=>{}}:{readOnly?:boolean;change?:(doc:JsonDoc)=>void}){
 const [doc,setDoc]=useState(initial);const state=useRef({doc,readOnly});state.current={doc,readOnly};
 const registry=useMemo(()=>{const r=createWidgetRegistry();r.registerWidget('canvas',props=><CanvasWidget {...props} value={state.current.doc} readOnly={state.current.readOnly} onChange={next=>{setDoc(next);change(next);}}/>);return r;},[]);
 return <CanvasProvider config={{registry:{},profile}}><FiveRegionEditShell widget="canvas" schema={{type:'object'}} registry={registry} record={doc as unknown as Record<string,unknown>} inspector={<BlockInspector/>}/><output data-testid="doc">{JSON.stringify(doc)}</output></CanvasProvider>;
}
it('writes profile Collection, first-page query, field binding and typed when rules through canvas commands',()=>{
 const change=vi.fn();render(<Harness change={change}/>);fireEvent.click(screen.getByText('p 0'));
 fireEvent.change(screen.getByLabelText('Collection'),{target:{value:'posts'}});
 expect(screen.getByText(/has no Public Read/)).toBeTruthy();
 expect(within(screen.getByLabelText('Text field')).queryByRole('option',{name:/fields.rich/})).toBeNull();
 fireEvent.change(screen.getByLabelText('Record limit'),{target:{value:'10'}});
 fireEvent.change(screen.getByLabelText('Sort field'),{target:{value:'fields.title'}});
 fireEvent.change(screen.getByLabelText('Sort order'),{target:{value:'descending'}});
 fireEvent.change(screen.getByLabelText('Text field'),{target:{value:'fields.title'}});
 fireEvent.change(screen.getByLabelText('Bind title'),{target:{value:'fields.title'}});
 fireEvent.change(screen.getByLabelText('Condition match'),{target:{value:'any'}});fireEvent.click(screen.getByText('Add display rule'));
 fireEvent.change(screen.getByLabelText('Rule 1 field'),{target:{value:'fields.count'}});
 fireEvent.change(screen.getByLabelText('Rule 1 operator'),{target:{value:'greater than'}});
 fireEvent.change(screen.getByLabelText('Rule 1 value'),{target:{value:'2'}});fireEvent.blur(screen.getByLabelText('Rule 1 value'));
 const [node]=JSON.parse(screen.getByTestId('doc').textContent!);
 expect(node.id).toBe('paragraph');expect(node.repeat).toEqual({collection:'posts',query:{limit:10,sort:'-title'},empty:[]});
 expect(node.children).toEqual([{kind:'text',value:'Fallback',field:'fields.title'}]);
 expect(node.props).toContainEqual({kind:'field',name:'title',value:'fields.title'});
 expect(node.when).toEqual({any:[{field:'fields.count',operator:'greater than',value:2}]});
 fireEvent.change(screen.getByLabelText('color'),{target:{value:'red'}});fireEvent.blur(screen.getByLabelText('color'));
 expect(JSON.parse(screen.getByTestId('doc').textContent!)[0].props).toContainEqual({kind:'field',name:'title',value:'fields.title'});
 expect(change).toHaveBeenCalled();
});
it('cannot mutate binding declarations in a read-only canvas',()=>{
 const change=vi.fn();render(<Harness readOnly change={change}/>);fireEvent.click(screen.getByText('p 0'));
 expect((screen.getByLabelText('Collection') as HTMLSelectElement).closest('fieldset')?.disabled).toBe(true);
 fireEvent.change(screen.getByLabelText('Collection'),{target:{value:'posts'}});
 expect(change).not.toHaveBeenCalled();expect(screen.getByTestId('doc').textContent).not.toContain('repeat');
});
