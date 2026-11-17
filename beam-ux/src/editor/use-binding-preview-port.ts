import {useMemo,useRef} from 'react';
import type {UxBuilderClient} from '../types';
import type {CanvasConfig} from '../canvas/context';
import {NoticeError,notice as line} from '../message-descriptor.js';
/** Getter-based adapters may create a new bound function each render. Address/actor retire reads. */
export function useBindingPreviewPort(client:UxBuilderClient,id:string|null,userId:string|null|undefined,enabled:boolean,collection?:string|null){
 const latest=useRef(client);latest.current=client;
 const available=enabled&&!!id&&!!client.canvasBindings;
 return useMemo<NonNullable<CanvasConfig['bindingPreview']>>(()=>({
  entryId:id??'',recordCollection:collection??null,
  resolve:available?(entry,body,value,options)=>{
   const read=latest.current.canvasBindings;
   if(!read)return Promise.reject(new NoticeError(line('splicewire-beam-ux::messages.editor_binding_preview_unavailable')));
   return read.call(latest.current,entry,body,value,options);
  }:undefined,
 }),[id,userId,available,collection]);
}
