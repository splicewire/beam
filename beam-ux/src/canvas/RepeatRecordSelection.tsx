import {useEffect,useState} from 'react';
import {SchemaForm} from '@schemastud/seam';
import type {RepeatQuery} from '../blockdoc/bindings';
import type {JsonDoc} from '../blockdoc/json';
import {useCanvas} from './context';
import type {CollectionOffer} from './binding-edit';
import {repeatChoiceRead,recordChoiceValue} from './repeat-choice-read';
import {useBeamUxMessages} from '../messages.js';
import {notice as line,say,type Notice} from '../message-descriptor.js';

/** A choice's label is the Record's own name (raw) or a catalog line, translated where it renders. */
type Choice={value:string;label:Notice};
type Port=ReturnType<typeof useCanvas>['bindingPreview'];
interface Result {port:Port;body:string;choices:Choice[];more:boolean;error?:Notice}

/** Named choices read through the existing author port; selections use the Local Session's normal undo command. */
export function RepeatRecordSelection({doc,path,offer,query,disabled,onChange}:{doc:JsonDoc;path:string;offer:CollectionOffer;query:RepeatQuery;disabled:boolean;onChange:(query:RepeatQuery)=>void}){
 const m=useBeamUxMessages();
 const {bindingPreview:port}=useCanvas();
 const projection=repeatChoiceRead(doc,path,offer);
 const body=projection?JSON.stringify(projection.body):'';
 const [result,setResult]=useState<Result|null>(null);
 const current=result&&result.port===port&&result.body===body?result:null;
 const selected=query.ids??[];
 const handpicked=query.ids!=null;
 useEffect(()=>{
  if(disabled||!handpicked||!projection||!port?.resolve)return;
  let live=true;const controller=new AbortController();
  void port.resolve(port.entryId,projection.body,null,{signal:controller.signal}).then(data=>{
   if(!live)return;
   const rows=data.bindings[projection.id];
   if(!rows){setResult({port,body,choices:[],more:false,error:line('splicewire-beam-ux::messages.canvas_repeat_not_returned')});return;}
   const choices=(rows?.records??[]).flatMap(record=>{
    const id=record.id;const label=recordChoiceValue(record,projection.label);
    return typeof id==='string'&&/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)
     ?[{value:id,label:typeof label==='string'&&label.trim()?label:line('splicewire-beam-ux::messages.canvas_unnamed_record',{id:id.slice(-6)})}]:[];
   });
   setResult({port,body,choices,more:rows?.hasMore??false});
  },()=>{if(live)setResult({port,body,choices:[],more:false,error:line('splicewire-beam-ux::messages.canvas_record_choices_failed')});});
  return()=>{live=false;controller.abort();};
 },[port,body,disabled,handpicked]);
 const available=!!projection&&!!port?.resolve;
 const choices=[...(current?.choices??[]),...selected.filter(id=>!current?.choices.some(choice=>choice.value===id)).map((id,index)=>({value:id,label:line('splicewire-beam-ux::messages.canvas_previously_selected',{number:index+1})}))];
 const schema={type:'object',properties:{ids:{type:'array',title:m.t('splicewire-beam-ux::messages.canvas_choose_records'),uniqueItems:true,maxItems:100,
  items:{type:'string',oneOf:choices.map(choice=>({const:choice.value,title:say(m,choice.label)}))}}}};
 return <section aria-label={m.t('splicewire-beam-ux::messages.canvas_handpicked_records')}>
  <label>{m.t('splicewire-beam-ux::messages.canvas_record_selection')}<select aria-label={m.t('splicewire-beam-ux::messages.canvas_record_selection')} disabled={disabled} value={handpicked?'handpicked':'matching'} onChange={event=>{
   if(disabled)return;
   if(event.target.value==='handpicked'){if(projection)onChange({...query,ids:[]});}
   else {const {ids:_,...next}=query;onChange(next);}
  }}><option value="matching">{m.t('splicewire-beam-ux::messages.canvas_all_matching_records')}</option><option value="handpicked" disabled={!projection}>{m.t('splicewire-beam-ux::messages.canvas_handpicked_records')}</option></select></label>
  {handpicked&&<>
   {disabled?<p role="status">{m.t('splicewire-beam-ux::messages.canvas_selection_read_only')}</p>
    :!available?<p role="status">{m.t('splicewire-beam-ux::messages.canvas_record_choices_unavailable')}</p>
    :current?.error?<p role="alert">{say(m,current.error)}</p>
    :!current?<p role="status">{m.t('splicewire-beam-ux::messages.canvas_reading_record_choices')}</p>
    :!current.choices.length?<p role="status">{m.t('splicewire-beam-ux::messages.canvas_no_matching_records')}</p>:null}
   <p>{m.t('splicewire-beam-ux::messages.canvas_selected_count',{count:selected.length})}</p>
   {!!choices.length&&<SchemaForm schema={schema} formData={{ids:selected}}
    disabled={disabled||!current||!!current.error||!available} uiSchema={{ids:{'ui:widget':'checkboxes'},'ui:submitButtonOptions':{norender:true}}}
    onChange={(event:{formData?:{ids?:string[]}})=>{if(!disabled&&current&&!current.error&&available)onChange({...query,ids:event.formData?.ids??[]});}}/>}
   {current?.more&&<p>{m.t('splicewire-beam-ux::messages.canvas_first_100_only')}</p>}
  </>}
 </section>;
}
