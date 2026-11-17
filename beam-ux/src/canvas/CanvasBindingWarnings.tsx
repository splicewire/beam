import type {JsonDoc} from '../blockdoc/json.js';
import {isJsonBlock} from '../blockdoc/json.js';
import {collectionOffers} from './binding-edit.js';
import {unavailableBindings} from './unavailable-bindings.js';
import { useBeamUxMessages } from '../messages.js';

/** Audience intent and declared Public Read are warnings, never grants or Record reads. */
export function CanvasBindingWarnings({doc,profile,pagePublic,recordCollection}:{doc:JsonDoc;profile:unknown;pagePublic?:boolean|null;recordCollection?:string|null}){
 const m = useBeamUxMessages();
 const unavailable=unavailableBindings(doc,profile,recordCollection);
 const missing=Object.entries(unavailable).length?<section aria-label={m.t('splicewire-beam-ux::messages.canvas_unavailable_bindings')}>{Object.entries(unavailable).map(([path,messages])=><p role="status" data-binding-unavailable={path} key={path}>{m.t('splicewire-beam-ux::messages.canvas_binding_unavailable_node',{path:path||m.t('splicewire-beam-ux::messages.canvas_binding_document'),messages:messages.join('; ')})}</p>)}</section>:null;
 const referenced=new Set<string>(recordCollection?[recordCollection]:[]);
 const stack=[...doc];
 while(stack.length){
  const node=stack.pop()!;
  if(!isJsonBlock(node))continue;
  if(node.repeat?.collection)referenced.add(node.repeat.collection);
  stack.push(...node.children,...Object.values(node.slots??{}).flat(),...(node.repeat?.empty??[]));
 }
 if(!referenced.size||pagePublic===false)return missing;
 if(pagePublic!==true)return <>{missing}<p role="status">{m.t('splicewire-beam-ux::messages.canvas_guest_access_unknown')}</p></>;
 const offers=collectionOffers(profile);
 return <>{missing}<section aria-label={m.t('splicewire-beam-ux::messages.canvas_public_read_warnings')}>{[...referenced].map(name=>{
  const offer=offers.find(item=>item.name===name);
  return offer?.publicRead===true?null:<p role="status" key={name}>{m.t('splicewire-beam-ux::messages.canvas_collection_public_read',{name,state:offer?.publicRead===false?m.t('splicewire-beam-ux::messages.canvas_public_read_none'):m.t('splicewire-beam-ux::messages.canvas_public_read_unknown')})}</p>;
 })}</section></>;
}
