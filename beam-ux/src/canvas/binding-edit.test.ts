import {it,expect} from 'vitest';
import {bindingFields,collectionOffers,recordOffer,repeatCollection,bindText,condition,scalarValue} from './binding-edit';
import type {JsonBlock} from '../blockdoc/json';
const block:JsonBlock={kind:'block',name:'p',dynamic:false,isComponent:false,props:[],children:[{kind:'text',value:'Fallback'}]};
it('uses declared scalar schema fields including local refs, never sample Record values',()=>{
 const fields=bindingFields({type:'object',properties:{fields:{$ref:'#/$defs/Fields'},loop:{$ref:'#/$defs/Loop'}},$defs:{Fields:{type:'object',properties:{title:{type:['null','string']},price:{type:'number'},live:{type:'boolean'},rich:{type:'array',items:{type:'object'}}}},Loop:{type:'object',properties:{again:{$ref:'#/$defs/Loop'}}}}});
 expect(fields.map(field=>[field.path,field.type])).toEqual([['fields.title','string'],['fields.price','number'],['fields.live','boolean']]);
});
it('unknown Public Read stays unknown and absent collections cannot be invented',()=>{
 expect(collectionOffers({'x-collections':[{name:'posts',schema:{type:'object'}},{name:'bad'}]})).toEqual([{name:'posts',schema:{type:'object'},publicRead:null,hasRecordPage:false}]);
});
it('preserves fallback and identity while editing repeat, field and condition declarations',()=>{
 const repeated=repeatCollection(block,'posts');expect(repeated.id).toBeTruthy();
 expect(repeatCollection(repeated,'posts')).toBe(repeated);
 const bound=bindText(repeated,'fields.title');expect(bound.children).toEqual([{kind:'text',value:'Fallback',field:'fields.title'}]);
 const gated=condition(bound,{all:[{field:'fields.live',operator:'equals',value:true}]});
 expect(gated.repeat?.query?.limit).toBe(25);expect(gated.when?.all?.[0].value).toBe(true);
 expect(repeatCollection(gated,'').repeat).toBeUndefined();expect(bindText(bound,'').children).toEqual(block.children);
});
it('nearest repeat owns Record fields and relation scopes are explicitly unavailable',()=>{
 const offers=[{name:'posts',schema:{},publicRead:true,hasRecordPage:true},{name:'authors',schema:{},publicRead:false,hasRecordPage:false}];
 expect(recordOffer([{...block,repeat:{collection:'posts'},children:[block]}],'0.0',offers,'authors')?.name).toBe('posts');
 expect(recordOffer([{...block,repeat:{relation:'author'},children:[block]}],'0.0',offers,'posts')).toBeUndefined();
});
it('condition literals preserve scalar types and reject malformed numbers or booleans',()=>{
 expect(scalarValue('false',{path:'live',type:'boolean',label:'Live'})).toBe(false);
 expect(()=>scalarValue('yes',{path:'live',type:'boolean',label:'Live'})).toThrow();
 expect(()=>scalarValue('1.5',{path:'qty',type:'integer',label:'Qty'})).toThrow();
 expect(()=>condition(block,{all:[{field:'__proto__.x',operator:'is set'}]})).toThrow();
});
