import {useEffect,useState} from 'react';
import type {CanvasConfig} from './context';
import type {JsonDoc} from '../blockdoc/json';
import type {EntryCanvasBindingsOutputData} from '@splicewire/beam-resources/types/beam-ux';
import {notice as line,type Notice} from '../message-descriptor.js';

type Port=CanvasConfig['bindingPreview'];
interface Result {port:Port;body:string;selection:string|null;data?:EntryCanvasBindingsOutputData;error?:Notice}
/** Each effect owns one response. A retired entry/body/selection can never repaint the new canvas. */
export function useCanvasBindings(port:Port,doc:JsonDoc){
 const body=JSON.stringify(doc);
 const [selected,setSelected]=useState<{entry:string;value:string|null}|null>(null);
 const selection=selected&&selected.entry===port?.entryId?selected.value:null;
 const [result,setResult]=useState<Result|null>(null);
 const current=result&&result.port===port&&result.body===body&&result.selection===selection?result:null;
 useEffect(()=>{
  let live=true;
  if(!port?.resolve)return;
  const controller=new AbortController();
  const timer=setTimeout(()=>{
   void port.resolve!(port.entryId,JSON.parse(body) as JsonDoc,selection,{signal:controller.signal}).then(
    data=>{if(live)setResult({port,body,selection,data});},
    ()=>{if(live)setResult({port,body,selection,error:line('splicewire-beam-ux::messages.canvas_live_preview_failed')});},
   );
  },150);
  return()=>{live=false;clearTimeout(timer);controller.abort();};
 },[port,body,selection]);
 return {
  data:current?.data,
  error:current?.error,
  unavailable:!port?.resolve,
  loading:!!port?.resolve&&!current,
  select:(value:string)=>{if(port)setSelected({entry:port.entryId,value});},
 };
}
export type CanvasBindingsPreview=ReturnType<typeof useCanvasBindings>;
