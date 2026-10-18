import {expect,it} from 'vitest';
import profile from '../editor/default-profile.fixture.json';
import {toProse,fromProse,proseRuns,proseManifest} from './prose';
import type {JsonBlock,JsonNode} from '../blockdoc/json';
const block=(name:string,id:string,children:JsonNode[],props:JsonBlock['props']=[]):JsonBlock=>({kind:'block',name,id,isComponent:false,dynamic:false,props,children} as JsonBlock);
const text=(value:string):JsonNode=>({kind:'text',value});
it('declares bridge nodes as editing prose without changing the source profile',()=>{
 const manifest=proseManifest(profile);
 expect(manifest['x-prose'].beamInlineRun).toBe('block');
 expect(manifest['x-prose'].beamEmpty).toBe('inline');
 expect(profile['x-prose']).not.toHaveProperty('beamInlineRun');
});
it('round trips inline strong/em/a/code with their exact identities, nesting and props',()=>{
 const doc=[block('p','p1',[text('Hello '),block('strong','s1',[text('bold '),block('em','e1',[text('and italic')])]),text(' '),block('a','a1',[block('code','c1',[text('code')])],[{kind:'string',name:'href',value:'/hello'}])])];
 const editing=toProse(doc,profile);
 expect(editing.content?.[0].content?.some(n=>n.marks?.some(m=>m.type==='strong'))).toBe(true);
 expect(fromProse(editing,profile)).toEqual(doc);
});
it('round trips lists, adjacent text nodes, and empty inline elements without normalizing the document',()=>{
 const doc=[block('ul','u',[block('li','l',[text('one'),text('two'),block('em','empty',[]),block('p','p',[text('nested')])])])];
 expect(fromProse(toProse(doc,profile),profile)).toEqual(doc);
});
it('splits runs at layouts and undeclared components; table cells are runs of one',()=>{
 const doc=[block('p','a',[text('a')]),block('p','b',[text('b')]),block('DemoHero','h',[]),block('p','c',[text('c')])];
 expect(proseRuns(doc,profile)).toEqual([{start:0,end:2},{start:3,end:4}]);
 expect(proseRuns([block('td','d',[text('cell')]),block('td','e',[text('other')])],profile)).toEqual([{start:0,end:1},{start:1,end:2}]);
 expect(()=>toProse([block('DemoHero','h',[])],profile)).toThrow(/not declared/);
});

it('survives the actual blockdoc schema serialization with identical inline ids',async()=>{
 const {assemblePMSchema}=await import('@schemastud/blockdoc');
 const {proseManifest}=await import('./prose');
 const doc=[block('p','p',[text('Hi '),block('strong','s',[block('em','e',[text('bold italic')])]),block('a','a',[text('link')],[{kind:'string',name:'href',value:'/a'}]),block('code','c',[text('inline')])])];
 const schema=assemblePMSchema([proseManifest(profile)]);
 const pm=schema.nodeFromJSON(toProse(doc,profile));
 pm.check();
 expect(fromProse(pm.toJSON(),profile)).toEqual(doc);
});
