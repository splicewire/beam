import type {JsonDoc} from '../blockdoc/json.js';
import {isJsonBlock} from '../blockdoc/json.js';
import {collectionOffers} from './binding-edit.js';

/** Audience intent and declared Public Read are warnings, never grants or Record reads. */
export function CanvasBindingWarnings({doc,profile,pagePublic,recordCollection}:{doc:JsonDoc;profile:unknown;pagePublic?:boolean|null;recordCollection?:string|null}){
 const referenced=new Set<string>(recordCollection?[recordCollection]:[]);
 const stack=[...doc];
 while(stack.length){
  const node=stack.pop()!;
  if(!isJsonBlock(node))continue;
  if(node.repeat?.collection)referenced.add(node.repeat.collection);
  stack.push(...node.children,...Object.values(node.slots??{}).flat(),...(node.repeat?.empty??[]));
 }
 if(!referenced.size||pagePublic===false)return null;
 if(pagePublic!==true)return <p role="status">Page guest access is unknown. Check its access rules before relying on public Record reads.</p>;
 const offers=collectionOffers(profile);
 return <section aria-label="Public Read warnings">{[...referenced].map(name=>{
  const offer=offers.find(item=>item.name===name);
  return offer?.publicRead===true?null:<p role="status" key={name}>{name}: {offer?.publicRead===false?'This Collection has no Public Read. Records may be unavailable on this public page.':'Public Read is unknown. Check this Collection’s reader guards before publishing.'}</p>;
 })}</section>;
}
