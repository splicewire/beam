import React from 'react';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {renderNode} from './TreeRender';
import {CanvasNode} from './CanvasNode';
import {CanvasProvider,type CanvasConfig} from './context';
import {getAt,updateAt,removeAt,insertInto,type JsonBlock,type JsonDoc} from '../blockdoc/json';

const text = (value:string):JsonBlock => ({kind:'block',name:'p',isComponent:false,dynamic:false,props:[],children:[{kind:'text',value}]});
const card:JsonBlock = {kind:'block',name:'Card',isComponent:true,dynamic:false,props:[],children:[text('Default content')],slots:{media:[text('Named content')]}};
const config:CanvasConfig = {registry:{Card: ({children,media})=><article><header>{media as React.ReactNode}</header>{children as React.ReactNode}</article>}, MdxView:()=>null,MdxEdit:()=>null};
describe('component instance subtrees',()=>{
 it('passes default and named slots to the real registered reader',()=>{
  const html=renderToStaticMarkup(<>{renderNode(card,'0',config)}</>);
  expect(html).toContain('<header><p>Named content</p></header>');
  expect(html).toContain('<p>Default content</p>');
 });
 it('renders editable subtrees at their stable paths in the canvas',()=>{
  const html=renderToStaticMarkup(<CanvasProvider config={config}><CanvasNode node={card} path="0" editing={null} dnd={{onDragStart(){},onDragOverNode(){},onDrop(){},onDragEnd(){}}}/></CanvasProvider>);
  expect(html).toContain('data-bd-path="0.slots.media.0"');
  expect(html).toContain('data-bd-path="0.0"');
  expect(html).toContain('Named content');
 });
 it('edits and removes slot content without touching default children',()=>{
  const doc:JsonDoc=[card];
  expect(getAt(doc,'0.slots.media.0')).toEqual(text('Named content'));
  const changed=updateAt(doc,'0.slots.media.0',()=>text('Changed'));
  expect(getAt(changed,'0.slots.media.0')).toEqual(text('Changed'));
  expect(getAt(changed,'0.0')).toEqual(text('Default content'));
  const empty=removeAt(changed,'0.slots.media.0');
  expect(getAt(empty,'0.slots.media.0')).toBeNull();
  const restored=insertInto(empty,'0.slots.media',0,text('Restored'));
  expect(getAt(restored,'0.slots.media.0')).toEqual(text('Restored'));
 });
});
