import {useState, type ReactNode} from 'react';
import type {JsonDoc} from '../blockdoc/json';
import type {useLocalSession} from './use-local-session';
import {useBeamUxMessages} from '../messages.js';
import {noticeOf,say,type Notice} from '../message-descriptor.js';

export interface SourceConversion {
 print(body: JsonDoc): Promise<{source:string}>;
 read(source:string, body:JsonDoc): Promise<{body:JsonDoc}>;
}

/**
 * Read-only conversion. Pending text lives in LocalSession, not component state or another save. The text is the
 * page in its File Language (beam JS ADR-0006 d4): `language` names it, `tsx` unless the entry says otherwise.
 */
export function SourceMode({local,conversion,allowed,language='tsx',children}:{local:ReturnType<typeof useLocalSession>;conversion?:SourceConversion;allowed:boolean;language?:string;children:ReactNode}) {
 const m=useBeamUxMessages();
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<Notice|null>(null);
 const run=async(fn:()=>Promise<void>)=>{setBusy(true);setError(null);try{await fn();}catch(e){setError(noticeOf(e,String(e)));}finally{setBusy(false);}};
 const source=local.session?.source;
 if (!allowed || !conversion) {
  if(source) return <div role="alert">{m.t('splicewire-beam-ux::messages.editor_source_unavailable')}<button onClick={local.discardSource}>{m.t('splicewire-beam-ux::messages.editor_discard_pending_source')}</button></div>;
  return <>{children}</>;
 }
 return <>
  {error&&<div role="alert">{say(m,error)}</div>}
  {!source ? <><button disabled={busy || !local.session} onClick={()=>void run(async()=>{
   // Keyboard/programmatic activation need not blur the prose island first.
   // Its ordinary blur handler commits to the same Local Session before printing.
   if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
   await local.flushed();
   const body=local.session!.body as JsonDoc;
   const printed=await conversion.print(body);
   local.beginSource(printed.source,body);
  })}>{m.t('splicewire-beam-ux::messages.editor_source_mode')}</button>{children}</> :
   <section aria-label={m.t('splicewire-beam-ux::messages.editor_source_mode')}>
    <textarea aria-label={m.t('splicewire-beam-ux::messages.editor_language_source', {language:language.toUpperCase()})} value={source.text} disabled={busy} onChange={event=>local.editSource(event.target.value)}/>
    <button disabled={busy} onClick={()=>void run(async()=>{const parsed=await conversion.read(source.text,source.body as JsonDoc);local.applySource(parsed.body);})}>{m.t('splicewire-beam-ux::messages.editor_apply_source')}</button>
    <button disabled={busy} onClick={local.discardSource}>{m.t('splicewire-beam-ux::messages.editor_discard_source')}</button>
   </section>}
 </>;
}
