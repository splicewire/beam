import validator from '@rjsf/validator-ajv8';
import type {BlockdocManifest} from '@schemastud/blockdoc';
import {getAt,indexOf,parentOf,insertInto,removeAt,updateAt,isJsonBlock,VOID_TAGS,type JsonDoc,type JsonNode,type JsonBlock} from '../blockdoc/json';
import {blockId,freshBlockIds} from '../blockdoc/identity';
import {assertBlockStyle} from '../blockdoc/style';
import {compileBlockStyle,type StyleRegistry,DEFAULT_STYLE_REGISTRY} from '../blockdoc/style-runtime';
import {validatedEdit,type StyleSelection} from './inspector-style';
import {applyBlockStyle,blockStyleFields} from './block-style';

const compare=(a:string,b:string)=>{
 const x=a.split('.').map(Number),y=b.split('.').map(Number);
 for(let i=0;i<Math.min(x.length,y.length);i++)if(x[i]!==y[i])return x[i]-y[i];
 return x.length-y.length;
};
export function selectionRoots(paths:string[]):string[]{
 const sorted=[...new Set(paths)].sort(compare);
 return sorted.filter(path=>!sorted.some(other=>path.startsWith(other+'.')));
}
export function clipboardText(doc:JsonDoc,paths:string[]):string{
 const nodes=selectionRoots(paths).map(path=>getAt(doc,path));
 if(!nodes.length||nodes.some(node=>!node||!isJsonBlock(node)))throw Error('Select blocks to copy');
 return JSON.stringify({format:'beam-blocks',version:1,nodes});
}
/** Treat clipboard bytes as untrusted, with finite depth/size and no executable decoding. */
export function parseClipboard(text:string):JsonDoc{
 if(text.length>1_000_000)throw Error('Block clipboard is too large');
 const input=JSON.parse(text);let count=0;
 const visit=(node:JsonNode,depth:number)=>{
  if(++count>5000||depth>100||!node||typeof node!=='object')throw Error('Invalid block clipboard');
  if(node.kind==='text'){if(typeof node.value!=='string')throw Error('Invalid text');return;}
  if(node.kind==='opaque'){if(typeof node.source!=='string'||!['map','conditional','ternary','expression','spread'].includes(node.reason))throw Error('Invalid opaque node');return;}
  if(node.kind!=='block'||(typeof node.name!=='string'&&node.name!==null)||typeof node.dynamic!=='boolean'||typeof node.isComponent!=='boolean'||!Array.isArray(node.props)||!Array.isArray(node.children))throw Error('Invalid block');
  for(const prop of node.props)if(!prop||typeof prop.name!=='string'||!['string','number','boolean','boolean-shorthand','expression'].includes(prop.kind)||!['string','number','boolean'].includes(typeof prop.value)&&prop.value!==null)throw Error('Invalid prop');
  if(node.style)assertBlockStyle(node.style);
  node.children.forEach(child=>visit(child,depth+1));
 };
 if(input?.format!=='beam-blocks'||input.version!==1||!Array.isArray(input.nodes)||!input.nodes.length)throw Error('Not a Beam block clipboard');
 input.nodes.forEach((node:JsonNode)=>{visit(node,0);if(!isJsonBlock(node))throw Error('Select blocks');});
 return input.nodes;
}
export function assertPasteProfile(nodes:JsonDoc,profile:BlockdocManifest|undefined,parent:JsonBlock|null,registry:StyleRegistry=DEFAULT_STYLE_REGISTRY){
 const noCode=profile&&'x-admits-code' in profile&&profile['x-admits-code']===false;
 const visit=(node:JsonNode,container:BlockdocManifest['doc']|undefined)=>{
  if(node.kind==='text')return;
  if(node.kind==='opaque'){if(noCode)throw Error('Target profile does not admit code');return;}
  if(node.style)compileBlockStyle(node.style,registry);
  if(!profile){node.children.forEach(child=>visit(child,undefined));return;}
  const declaration=profile.nodes.find(n=>n.name===node.name);
  if(!declaration||!container)throw Error(`Target profile does not admit ${node.name}`);
  if(container.admitsChildCategories!==null&&(!declaration.category||!container.admitsChildCategories?.includes(declaration.category)))throw Error(`Target parent does not admit ${node.name}`);
  if(noCode&&(node.dynamic||node.props.some(p=>p.kind==='expression'||/^on[A-Z]/.test(p.name))))throw Error('Target profile does not admit code');
  // Expressions remain opaque; the save guard is authoritative for dynamic attributes.
  if(!node.props.some(p=>p.kind==='expression')){
   const attrs=Object.fromEntries(node.props.map(p=>[p.name,p.value]));
   const result=validator.validateFormData(attrs,declaration.attrsSchema??{type:'object',properties:{},additionalProperties:false});
   if(result.errors.length)throw Error(`Invalid attributes for ${node.name}: ${result.errors[0].message}`);
  }
  node.children.forEach(child=>visit(child,declaration));
 };
 const declaration=parent?profile?.nodes.find(n=>n.name===parent.name):profile?.doc;
 nodes.forEach(node=>visit(node,declaration));
}
export function pasteBlocks(doc:JsonDoc,parentPath:string,nodes:JsonDoc,profile?:BlockdocManifest,registry?:StyleRegistry):JsonDoc{
 const parent=parentPath?getAt(doc,parentPath):null;
 if(parentPath&&(!parent||!isJsonBlock(parent)))throw Error('Paste destination no longer exists');
 if(parent&&isJsonBlock(parent)&&(parent.isComponent||parent.dynamic||VOID_TAGS.has(parent.name??'')))throw Error('Paste into an editable container');
 assertPasteProfile(nodes,profile,parent as JsonBlock|null,registry);
 let next=doc;let at=parent&&isJsonBlock(parent)?parent.children.length:doc.length;
 for(const node of nodes)next=insertInto(next,parentPath,at++,freshBlockIds(node));
 return next;
}
export function removeBlocks(doc:JsonDoc,paths:string[]):JsonDoc{
 return selectionRoots(paths).sort(compare).reverse().reduce((next,path)=>removeAt(next,path),doc);
}
export function wrapBlocks(doc:JsonDoc,paths:string[],layout:'flex'|'grid',profile?:BlockdocManifest):JsonDoc{
 const roots=selectionRoots(paths);const parent=parentOf(roots[0]??'');
 if(!roots.length||roots.some((path,i)=>parentOf(path)!==parent||indexOf(path)!==indexOf(roots[0])+i))throw Error('Wrap requires contiguous sibling blocks');
 const children=roots.map(path=>getAt(doc,path));
 if(children.some(node=>!node||!isJsonBlock(node)))throw Error('Select blocks to wrap');
 const wrapper:JsonBlock={kind:'block',id:blockId(),name:'div',isComponent:false,dynamic:false,props:[],children:children as JsonDoc,style:{layers:[{declarations:{display:layout}}]}};
 const container=parent?getAt(doc,parent):null;
 assertPasteProfile([wrapper],profile,container as JsonBlock|null);
 return insertInto(removeBlocks(doc,roots),parent,indexOf(roots[0]),wrapper);
}
export function unwrapBlock(doc:JsonDoc,path:string,profile?:BlockdocManifest):JsonDoc{
 const node=getAt(doc,path);if(!node||!isJsonBlock(node)||node.isComponent||node.dynamic)throw Error('Select a container to unwrap');
 const parent=parentOf(path),container=parent?getAt(doc,parent):null;
 assertPasteProfile(node.children,profile,container as JsonBlock|null);
 let next=removeAt(doc,path);let at=indexOf(path);
 for(const child of node.children)next=insertInto(next,parent,at++,child);
 return next;
}
export function editStyles(doc:JsonDoc,paths:string[],selection:StyleSelection,property:string,value:string|null,registry:StyleRegistry):JsonDoc{
 let next=doc;
 for(const path of [...new Set(paths)]){
  const node=getAt(doc,path);if(!node||!isJsonBlock(node))throw Error('Selection no longer exists');
  if(node.isComponent||/^[A-Z]/.test(node.name??''))throw Error('Component does not declare root-style forwarding');
  const style=blockStyleFields(node,{schema:{},attrs:{}}).attrs.bdStyle;
  const changed=applyBlockStyle(node,validatedEdit(style,selection,property,value,registry));
  next=updateAt(next,path,()=>changed);
 }
 return next;
}
