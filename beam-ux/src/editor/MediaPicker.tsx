import {useEffect,useRef,useState} from 'react';
import type {EntryImageData,EntryImageLibraryData} from '../generated/entry-images';
import {useBeamUxMessages} from '../messages.js';
import {notice,noticeOf,say,type Notice} from '../message-descriptor.js';

/** The owner binds these closures to ONE server-addressed Entry. No morph, disk or remote fetch input. */
export interface EntryImageLibrary {
  list():Promise<EntryImageLibraryData>;
  upload(file:File):Promise<EntryImageData>;
}

/** Choosing changes the Local Session only; the normal draft/publish path persists the value. */
export function MediaPicker({label,library,onChoose}:{label:string;library:EntryImageLibrary;onChoose:(url:string)=>void}) {
  const m=useBeamUxMessages();
  const [open,setOpen]=useState(false);
  const [items,setItems]=useState<EntryImageData[]|null>(null);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<Notice|null>(null);
  const sequence=useRef(0);
  const choose=useRef(onChoose);
  choose.current=onChoose;
  const trigger=useRef<HTMLButtonElement>(null);
  useEffect(()=>()=>{sequence.current++;},[]);
  const close=()=>{sequence.current++;setOpen(false);setBusy(false);trigger.current?.focus();};
  const load=async()=>{
    const request=++sequence.current;setOpen(true);setBusy(true);setItems(null);setError(null);
    try {const result=await library.list();if(request===sequence.current)setItems(result.items);}
    catch(reason){if(request===sequence.current)setError(noticeOf(reason,notice('splicewire-beam-ux::messages.editor_images_load_failed')));}
    finally{if(request===sequence.current)setBusy(false);}
  };
  const upload=async(file:File)=>{
    const request=++sequence.current;setBusy(true);setError(null);
    try {const image=await library.upload(file);if(request===sequence.current){choose.current(image.url);close();}}
    catch(reason){if(request===sequence.current)setError(noticeOf(reason,notice('splicewire-beam-ux::messages.editor_image_upload_failed')));}
    finally{if(request===sequence.current)setBusy(false);}
  };
  return <div>
    <button ref={trigger} type="button" aria-expanded={open} onClick={()=>{if(open)close();else void load();}}>{m.t('splicewire-beam-ux::messages.editor_choose_image', {label})}</button>
    {open&&<fieldset aria-label={m.t('splicewire-beam-ux::messages.editor_image_library', {label})} style={{maxHeight:280,overflow:'auto'}}>
      <legend>{m.t('splicewire-beam-ux::messages.editor_image_library', {label})}</legend>
      {busy&&<p role="status">{m.t('splicewire-beam-ux::messages.editor_loading_images')}</p>}
      {error&&<p role="alert">{say(m,error)}</p>}
      {items!==null&&items.length===0&&<p>{m.t('splicewire-beam-ux::messages.editor_no_images')}</p>}
      {items?.map(image=><button key={image.id} type="button" disabled={busy} onClick={()=>{choose.current(image.url);close();}}>
        <img src={image.url} alt="" width={64} height={48} style={{objectFit:'contain'}}/>{m.t('splicewire-beam-ux::messages.editor_use_image', {name:image.name})}
      </button>)}
      <label>{m.t('splicewire-beam-ux::messages.editor_upload_image', {label})}<input type="file" disabled={busy} accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
        onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file)void upload(file);}}/></label>
      <p>{m.t('splicewire-beam-ux::messages.editor_image_formats')}</p>
      <button type="button" onClick={close}>{m.t('splicewire-beam-ux::messages.editor_cancel_image')}</button>
    </fieldset>}
  </div>;
}
