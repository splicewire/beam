import {assertCondition,assertRepeat,type DataCondition} from '../blockdoc/bindings.js';
import {getAt,isJsonBlock,type JsonBlock,type JsonDoc} from '../blockdoc/json.js';

export interface CollectionOffer {name:string;schema:Record<string,unknown>;publicRead:boolean|null;hasRecordPage:boolean}
export interface EventOffer {name:string;source:'package'|'host';parameters:string[]}
export interface BindingField {path:string;type:string;format?:string;label:string;filterName?:string;sortName?:string}
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);
export function eventOffers(profile:unknown):EventOffer[]{
 if(!object(profile)||!Array.isArray(profile['x-events']))return [];
 return profile['x-events'].flatMap((event:unknown)=>object(event)&&typeof event.name==='string'&&['package','host'].includes(String(event.source))&&Array.isArray(event.parameters)
  ?[{name:event.name,source:event.source as EventOffer['source'],parameters:event.parameters.filter((parameter:unknown):parameter is string=>typeof parameter==='string')}]:[]);
}
export function collectionOffers(profile:unknown):CollectionOffer[]{
 if(!object(profile)||!Array.isArray(profile['x-collections']))return [];
 return profile['x-collections'].flatMap((offer:unknown)=>object(offer)&&typeof offer.name==='string'&&object(offer.schema)
  ?[{name:offer.name,schema:offer.schema,publicRead:typeof offer.publicRead==='boolean'?offer.publicRead:null,hasRecordPage:offer.hasRecordPage===true}]:[]);
}
export function bindingFields(schema:Record<string,unknown>):BindingField[]{
 const fields:BindingField[]=[];
 const walk=(raw:unknown,path:string,refs:string[],depth:number)=>{
  if(!object(raw)||depth>12)return;
  let node=raw;
  if(typeof node.$ref==='string'){
   if(!node.$ref.startsWith('#/')||refs.includes(node.$ref))return;
   let target:unknown=schema;
   for(const part of node.$ref.slice(2).split('/'))target=object(target)?target[part.replaceAll('~1','/').replaceAll('~0','~')]:undefined;
   if(!object(target))return;
   refs=[...refs,node.$ref];node={...target,...node};
  }
  const types=typeof node.type==='string'?[node.type]:Array.isArray(node.type)?node.type:[];
  const type=types.find((type:unknown)=>typeof type==='string'&&type!=='null');
  if(path&&typeof type==='string'&&['string','number','integer','boolean'].includes(type))fields.push({path,type,format:typeof node.format==='string'?node.format:undefined,label:typeof node.title==='string'?node.title:path,filterName:object(node['x-filter'])&&typeof node['x-filter'].name==='string'?node['x-filter'].name:undefined,sortName:object(node['x-sort'])&&typeof node['x-sort'].name==='string'?node['x-sort'].name:undefined});
  if(object(node.properties))for(const [key,value] of Object.entries(node.properties)){
   if(['__proto__','prototype','constructor'].includes(key))continue;
   walk(value,path?`${path}.${key}`:key,refs,depth+1);
  }
 };
 walk(schema,'',[],0);return fields;
}
export function recordOffer(doc:JsonDoc,path:string,offers:CollectionOffer[],rootCollection?:string|null):CollectionOffer|undefined{
 let current=path;
 while(current){
  const node=getAt(doc,current);
  if(node&&isJsonBlock(node)&&node.repeat){
   if(node.repeat.relation)return undefined;
   return offers.find(offer=>offer.name===node.repeat?.collection);
  }
  const dot=current.lastIndexOf('.');current=dot<0?'':current.slice(0,dot);
 }
 return offers.find(offer=>offer.name===rootCollection);
}
export function repeatCollection(node:JsonBlock,collection:string):JsonBlock{
 if(node.repeat?.collection===collection)return node;
 if(!collection){const {repeat:_,...rest}=node;return rest;}
 const repeat={collection,query:{limit:25},empty:node.repeat?.empty??[]};assertRepeat(repeat);
 return {...node,id:node.id??crypto.randomUUID(),repeat};
}
export function bindText(node:JsonBlock,field:string):JsonBlock{
 const first=node.children.findIndex(child=>child.kind==='text');
 if(first<0)return field?{...node,children:[...node.children,{kind:'text',value:'',field}]}:node;
 return {...node,children:node.children.map((child,index)=>{
  if(index!==first||child.kind!=='text')return child;
  const {field:_,...text}=child;return field?{...text,field}:text;
 })};
}
export function scalarValue(value:string,field?:BindingField):string|number|boolean{
 if(field?.type==='boolean'){if(!['true','false'].includes(value))throw Error('Enter true or false');return value==='true';}
 if(field?.type==='number'||field?.type==='integer'){
  const number=Number(value);if(!Number.isFinite(number)||(field.type==='integer'&&!Number.isInteger(number)))throw Error('Enter a finite '+field.type);
  return number;
 }
 return value;
}
export function condition(node:JsonBlock,value:DataCondition|undefined):JsonBlock{
 if(value)assertCondition(value);
 return {...node,when:value};
}
