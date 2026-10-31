import {useEffect,useState} from 'react';
import {SchemaForm} from '@schemastud/seam';
import type {RepeatQuery} from '../blockdoc/bindings';
import type {JsonDoc} from '../blockdoc/json';
import {useCanvas} from './context';
import type {CollectionOffer} from './binding-edit';
import {repeatChoiceRead,recordChoiceValue} from './repeat-choice-read';

type Choice={value:string;label:string};
type Port=ReturnType<typeof useCanvas>['bindingPreview'];
interface Result {port:Port;body:string;choices:Choice[];more:boolean;error?:string}

/** Named choices read through the existing author port; selections use the Local Session's normal undo command. */
export function RepeatRecordSelection({doc,path,offer,query,disabled,onChange}:{doc:JsonDoc;path:string;offer:CollectionOffer;query:RepeatQuery;disabled:boolean;onChange:(query:RepeatQuery)=>void}){
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
   if(!rows){setResult({port,body,choices:[],more:false,error:'The author read did not return this Repeat. Check its Collection declaration.'});return;}
   const choices=(rows?.records??[]).flatMap(record=>{
    const id=record.id;const label=recordChoiceValue(record,projection.label);
    return typeof id==='string'&&/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id)
     ?[{value:id,label:typeof label==='string'&&label.trim()?label:`Unnamed Record (${id.slice(-6)})`}]:[];
   });
   setResult({port,body,choices,more:rows?.hasMore??false});
  },()=>{if(live)setResult({port,body,choices:[],more:false,error:'Record choices were refused or failed. Check this entry’s author access and Collection declaration.'});});
  return()=>{live=false;controller.abort();};
 },[port,body,disabled,handpicked]);
 const available=!!projection&&!!port?.resolve;
 const choices=[...(current?.choices??[]),...selected.filter(id=>!current?.choices.some(choice=>choice.value===id)).map((id,index)=>({value:id,label:`Previously selected Record ${index+1} (not in this window)`}))];
 const schema={type:'object',properties:{ids:{type:'array',title:'Choose Records',uniqueItems:true,maxItems:100,
  items:{type:'string',oneOf:choices.map(choice=>({const:choice.value,title:choice.label}))}}}};
 return <section aria-label="Handpicked Records">
  <label>Record selection<select aria-label="Record selection" disabled={disabled} value={handpicked?'handpicked':'matching'} onChange={event=>{
   if(disabled)return;
   if(event.target.value==='handpicked'){if(projection)onChange({...query,ids:[]});}
   else {const {ids:_,...next}=query;onChange(next);}
  }}><option value="matching">All matching Records</option><option value="handpicked" disabled={!projection}>Handpicked Records</option></select></label>
  {handpicked&&<>
   {disabled?<p role="status">This Record selection is read-only.</p>
    :!available?<p role="status">Record choices unavailable: this host needs an addressed author-read port and a readable Record name field.</p>
    :current?.error?<p role="alert">{current.error}</p>
    :!current?<p role="status">Reading Record choices as you…</p>
    :!current.choices.length?<p role="status">No readable matching Records in this window.</p>:null}
   <p>{selected.length} selected. An empty selection shows no Records. Existing filters and sort still apply.</p>
   {!!choices.length&&<SchemaForm schema={schema} formData={{ids:selected}}
    disabled={disabled||!current||!!current.error||!available} uiSchema={{ids:{'ui:widget':'checkboxes'},'ui:submitButtonOptions':{norender:true}}}
    onChange={(event:{formData?:{ids?:string[]}})=>{if(!disabled&&current&&!current.error&&available)onChange({...query,ids:event.formData?.ids??[]});}}/>}
   {current?.more&&<p>First 100 matching Records only. More Records may exist; narrow the saved filter to find them.</p>}
  </>}
 </section>;
}
