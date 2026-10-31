import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import type {JsonBlock,JsonDoc} from '../blockdoc/json.js';
import {unavailableBindings} from './unavailable-bindings.js';
import {CanvasOutline} from './CanvasOutline.js';
import {CanvasRuntimeProvider} from './context.js';
import type {BlockdocManifest} from '@schemastud/blockdoc';
import {CanvasBindingWarnings} from './CanvasBindingWarnings.js';

const block=(children:JsonDoc=[]):JsonBlock=>({kind:'block',name:'div',isComponent:false,dynamic:false,props:[],children});
const profile={'x-collections':[
 {name:'posts',schema:{properties:{id:{type:'string'},fields:{$ref:'#/$defs/Fields'}},$defs:{Fields:{$id:'https://tenant.test/posts/2',properties:{title:{type:'string'},authorIds:{type:'array',items:{type:'string'},'x-beam-relation':{collection:'https://tenant.test/authors'}}}}}},hasRecordPage:true},
 {name:'authors',schema:{properties:{fields:{$id:'https://tenant.test/authors/1',properties:{name:{type:'string'}}}}}},
]};
const body:JsonDoc=[{...block([{kind:'text',value:'',field:'fields.retired'}, {kind:'text',value:'',field:'fields.title'}]),id:'rows',repeat:{collection:'posts'},
 slots:{caption:[{kind:'text',value:'',field:'fields.retired'}]}}];
describe('current-profile unavailable binding marks',()=>{
 it('marks idless text and slots at distinct locations without modifying the authored tree',()=>{
  const before=JSON.stringify(body);
  expect(unavailableBindings(body,profile)).toEqual({'0.0':['Field fields.retired is unavailable'],'0.slots.caption.0':['Field fields.retired is unavailable']});
  expect(JSON.stringify(body)).toBe(before);
 });
 it('uses the root Record Page Collection and declared to-many relation target, not the nearest name',()=>{
  const doc:JsonDoc=[{kind:'text',value:'',field:'fields.title'},
   {...block([{kind:'text',value:'',field:'fields.name'}, {kind:'text',value:'',field:'fields.title'}]),repeat:{relation:'authorIds'}}];
  expect(unavailableBindings(doc,profile,'posts')).toEqual({'1.1':['Field fields.title is unavailable']});
 });
 it('keeps Repeat.empty in the outer scope and does not invent a missing template scope',()=>{
  const doc:JsonDoc=[{...block([{kind:'text',value:'',field:'fields.retired'}]),repeat:{collection:'held',empty:[{kind:'text',value:'',field:'fields.title'}]}}];
  expect(unavailableBindings(doc,profile,'authors')).toEqual({'0':['Collection held is unavailable'],'0.repeat.empty.0':['Field fields.title is unavailable']});
 });
 it('does not mistake an unavailable profile or unresolved reference for proof of a field drop',()=>{
  expect(unavailableBindings(body,undefined)).toEqual({});
  expect(unavailableBindings(body,{'x-collections':[{name:'posts',schema:{$ref:'#/$defs/absent'}}]})).toEqual({});
 });
 it('marks current missing filter/sort aliases but does not guess a separate variant vocabulary',()=>{
  const doc:JsonDoc=[{...block(),repeat:{collection:'posts',query:{filter:{retired:'literal'},sort:'-retired'}}}];
  expect(unavailableBindings(doc,profile)).toEqual({'0':['Filter retired is unavailable','Sort retired is unavailable']});
  doc[0]={...block(),repeat:{collection:'posts',query:{filter:{retired:'literal'},filterVariant:'other-owner'}}};
  expect(unavailableBindings(doc,profile)).toEqual({});
 });
 it('marks the actual outline block that owns an unavailable idless text node',()=>{
  const manifest:BlockdocManifest={profile:'content',version:1,doc:{admitsChildCategories:['html']},nodes:[],...profile};
  const html=renderToStaticMarkup(<CanvasRuntimeProvider config={{registry:{},profile:manifest}}><CanvasOutline doc={body} onSelect={()=>{throw Error('Rendering must not select');}} onHide={()=>{throw Error('Rendering must not edit');}}/></CanvasRuntimeProvider>);
  expect(html).toContain('data-binding-unavailable="0.0"');
  expect(html).toContain('Field fields.retired is unavailable');
 });
 it('renders truthful selectable-location warnings even on a private page, without claiming historical confirmation',()=>{
  const html=renderToStaticMarkup(<CanvasBindingWarnings doc={body} profile={profile} pagePublic={false}/>);
  expect(html).toContain('aria-label="Unavailable bindings"');
  expect(html).toContain('data-binding-unavailable="0.0"');
  expect(html).toContain('Field fields.retired is unavailable');
  expect(html).not.toContain('was dropped');
  expect(html).not.toContain('Public Read warnings');
 });
});
