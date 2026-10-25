import {useEffect,useRef,useState} from 'react';
import type {EntryImageData,EntryImageLibraryData} from '../generated/entry-images';

/** The owner binds these closures to ONE server-addressed Entry. No morph, disk or remote fetch input. */
export interface EntryImageLibrary {
  list():Promise<EntryImageLibraryData>;
  upload(file:File):Promise<EntryImageData>;
}

/** Choosing changes the Local Session only; the normal draft/publish path persists the value. */
export function MediaPicker({label,library,onChoose}:{label:string;library:EntryImageLibrary;onChoose:(url:string)=>void}) {
  const [open,setOpen]=useState(false);
  const [items,setItems]=useState<EntryImageData[]|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const sequence=useRef(0);
  const trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>()=>{sequence.current++;},[]);
  const close=()=>{sequence.current++;setOpen(false);setBusy(false);trigger.current?.focus();};
  const load=async()=>{
    const request=++sequence.current;setOpen(true);setBusy(true);setItems(null);setError(null);
    try {const result=await library.list();if(request===sequence.current)setItems(result.items);}
    catch(reason){if(request===sequence.current)setError(reason instanceof Error?reason.message:'Could not read this entry’s images.');}
    finally{if(request===sequence.current)setBusy(false);}
  };
  const upload=async(file:File)=>{
    const request=++sequence.current;setBusy(true);setError(null);
    try {const image=await library.upload(file);if(request===sequence.current){onChoose(image.url);close();}}
    catch(reason){if(request===sequence.current)setError(reason instanceof Error?reason.message:'Could not upload image.');}
    finally{if(request===sequence.current)setBusy(false);}
  };
  return <div>
    <button ref={trigger} type="button" aria-expanded={open} onClick={()=>{if(open)close();else void load();}}>Choose image for {label}</button>
    {open&&<fieldset aria-label={`${label} image library`} style={{maxHeight:280,overflow:'auto'}}>
      <legend>{label} image library</legend>
      {busy&&<p role="status">Loading images…</p>}
      {error&&<p role="alert">{error}</p>}
      {items!==null&&items.length===0&&<p>No images for this entry yet.</p>}
      {items?.map(image=><button key={image.id} type="button" disabled={busy} onClick={()=>{onChoose(image.url);close();}}>
        <img src={image.url} alt="" width={64} height={48} style={{objectFit:'contain'}}/>Use {image.name}
      </button>)}
      <label>Upload image for {label}<input type="file" disabled={busy} accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
        onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void upload(file);}}/></label>
      <p>JPEG, PNG, GIF, WebP or AVIF, up to 8 MiB.</p>
      <button type="button" onClick={close}>Cancel image choice</button>
    </fieldset>}
  </div>;
}
