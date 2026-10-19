// @vitest-environment jsdom
import {render,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {CanvasWidget} from './CanvasWidget';
import {CanvasProvider} from './context';
import fixture from '../editor/default-profile.fixture.json';
import type {BlockdocManifest} from '@schemastud/blockdoc';
const profile = fixture as BlockdocManifest;
vi.mock('./ProseRun',()=>({default:()=> <div data-testid="active-prose"/>}));
afterEach(cleanup);
it.each(['.ve-canvas', '.ve-canvas-layout > div:last-child'])('activates the first-click heading when selection reflow moves click two onto %s',async(target)=>{
 const {container,getByText,getByTestId}=render(<CanvasProvider config={{profile:{...profile,nodes:profile.nodes.filter(node=>! /^[A-Z]/.test(node.name))},registry:{},MdxView:()=>null,MdxEdit:()=>null}}>
  <CanvasWidget value={[{kind:'block',name:'h2',isComponent:false,dynamic:false,props:[],children:[{kind:'text',value:'Heading'}]}]} onChange={()=>{}}/>
 </CanvasProvider>);
 fireEvent.click(getByText('Heading'),{detail:1});
 // The browser proof reproduces Inspector opening and moving h2 up; its second
 // click and dblclick target this canvas ancestor instead of the original h2.
 const canvas=container.querySelector(target)!;
 fireEvent.click(canvas,{detail:2});fireEvent.doubleClick(canvas,{detail:2});
 await waitFor(()=>expect(getByTestId('active-prose')).toBeTruthy());
});
