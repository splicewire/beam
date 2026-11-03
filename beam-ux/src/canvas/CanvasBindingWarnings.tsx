import type {JsonDoc} from '../blockdoc/json.js';
import {isJsonBlock} from '../blockdoc/json.js';
import {collectionOffers} from './binding-edit.js';
import {unavailableBindings} from './unavailable-bindings.js';

/** Audience intent and declared Public Read are warnings, never grants or Record reads. */
export function CanvasBindingWarnings({doc,profile,pagePublic,recordCollection}:{doc:JsonDoc;profile:unknown;pagePublic?:boolean|null;recordCollection?:string|null}){
 const unavailable=unavailableBindings(doc,profile,recordCollection);
 const missing=Object.entries(unavailable).length?<section aria-label="Unavailable bindings">{Object.entries(unavailable).map(([path,messages])=><p role="status" data-binding-unavailable={path} key={path}>Node {path||'document'}: {messages.join('; ')}. Rebind or remove this node.</p>)}</section>:null;
 const referenced=new Set<string>(recordCollection?[recordCollection]:[]);
 const stack=[...doc];
 while(stack.length){
  const node=stack.pop()!;
  if(!isJsonBlock(node))continue;
  if(node.repeat?.collection)referenced.add(node.repeat.collection);
  stack.push(...node.children,...Object.values(node.slots??{}).flat(),...(node.repeat?.empty??[]));
 }
 if(!referenced.size||pagePublic===false)return missing;
 if(pagePublic!==true)return <>{missing}<p role="status">Page guest access is unknown. Check its access rules before relying on public Record reads.</p></>;
 const offers=collectionOffers(profile);
 return <>{missing}<section aria-label="Public Read warnings">{[...referenced].map(name=>{
  const offer=offers.find(item=>item.name===name);
  return offer?.publicRead===true?null:<p role="status" key={name}>{name}: {offer?.publicRead===false?'This Collection has no Public Read. Records may be unavailable on this public page.':'Public Read is unknown. Check this Collection’s reader guards before publishing.'}</p>;
 })}</section></>;
}
