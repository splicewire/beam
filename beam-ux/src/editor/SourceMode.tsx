import {useState, type ReactNode} from 'react';
import type {JsonDoc} from '../blockdoc/json';
import type {useLocalSession} from './use-local-session';

export interface SourceConversion {
 print(body: JsonDoc): Promise<{source:string}>;
 read(source:string, body:JsonDoc): Promise<{body:JsonDoc}>;
}

/** Read-only conversion. Pending text lives in LocalSession, not component state or another save. */
export function SourceMode({local,conversion,allowed,children}:{local:ReturnType<typeof useLocalSession>;conversion?:SourceConversion;allowed:boolean;children:ReactNode}) {
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const run=async(fn:()=>Promise<void>)=>{setBusy(true);setError(null);try{await fn();}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setBusy(false);}};
 const source=local.session?.source;
 if (!allowed || !conversion) {
  if(source) return <div role="alert">Source Mode is unavailable for this entry. Your pending text is retained.<button onClick={local.discardSource}>Discard pending source</button></div>;
  return <>{children}</>;
 }
 return <>
  {error&&<div role="alert">{error}</div>}
  {!source ? <><button disabled={busy || !local.session} onClick={()=>void run(async()=>{const body=local.session!.body as JsonDoc;const printed=await conversion.print(body);local.beginSource(printed.source,body);})}>Source Mode</button>{children}</> :
   <section aria-label="Source Mode">
    <textarea aria-label="TSX source" value={source.text} disabled={busy} onChange={event=>local.editSource(event.target.value)}/>
    <button disabled={busy} onClick={()=>void run(async()=>{const parsed=await conversion.read(source.text,source.body as JsonDoc);local.applySource(parsed.body);})}>Apply source</button>
    <button disabled={busy} onClick={local.discardSource}>Discard source</button>
   </section>}
 </>;
}
