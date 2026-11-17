import type {CanvasBindingsPreview} from './use-canvas-bindings';
import { useBeamUxMessages } from '../messages.js';
/** The picked Record is preview state only; it never changes the Local Session document. */
export function CanvasRecordPicker({preview}:{preview:CanvasBindingsPreview}){
 const m = useBeamUxMessages();
 const {data}=preview;
 return <section aria-label={m.t('splicewire-beam-ux::messages.canvas_live_record_preview')}>
  {preview.unavailable?<p role="status">{m.t('splicewire-beam-ux::messages.canvas_live_preview_unavailable')}</p>
   :preview.loading?<p role="status">{m.t('splicewire-beam-ux::messages.canvas_reading_live_records')}</p>
   :preview.error?<p role="alert">{preview.error}</p>
   :data?.recordPage?<>
    <label>{m.t('splicewire-beam-ux::messages.canvas_preview_record')}<select aria-label={m.t('splicewire-beam-ux::messages.canvas_preview_record')} value={data.selectedValue??''} onChange={event=>preview.select(event.target.value)}>
     {!data.choices.length&&<option value="">{m.t('splicewire-beam-ux::messages.canvas_no_readable_records')}</option>}
     {data.choices.map(choice=><option key={choice.value} value={choice.value}>{choice.label}</option>)}
    </select></label>
    {data.hasMore&&<p>{m.t('splicewire-beam-ux::messages.canvas_first_page_only')}</p>}
   </>:<p role="status">{m.t('splicewire-beam-ux::messages.canvas_live_bindings_hint')}</p>}
 </section>;
}
