import {useEffect,useState} from 'react';
import {render,screen,fireEvent,cleanup,waitFor} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {FiveRegionEditShell,useEditShellMount} from '@schemastud/frame';
import {createWidgetRegistry} from '@schemastud/seam';
import {BlockInspector} from './BlockInspector';
import {CanvasProvider,type CanvasConfig} from './context';
const config:CanvasConfig={registry:{},MdxView:()=>null,MdxEdit:()=>null,varSuggestions:['var(--brand)']};
afterEach(cleanup);
function Harness({type='p'}:{type?:string}){
 const [attrs,setAttrs]=useState<Record<string,unknown>>({title:'Original',className:'developer-class',bdStyle:{layers:[{declarations:{color:'red'}}]}});
 const registry=createWidgetRegistry();
 function Canvas(){
  const mount=useEditShellMount();
  useEffect(()=>mount.registerNodeAccess({getNode:()=>({type,attrsSchema:{type:'object',properties:{title:{type:'string'},className:{type:'string'}}},attrs}),setNodeAttrs:(_id,next)=>setAttrs(next)}),[mount]);
  return <button onClick={()=>mount.selectNode('0')}>Select node</button>;
 }
 registry.registerWidget('test',Canvas);
 return <CanvasProvider config={config}><FiveRegionEditShell widget="test" schema={{type:'object'}} registry={registry} inspector={<BlockInspector/>}/><output data-testid="attrs">{JSON.stringify(attrs)}</output></CanvasProvider>;
}
it('offers six panels and writes a selected layer while preserving className',async()=>{
 render(<Harness/>);fireEvent.click(screen.getByText('Select node'));
 for(const panel of ['Size','Layout','Text','Appearance','Effects','Advanced'])expect(screen.getByText(panel)).toBeTruthy();
 expect(screen.getByRole('region',{name:'Text contrast'}).textContent).toContain('Contrast unknown');
 fireEvent.change(screen.getByLabelText('Breakpoint'),{target:{value:'md'}});
 fireEvent.change(screen.getByLabelText('State'),{target:{value:'hover'}});
 fireEvent.change(screen.getByLabelText('color token'),{target:{value:'var(--brand)'}});
 await waitFor(()=>expect(screen.getByTestId('attrs').textContent).toContain('var(--brand)'));
 const result=JSON.parse(screen.getByTestId('attrs').textContent!);
 expect(result.className).toBe('developer-class');
 expect(result.bdStyle.layers).toContainEqual({breakpoint:'md',state:'hover',declarations:{color:'var(--brand)'}});
 expect(screen.getByText(/Layout-width preview only/)).toBeTruthy();
 expect(screen.getByText('Base: red')).toBeTruthy();
});
it('offers theme tokens before custom values for gradient stops and Advanced values',()=>{
 render(<Harness/>);fireEvent.click(screen.getByText('Select node'));
 fireEvent.click(screen.getByText('Gradient stops'));
 const start=screen.getByLabelText('Start colour token') as HTMLSelectElement;
 expect([...start.options].map(option=>option.value)).toEqual(['','var(--brand)']);
 fireEvent.change(start,{target:{value:'var(--brand)'}});
 expect((screen.getByLabelText('Start colour') as HTMLInputElement).value).toBe('var(--brand)');
 fireEvent.click(screen.getByText('Advanced'));
 const value=screen.getByLabelText('CSS value token') as HTMLSelectElement;
 expect([...value.options].map(option=>option.value)).toEqual(['','var(--brand)']);
 fireEvent.change(value,{target:{value:'var(--brand)'}});
 expect((screen.getByLabelText('CSS value') as HTMLInputElement).value).toBe('var(--brand)');
});
it('renders and writes schema-declared element fields',async()=>{
 render(<Harness/>);fireEvent.click(screen.getByText('Select node'));
 const title=screen.getByLabelText('Title');
 expect(title).toBeTruthy();
 fireEvent.change(title,{target:{value:'Updated title'}});
 await waitFor(()=>expect(screen.getByTestId('attrs').textContent).toContain('Updated title'));
});
it('hides style panels for code components without a forwarding declaration',()=>{
 render(<Harness type="Hero"/>);fireEvent.click(screen.getByText('Select node'));
 expect(screen.queryByText('Size')).toBeNull();
 expect(screen.getByText(/does not declare root-style forwarding/)).toBeTruthy();
 expect(screen.queryByLabelText('className')).toBeNull();
});
