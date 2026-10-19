import {useMemo,useRef,useCallback} from 'react';
import {BlockdocEditor, type BlockdocEditorHandle} from '@schemastud/blockdoc/react';
import type {JsonDoc} from '../blockdoc/json';
import {fromProse,toProse,proseManifest,type ProseProfile,type ProseNode} from './prose';

/** Loaded only after a text-edit gesture. Commits flow to the owning Local Session. */
export default function ProseRun({value,profile,onChange}:{value:JsonDoc;profile:ProseProfile;onChange:(body:JsonDoc)=>void}) {
 const manifest=useMemo(()=>proseManifest(profile),[profile]);
 const focused=useRef(false);
 const attach=useCallback((handle:BlockdocEditorHandle|null)=>{
  // useEditor can supply its live editor after the parent's mount effect.
  // Focus once on readiness; value/selection updates must not steal focus back.
  if(handle?.editor&&!focused.current){focused.current=true;handle.editor.commands.focus();}
 },[]);
 const emitted=useRef<{json:string;prose:ProseNode;profile:ProseProfile}|null>(null);
 const doc=useMemo(()=>{
  // JsonDoc intentionally omits editing-only/default PM attributes. Rebuilding
  // our own echo through toProse changes those attributes and looks external to
  // blockdoc's exact echo guard, causing setContent and a caret reset per key.
  const previous=emitted.current;
  return previous?.profile===profile&&previous.json===JSON.stringify(value)
   ? previous.prose : toProse(value,profile);
 },[value,profile]);
 return <div data-prose-edit onClick={event=>event.stopPropagation()} onDoubleClick={event=>event.stopPropagation()}>
  <BlockdocEditor ref={attach} manifests={manifest} value={doc as unknown as Record<string,unknown>}
   history={false} palette={false} commitPolicy={{debounceMs:0,onBlur:true}}
   onChange={next=>{
    const prose=next as unknown as ProseNode;
    const body=fromProse(prose,profile);
    emitted.current={json:JSON.stringify(body),prose,profile};
    onChange(body);
   }}/>
 </div>;
}
