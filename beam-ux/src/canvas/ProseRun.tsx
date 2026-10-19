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
 const doc=useMemo(()=>toProse(value,profile),[value,profile]);
 return <div data-prose-edit onClick={event=>event.stopPropagation()} onDoubleClick={event=>event.stopPropagation()}>
  <BlockdocEditor ref={attach} manifests={manifest} value={doc as unknown as Record<string,unknown>}
   history={false} palette={false} commitPolicy={{debounceMs:0,onBlur:true}}
   onChange={next=>onChange(fromProse(next as unknown as ProseNode,profile))}/>
 </div>;
}
