import {useState,useMemo,useRef} from 'react';
import type {ClientCatalog} from '@schemastud/messages';
import {MessageProvider} from '@schemastud/messages/react';
import {render,screen,fireEvent,cleanup,act} from '@testing-library/react';
import {afterEach,it,expect,vi} from 'vitest';
import {FiveRegionEditShell} from '@schemastud/frame/editor';
import {createWidgetRegistry, type WidgetResolution} from '@schemastud/seam';
import {CanvasProvider} from './context';
import {CanvasWidget, type CanvasWidgetProps} from './CanvasWidget';
import type {JsonBlock,JsonDoc} from '../blockdoc/json';

// Localization 31 part C (the REVIEW-31D class): a command failure is kept as a catalog line and translated when it
// renders, so a live locale switch re-renders the alert already showing.
const block=(id:string):JsonBlock=>({kind:'block',id,name:'div',dynamic:false,isComponent:false,props:[],children:[]});
const english:ClientCatalog={version:1,locale:'en',realm:null,direction:'ltr',messages:{}};
const spanish:ClientCatalog={version:1,locale:'es',realm:null,direction:'ltr',messages:{
 'splicewire-beam-ux::messages.canvas_clipboard_unavailable':{text:'El portapapeles no está disponible en este navegador',sourceLocale:'es'},
}};
afterEach(()=>{cleanup();vi.restoreAllMocks();});
function Harness(){
 const [doc,setDoc]=useState<JsonDoc>([block('a')]);
 const state=useRef({doc});state.current={doc};
 const registry=useMemo(()=>{const r=createWidgetRegistry();r.registerWidget('canvas',((props:CanvasWidgetProps)=><CanvasWidget {...props} value={state.current.doc} readonly={false} onChange={next=>setDoc(next)}/>) as unknown as WidgetResolution);return r;},[]);
 return <CanvasProvider config={{registry:{},MdxView:()=>null,MdxEdit:()=>null}}><FiveRegionEditShell widget="canvas" schema={{type:'object'}} registry={registry} record={doc as unknown as Record<string,unknown>}/></CanvasProvider>;
}
it('re-renders a command failure already showing in the new locale',async()=>{
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:undefined});
 const tree=(catalog:ClientCatalog)=><MessageProvider value={catalog}><Harness/></MessageProvider>;
 const view=render(tree(english));
 fireEvent.click(screen.getByText('div 0'));
 await act(async()=>fireEvent.click(screen.getByText('Copy blocks')));
 expect(screen.getByRole('alert').textContent).toBe('Clipboard is unavailable in this browser');

 view.rerender(tree(spanish));

 expect(screen.getByRole('alert').textContent).toBe('El portapapeles no está disponible en este navegador');
});
