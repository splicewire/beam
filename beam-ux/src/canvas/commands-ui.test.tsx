import {useState,useMemo,useRef} from 'react';
import {render,screen,fireEvent,cleanup,waitFor,act} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {FiveRegionEditShell} from '@schemastud/frame';
import {createWidgetRegistry} from '@schemastud/seam';
import {CanvasProvider} from './context';
import {CanvasWidget} from './CanvasWidget';
import {BlockInspector} from './BlockInspector';
import type {JsonBlock,JsonDoc} from '../blockdoc/json';
const block=(id:string,color:string):JsonBlock=>({kind:'block',id,name:'div',dynamic:false,isComponent:false,props:[],children:[],style:{layers:[{declarations:{color}}]}});
const config={registry:{},MdxView:()=>null,MdxEdit:()=>null};
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function Harness({readOnly=false,onChange=()=>{},initial}:{readOnly?:boolean;onChange?:(doc:JsonDoc)=>void;initial?:JsonDoc}){
 const [doc,setDoc]=useState<JsonDoc>(initial??[block('a','red'),block('b','blue')]);
 const state=useRef({doc,readOnly,onChange});state.current={doc,readOnly,onChange};
 const registry=useMemo(()=>{const r=createWidgetRegistry();r.registerWidget('canvas',props=><CanvasWidget {...props} value={state.current.doc} readOnly={state.current.readOnly} onChange={next=>{setDoc(next);state.current.onChange(next);}}/>);return r;},[]);
 return <CanvasProvider config={config}><button onClick={()=>setDoc([block('replacement','yellow')])}>Replace document</button><FiveRegionEditShell widget="canvas" schema={{type:'object'}} registry={registry} record={doc as unknown as Record<string,unknown>} inspector={<BlockInspector/>}/><output data-testid="doc">{JSON.stringify(doc)}</output></CanvasProvider>;
}
it('selects several outline blocks and applies one mixed-value style edit',async()=>{
 const change=vi.fn();render(<Harness onChange={change}/>);
 fireEvent.click(screen.getByText('div 0'));fireEvent.click(screen.getByText('div 1'),{ctrlKey:true});
 expect(screen.getByText('color: Mixed values')).toBeTruthy();
 fireEvent.change(screen.getByLabelText('color'),{target:{value:'green'}});fireEvent.blur(screen.getByLabelText('color'));
 await waitFor(()=>expect(change).toHaveBeenCalledTimes(1));
 expect(JSON.parse(screen.getByTestId('doc').textContent!).map((b:JsonBlock)=>b.style?.layers[0].declarations.color)).toEqual(['green','green']);
});
it('hide changes visitor display at md and show clears only that layer',()=>{
 render(<Harness/>);fireEvent.click(screen.getByText('div 0'));
 fireEvent.change(screen.getByLabelText('Breakpoint'),{target:{value:'md'}});
 fireEvent.click(screen.getByText('Hide div 0'));
 expect(screen.getByText(/Hidden for visitors at md\+ after publish/)).toBeTruthy();
 let doc=JSON.parse(screen.getByTestId('doc').textContent!);
 expect(doc[0].style.layers).toContainEqual({breakpoint:'md',state:null,declarations:{display:'none'}});
 fireEvent.click(screen.getByText('Show div 0'));
 doc=JSON.parse(screen.getByTestId('doc').textContent!);
 expect(doc[0].style.layers).toEqual([{declarations:{color:'red'}}]);
});
it('read-only never cuts, pastes, wraps, or hides',()=>{
 const change=vi.fn();render(<Harness readOnly onChange={change}/>);
 fireEvent.click(screen.getByText('div 0'));fireEvent.click(screen.getByText('Hide div 0'));fireEvent.click(screen.getByText('Wrap in flex'));
 expect(change).not.toHaveBeenCalled();
});
it('a failed clipboard write never cuts the document',async()=>{
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn().mockRejectedValue(Error('denied'))}});
 const change=vi.fn();render(<Harness onChange={change}/>);fireEvent.click(screen.getByText('div 0'));
 await act(async()=>fireEvent.click(screen.getByText('Cut blocks')));
 expect(screen.getByRole('alert').textContent).toContain('denied');expect(change).not.toHaveBeenCalled();
});
it('a delayed cut cannot delete a replacement document',async()=>{
 let finish!:()=>void;const pending=new Promise<void>(resolve=>{finish=resolve;});
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>pending}});
 const change=vi.fn();render(<Harness onChange={change}/>);fireEvent.click(screen.getByText('div 0'));fireEvent.click(screen.getByText('Cut blocks'));
 fireEvent.click(screen.getByText('Replace document'));await act(async()=>finish());
 expect(screen.getByRole('alert').textContent).toContain('not cut');
 expect(screen.getByTestId('doc').textContent).toContain('replacement');expect(change).not.toHaveBeenCalled();
});
it('wrap is one mutation and outline supports collapse and keyboard navigation',()=>{
 const change=vi.fn();render(<Harness onChange={change}/>);
 fireEvent.click(screen.getByText('div 0'));fireEvent.click(screen.getByText('div 1'),{shiftKey:true});
 fireEvent.click(screen.getByText('Wrap in grid'));expect(change).toHaveBeenCalledTimes(1);
 expect(screen.getByText('div 0.0')).toBeTruthy();
 fireEvent.click(screen.getByLabelText('Collapse div 0'));expect(screen.queryByText('div 0.0')).toBeNull();
 const parent=screen.getByText('div 0');parent.focus();fireEvent.keyDown(parent,{key:'ArrowRight'});
 expect(screen.getByText('div 0.0')).toBeTruthy();fireEvent.keyDown(parent,{key:'ArrowDown'});
 expect(document.activeElement).toBe(screen.getByText('div 0.0'));
});
