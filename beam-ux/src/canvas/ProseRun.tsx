import {useMemo,useRef,useEffect} from 'react';
import {BlockdocEditor, type BlockdocEditorHandle} from '@schemastud/blockdoc/react';
import type {JsonDoc} from '../blockdoc/json';
import {fromProse,toProse,proseManifest,type ProseProfile,type ProseNode} from './prose';

/** Loaded only after a text-edit gesture. Commits flow to the owning Local Session. */
export default function ProseRun({value,profile,onChange}:{value:JsonDoc;profile:ProseProfile;onChange:(body:JsonDoc)=>void}) {
 const manifest=useMemo(()=>proseManifest(profile),[profile]);
 const ref=useRef<BlockdocEditorHandle>(null);
 const doc=useMemo(()=>toProse(value,profile),[value,profile]);
 useEffect(()=>{ref.current?.view?.focus();},[]);
 return <div data-prose-edit onClick={event=>event.stopPropagation()} onDoubleClick={event=>event.stopPropagation()}>
  <BlockdocEditor ref={ref} manifests={manifest} value={doc as unknown as Record<string,unknown>}
   history={false} palette={false} commitPolicy={{debounceMs:0,onBlur:true}}
   onChange={next=>onChange(fromProse(next as unknown as ProseNode,profile))}/>
 </div>;
}
