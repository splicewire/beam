// @vitest-environment jsdom
import {render,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import {CanvasWidget} from './CanvasWidget';
import {CanvasProvider} from './context';
import {CanvasSiblings} from './CanvasSiblings';
import fixture from '../editor/default-profile.fixture.json';
import type {BlockdocManifest} from '@schemastud/blockdoc';
const profile = fixture as BlockdocManifest;
vi.mock('./ProseRun',()=>({default:()=> <div data-testid="active-prose"/>}));
afterEach(cleanup);
it('keeps component prop references outside the literal prose editor',()=>{
 const onEditProse=vi.fn();
 const {queryByTestId,getByText}=render(<CanvasProvider config={{profile:{...profile,nodes:profile.nodes.filter(node=>! /^[A-Z]/.test(node.name))},registry:{},componentProps:{title:'Instance title'}}}>
  <CanvasSiblings nodes={[{kind:'block',name:'p',isComponent:false,dynamic:false,props:[],children:[{kind:'text',value:'Fallback',prop:'title'}]}]} parent="" editing="0" onEditProse={onEditProse} dnd={{onDragStart:vi.fn(),onDragOverNode:vi.fn(),onDrop:vi.fn(),onDragEnd:vi.fn()}}/>
 </CanvasProvider>);
 expect(queryByTestId('active-prose')).toBeNull();
 expect(getByText('Instance title')).toBeTruthy();
 expect(onEditProse).not.toHaveBeenCalled();
});
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
