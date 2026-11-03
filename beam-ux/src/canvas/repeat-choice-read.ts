import {assertFieldPath,type RepeatQuery} from '../blockdoc/bindings';
import {getAt,isJsonBlock,updateAt,type JsonDoc} from '../blockdoc/json';
import {bindingFields,type CollectionOffer} from './binding-edit';
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==='object'&&!Array.isArray(value);

/** Read-only projection through the existing addressed author reader; never an editor command. */
export function repeatChoiceRead(doc:JsonDoc,path:string,offer:CollectionOffer){
 const node=getAt(doc,path);
 if(!node||!isJsonBlock(node)||!node.repeat?.collection||!node.id)return null;
 // Nested Record scopes belong to declared relations, whose query contract does not offer ids.
 let parent=path;
 while(parent.includes('.')){
  parent=parent.slice(0,parent.lastIndexOf('.'));
  const ancestor=getAt(doc,parent);
  if(ancestor&&isJsonBlock(ancestor)&&ancestor.repeat)return null;
 }
 const fields=bindingFields(offer.schema).filter(field=>field.path.startsWith('fields.')&&field.type==='string');
 const properties=object(offer.schema.properties)?offer.schema.properties:{};
 const fieldSchema=object(properties.fields)?properties.fields:{};
 const metadata=object(fieldSchema['x-beam-collection'])?fieldSchema['x-beam-collection']:{};
 const named=typeof metadata.nameField==='string'?`fields.${metadata.nameField}`:null;
 const label=fields.find(field=>field.path===named)??fields.find(field=>['fields.title','fields.name'].includes(field.path))??fields[0];
 if(!label)return null;
 assertFieldPath(label.path);
 const body=updateAt(doc,path,current=>{
  if(!isJsonBlock(current)||!current.repeat)return current;
  const saved:RepeatQuery=current.repeat.query??{};
  const {ids:_,...query}=saved;
  return {...current,repeat:{...current.repeat,query:{...query,limit:100}},
   // Conditions are declared scalar projection slots on every block, including void/sealed
   // nodes. id is always set; this request-only projection leaves authored content untouched.
   when:{any:[{field:'id',operator:'is set'},{field:label.path,operator:'is set'}]}};
 });
 return {body,id:node.id,label:label.path};
}

export function recordChoiceValue(record:Record<string,unknown>,path:string):unknown{
 return path.split('.').reduce<unknown>((value,key)=>value&&typeof value==='object'?Reflect.get(value,key):undefined,record);
}
