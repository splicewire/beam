import type {JsonDoc} from '../blockdoc/json.js';
import {isJsonBlock} from '../blockdoc/json.js';
import {assertFieldPath} from '../blockdoc/bindings.js';
import {collectionOffers, type CollectionOffer} from './binding-edit.js';

const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
/** Undefined means the declaration cannot be resolved, not proof that a property is absent. */
function declaration(root:Record<string,unknown>,path:string):Record<string,unknown>|false|undefined {
 const resolve=(raw:unknown):Record<string,unknown>|undefined=>{
  if(!object(raw))return undefined;
  let node=raw;const seen=new Set<string>();
  while(typeof node.$ref==='string'){
   const ref=node.$ref;if(!ref.startsWith('#/')||seen.has(ref))return undefined;
   seen.add(ref);let target:unknown=root;
   for(const part of ref.slice(2).split('/'))target=object(target)?target[part.replaceAll('~1','/').replaceAll('~0','~')]:undefined;
   if(!object(target))return undefined;
   const {$ref:_,...own}=node;node={...target,...own};
  }
  return node;
 };
 let node:Record<string,unknown>|undefined=root;
 for(const part of path.split('.')){
  node=resolve(node);if(!node)return undefined;
  if(!object(node.properties)||!Object.hasOwn(node.properties,part))return false;
  node=resolve(node.properties[part]);
 }
 return node;
}

function queryVocabulary(schema:Record<string,unknown>):{filter:Set<string>;sort:Set<string>}|undefined {
 const names={filter:new Set<string>(),sort:new Set<string>()};let complete=true;
 const walk=(path:string,depth:number)=>{
  const field=declaration(schema,path);if(!field||depth>24){complete=false;return;}
  for(const key of ['filter','sort'] as const){
   const value=field[`x-${key}`];if(object(value)&&typeof value.name==='string')names[key].add(value.name);
  }
  if(object(field.properties))for(const key of Object.keys(field.properties))walk(`${path}.${key}`,depth+1);
 };
 walk('fields',0);return complete?names:undefined;
}

/** Current declarations only: marks unavailability, never guesses whether an unknown field once existed. */
export function unavailableBindings(doc:JsonDoc,profile:unknown,recordCollection?:string|null):Record<string,string[]> {
 if(!object(profile)||!Array.isArray(profile['x-collections']))return {};
 const offers=collectionOffers(profile);const out:Record<string,string[]>={};
 const add=(path:string,message:string)=>{(out[path]??=[]).push(message);};
 const walk=(nodes:JsonDoc,parent:string,scope:CollectionOffer|undefined)=>nodes.forEach((node,index)=>{
  const path=parent?`${parent}.${index}`:String(index);let current=scope;
  if(isJsonBlock(node)&&node.repeat){
   if(node.repeat.collection){
    current=offers.find(offer=>offer.name===node.repeat?.collection);
    if(!current)add(path,`Collection ${node.repeat.collection} is unavailable`);
   }else if(node.repeat.relation){
    const field=scope?declaration(scope.schema,`fields.${node.repeat.relation}`):undefined;
    const edge=field&&object(field['x-beam-relation'])?field['x-beam-relation']:undefined;
    const stem=field&&field.type==='array'&&object(field.items)&&field.items.type==='string'?edge?.collection:undefined;
    current=typeof stem==='string'?offers.find(offer=>{
     const fields=declaration(offer.schema,'fields');
     return fields&&typeof fields.$id==='string'&&fields.$id.slice(0,fields.$id.lastIndexOf('/'))===stem;
    }):undefined;
    if(!current)add(path,`Relation ${node.repeat.relation} schema is unavailable`);
   }
   const query=node.repeat.query;
   const vocabulary=current&&!query?.filterVariant?queryVocabulary(current.schema):undefined;
   if(query&&vocabulary){
    for(const name of Object.keys(query.filter??{}))if(!vocabulary.filter.has(name))add(path,`Filter ${name} is unavailable`);
    for(const raw of query.sort?.split(',')??[]){
     const name=raw.trim().replace(/^-/, '');if(name&&!vocabulary.sort.has(name))add(path,`Sort ${name} is unavailable`);
    }
   }
   walk(node.repeat.empty??[],`${path}.repeat.empty`,scope);
  }
  const paths=node.kind==='text'&&node.field?[node.field]:[];
  if(isJsonBlock(node)){
   for(const prop of node.props)if(prop.kind==='field'&&typeof prop.value==='string')paths.push(prop.value);
   for(const rule of node.when?.all??node.when?.any??[])paths.push(rule.field);
  }
  for(const field of new Set(paths)){
   try{assertFieldPath(field);}catch{add(path,`Field ${field} is unavailable`);continue;}
   if(current&&field==='url'){if(!current.hasRecordPage)add(path,'Field url is unavailable');}
   else if(current&&declaration(current.schema,field)===false)add(path,`Field ${field} is unavailable`);
  }
  if(isJsonBlock(node)){
   walk(node.children,path,current);
   for(const [name,children] of Object.entries(node.slots??{}))walk(children,`${path}.slots.${name}`,current);
  }
 });
 const root=offers.find(offer=>offer.name===recordCollection);
 if(recordCollection&&!root)add('',`Record Page Collection ${recordCollection} is unavailable`);
 walk(doc,'',root);return out;
}
