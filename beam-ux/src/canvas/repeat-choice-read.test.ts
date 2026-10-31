import {it,expect} from 'vitest';
import {repeatChoiceRead} from './repeat-choice-read';
import {isJsonBlock,type JsonDoc} from '../blockdoc/json';
import type {RepeatQuery} from '../blockdoc/bindings';
const offer={name:'posts',schema:{type:'object',properties:{fields:{type:'object','x-beam-collection':{nameField:'headline'},properties:{title:{type:'string'},headline:{type:'string'}}}}},publicRead:false,hasRecordPage:false};
it('projects the owning name field on a void node without replacing authored props, children, conditions or selection',()=>{
 const query:RepeatQuery={ids:[],filter:{title:'named'},sort:'-title',limit:5};
 const doc:JsonDoc=[{kind:'block',name:'img',id:'photo',dynamic:false,isComponent:false,props:[{kind:'string',name:'src',value:'/photo.jpg'}],children:[],
  when:{all:[{field:'fields.title',operator:'is set'}]},repeat:{collection:'posts',query}}];
 const original=JSON.stringify(doc);const read=repeatChoiceRead(doc,'0',offer);
 expect(read?.label).toBe('fields.headline');expect(JSON.stringify(doc)).toBe(original);
 const node=read?.body[0];expect(node&&isJsonBlock(node)&&node.name).toBe('img');
 expect(node&&isJsonBlock(node)&&node.children).toEqual([]);
 expect(node&&isJsonBlock(node)&&node.props).toEqual([{kind:'string',name:'src',value:'/photo.jpg'}]);
 expect(node&&isJsonBlock(node)&&node.repeat?.query).toEqual({filter:{title:'named'},sort:'-title',limit:100});
});
it('does not offer handpicked ids in a nested Record scope',()=>{
 const doc:JsonDoc=[{kind:'block',name:'div',id:'outer',dynamic:false,isComponent:false,props:[],repeat:{collection:'posts'},children:[
  {kind:'block',name:'p',id:'inner',dynamic:false,isComponent:false,props:[],children:[],repeat:{collection:'posts'}}]}];
 expect(repeatChoiceRead(doc,'0.children.0',offer)).toBeNull();
});
