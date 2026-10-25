import type {CanvasBindingsPreview} from './use-canvas-bindings';
/** The picked Record is preview state only; it never changes the Local Session document. */
export function CanvasRecordPicker({preview}:{preview:CanvasBindingsPreview}){
 const {data}=preview;
 return <section aria-label="Live Record preview">
  {preview.unavailable?<p role="status">Live binding preview unavailable: this host has no addressed author-read port.</p>
   :preview.loading?<p role="status">Reading live Records as you…</p>
   :preview.error?<p role="alert">{preview.error}</p>
   :data?.recordPage?<>
    <label>Preview Record<select aria-label="Preview Record" value={data.selectedValue??''} onChange={event=>preview.select(event.target.value)}>
     {!data.choices.length&&<option value="">No readable Records in this page</option>}
     {data.choices.map(choice=><option key={choice.value} value={choice.value}>{choice.label}</option>)}
    </select></label>
    {data.hasMore&&<p>First page only: at most 25 Records. More Records may exist.</p>}
   </>:<p role="status">Live bindings read as you. Save a Record Page declaration to choose its preview Record.</p>}
 </section>;
}
