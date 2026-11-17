import {useState} from 'react';
import type {ConditionOperator,ConditionRule} from '../blockdoc/bindings.js';
import {assertRepeat} from '../blockdoc/bindings.js';
import {getAt,isJsonBlock,VOID_TAGS,type JsonBlock} from '../blockdoc/json.js';
import {authoredEntry} from './authored-components';
import {useCanvas} from './context.js';
import {useCanvasSelection} from './CanvasSelection.js';
import {bindingFields,collectionOffers,eventOffers,recordOffer,repeatCollection,bindText,scalarValue,condition,type BindingField} from './binding-edit.js';
import {RepeatRecordSelection} from './RepeatRecordSelection';
import {useBeamUxMessages,type BeamUxMessageKey} from '../messages.js';
import {noticeOf,say,type Notice} from '../message-descriptor.js';
const OPERATORS:ConditionOperator[]=['is set','is empty','equals','does not equal','greater than','less than','contains'];
/** Operators are stored vocabulary (the option value); only their label is translated. */
const OPERATOR_LABEL:Record<ConditionOperator,BeamUxMessageKey>={'is set':'splicewire-beam-ux::messages.binding_operator_is_set','is empty':'splicewire-beam-ux::messages.binding_operator_is_empty','equals':'splicewire-beam-ux::messages.binding_operator_equals','does not equal':'splicewire-beam-ux::messages.binding_operator_does_not_equal','greater than':'splicewire-beam-ux::messages.binding_operator_greater_than','less than':'splicewire-beam-ux::messages.binding_operator_less_than','contains':'splicewire-beam-ux::messages.binding_operator_contains'};

/** Every edit uses the canvas's existing Local Session command/undo path. Choice reads use the addressed author port. */
export function BindingInspector({path}:{path:string}){
 const m=useBeamUxMessages();
 const config=useCanvas();const {commands}=useCanvasSelection();const [error,setError]=useState<Notice|null>(null);const [mode,setMode]=useState<'all'|'any'>('all');
 const node=commands?getAt(commands.doc,path):null;
 if(!node||!isJsonBlock(node)||!commands?.editBinding)return null;
 const offers=collectionOffers(config.profile);
 const events=eventOffers(config.profile);
 const offer=recordOffer(commands.doc,path,offers,config.bindingPreview?.recordCollection);
 const fields=offer?bindingFields(offer.schema):[];
 const rich=(field:BindingField)=>['markdown','mdx','blockdoc','jsondoc'].includes(field.format??'');
 const plainFields=fields.filter(field=>!rich(field));
 const repeatOffer=offers.find(item=>item.name===node.repeat?.collection);
 const disabled=commands.readOnly;
 const edit=(change:(node:JsonBlock)=>JsonBlock)=>{try{commands.editBinding?.(path,change);setError(null);}catch(e){setError(noticeOf(e,String(e)));}};
 const rules=node.when?.all??node.when?.any??[];
 const join=node.when?.any?'any':node.when?.all?'all':mode;
 const setRules=(next:ConditionRule[],mode:'all'|'any'=join)=>edit(block=>condition(block,next.length?{[mode]:next}:undefined));
 const modifyRule=(index:number,rule:ConditionRule)=>setRules(rules.map((old,i)=>i===index?rule:old));
 const query=node.repeat?.query??{limit:25};
 const repeatFields=repeatOffer?bindingFields(repeatOffer.schema):[];
 const sortFields=repeatFields.filter(field=>field.sortName);
 const filterFields=repeatFields.filter(field=>field.filterName);
 const filterName=(path:string)=>filterFields.find(field=>field.path===path)?.filterName??'';
 const sortName=(path:string)=>sortFields.find(field=>field.path===path)?.sortName??'';
 const sort=query.sort??'';
 const filter=Object.entries(query.filter??{})[0];
 const queryChange=(next:typeof query)=>edit(block=>{if(!block.repeat)return block;const repeat={...block.repeat,query:next};assertRepeat(repeat);return {...block,repeat};});
 const clickEventName=(name:string)=>edit(block=>{
  if(!name){const {clickEvent:_,...rest}=block;return rest;}
  return {...block,clickEvent:{name,...(block.clickEvent?.label!==undefined?{label:block.clickEvent.label}:{})}};
 });
 const clickEventLabel=(label:string)=>edit(block=>{
  if(!block.clickEvent)return block;
  const {label:_,...clickEvent}=block.clickEvent;
  return {...block,clickEvent:label?{...clickEvent,label}:clickEvent};
 });
 const fieldSelect=(label:string,value:string,change:(field:string)=>void,list=fields)=><label>{label}<select aria-label={label} value={value} disabled={disabled||!list.length} onChange={event=>change(event.target.value)}>
  <option value="">{m.t('splicewire-beam-ux::messages.binding_none')}</option>{list.map(field=><option key={field.path} value={field.path}>{field.label} ({field.path})</option>)}</select></label>;
 const properties=config.profile?.nodes.find(item=>item.name===node.name)?.attrsSchema?.properties??{};
 return <section aria-label={m.t('splicewire-beam-ux::messages.binding_data_binding')}><h3>{m.t('splicewire-beam-ux::messages.binding_data_binding')}</h3>{error&&<p role="alert">{say(m,error)}</p>}
 <fieldset disabled={disabled}><legend>{m.t('splicewire-beam-ux::messages.binding_repeat_records')}</legend>
   <label>{m.t('splicewire-beam-ux::messages.binding_collection')}<select aria-label={m.t('splicewire-beam-ux::messages.binding_collection')} value={node.repeat?.collection??''} onChange={event=>edit(block=>repeatCollection(block,event.target.value))}>
    <option value="">{m.t('splicewire-beam-ux::messages.binding_no_repeat')}</option>{offers.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
   {node.repeat?.relation&&<p>{m.t('splicewire-beam-ux::messages.binding_nested_relation')}</p>}
   {node.repeat?.collection&&<>
    {repeatOffer&&<RepeatRecordSelection doc={commands.doc} path={path} offer={repeatOffer} query={query} disabled={disabled} onChange={queryChange}/>}
    <label>{m.t('splicewire-beam-ux::messages.binding_record_limit')}<input aria-label={m.t('splicewire-beam-ux::messages.binding_record_limit')} type="number" min={1} max={100} value={query.limit??25} onChange={event=>queryChange({...query,limit:Number(event.target.value)})}/></label>
    {fieldSelect(m.t('splicewire-beam-ux::messages.binding_sort_field'),sort.replace(/^-/,'')?sortFields.find(field=>field.sortName===sort.replace(/^-/,''))?.path??'':'',field=>queryChange({...query,sort:field?`${sort.startsWith('-')?'-':''}${sortName(field)}`:null}),sortFields)}
    <label>{m.t('splicewire-beam-ux::messages.binding_sort_order')}<select aria-label={m.t('splicewire-beam-ux::messages.binding_sort_order')} value={sort.startsWith('-')?'descending':'ascending'} onChange={event=>queryChange({...query,sort:sort?`${event.target.value==='descending'?'-':''}${sort.replace(/^-/,'')}`:null})}><option value="ascending">{m.t('splicewire-beam-ux::messages.binding_ascending')}</option><option value="descending">{m.t('splicewire-beam-ux::messages.binding_descending')}</option></select></label>
    {fieldSelect(m.t('splicewire-beam-ux::messages.binding_filter_field'),filter?filterFields.find(field=>field.filterName===filter[0])?.path??'':'',field=>queryChange({...query,filter:field?{[filterName(field)]:scalarValue(repeatFields.find(item=>item.path===field)?.type==='boolean'?'false':repeatFields.find(item=>item.path===field)?.type==='number'||repeatFields.find(item=>item.path===field)?.type==='integer'?'0':'',repeatFields.find(item=>item.path===field))}:null}),filterFields)}
    {filter&&<label>{m.t('splicewire-beam-ux::messages.binding_filter_value')}<input aria-label={m.t('splicewire-beam-ux::messages.binding_filter_value')} key={filter[0]} defaultValue={String(filter[1]??'')} onBlur={event=>{try{queryChange({...query,filter:{[filter[0]]:scalarValue(event.target.value,filterFields.find(field=>field.filterName===filter[0]))}});}catch(e){setError(noticeOf(e,String(e)));}}}/></label>}
   </>}
  </fieldset>
  <fieldset disabled={disabled}><legend>{m.t('splicewire-beam-ux::messages.binding_click_event_legend')}</legend>
   <label>{m.t('splicewire-beam-ux::messages.binding_click_event')}<select aria-label={m.t('splicewire-beam-ux::messages.binding_click_event')} value={node.clickEvent?.name??''} onChange={event=>clickEventName(event.target.value)}>
    <option value="">{m.t('splicewire-beam-ux::messages.binding_no_click_event')}</option>
    {node.clickEvent&&!events.some(event=>event.name===node.clickEvent?.name)&&<option value={node.clickEvent.name}>{m.t('splicewire-beam-ux::messages.binding_not_in_profile',{name:node.clickEvent.name})}</option>}
    {events.map(event=><option key={event.name} value={event.name}>{event.name} ({event.source})</option>)}
   </select></label>
   <label>{m.t('splicewire-beam-ux::messages.binding_click_event_label')}<input aria-label={m.t('splicewire-beam-ux::messages.binding_click_event_label')} value={node.clickEvent?.label??''} disabled={!node.clickEvent} onChange={event=>clickEventLabel(event.target.value)}/></label>
  </fieldset>
  {!fields.length&&<p>{m.t('splicewire-beam-ux::messages.binding_no_fields')}</p>}
  {!node.isComponent&&!VOID_TAGS.has(node.name??'')&&fieldSelect(m.t('splicewire-beam-ux::messages.binding_text_field'),node.children.find(child=>child.kind==='text')?.field??'',field=>edit(block=>bindText(block,field)),plainFields)}
  {!authoredEntry(config,node.name)&&Object.keys(properties).filter(name=>name!=='className'&&!/^on/i.test(name)&&!['dangerouslySetInnerHTML','srcDoc'].includes(name)).map(name=>fieldSelect(m.t('splicewire-beam-ux::messages.binding_bind_prop',{name}),String(node.props.find(prop=>prop.name===name&&prop.kind==='field')?.value??''),field=>edit(block=>({...block,props:[...block.props.filter(prop=>prop.name!==name),...(field?[{kind:'field' as const,name,value:field}]:[])]})),fields.filter(field=>!rich(field)||(node.name==='RichMarkdown'&&name==='content'&&field.format==='markdown'))))}
  <fieldset disabled={disabled||!fields.length}><legend>{m.t('splicewire-beam-ux::messages.binding_display_condition')}</legend>
   <label>{m.t('splicewire-beam-ux::messages.binding_match')}<select aria-label={m.t('splicewire-beam-ux::messages.binding_condition_match')} value={join} onChange={event=>{const next=event.target.value==='any'?'any':'all';setMode(next);if(rules.length)setRules(rules,next);}}><option value="all">{m.t('splicewire-beam-ux::messages.binding_all_rules')}</option><option value="any">{m.t('splicewire-beam-ux::messages.binding_any_rule')}</option></select></label>
   {rules.map((rule,index)=><div key={index}>
    {fieldSelect(m.t('splicewire-beam-ux::messages.binding_rule_field',{number:index+1}),rule.field,field=>modifyRule(index,{field,operator:'is set'}))}
    <label>{m.t('splicewire-beam-ux::messages.binding_rule_operator',{number:index+1})}<select aria-label={m.t('splicewire-beam-ux::messages.binding_rule_operator',{number:index+1})} value={rule.operator} onChange={event=>{const operator=OPERATORS.find(op=>op===event.target.value);if(operator)modifyRule(index,{...rule,operator});}}>{OPERATORS.filter(op=>operatorAllowed(op,fields.find(field=>field.path===rule.field))).map(operator=><option key={operator} value={operator}>{m.t(OPERATOR_LABEL[operator])}</option>)}</select></label>
    {!['is set','is empty'].includes(rule.operator)&&<label>{m.t('splicewire-beam-ux::messages.binding_rule_value',{number:index+1})}<input aria-label={m.t('splicewire-beam-ux::messages.binding_rule_value',{number:index+1})} key={`${rule.field}:${rule.operator}`} defaultValue={String(rule.value??'')} onBlur={event=>{try{modifyRule(index,{...rule,value:scalarValue(event.target.value,fields.find(field=>field.path===rule.field))});}catch(e){setError(noticeOf(e,String(e)));}}}/></label>}
    <button type="button" onClick={()=>setRules(rules.filter((_,i)=>i!==index))}>{m.t('splicewire-beam-ux::messages.binding_remove_rule',{number:index+1})}</button>
   </div>)}
   <button type="button" onClick={()=>fields[0]&&setRules([...rules,{field:fields[0].path,operator:'is set'}])}>{m.t('splicewire-beam-ux::messages.binding_add_rule')}</button>
  </fieldset>
 </section>;
}
function operatorAllowed(operator:ConditionOperator,field?:BindingField):boolean{
 if(['is set','is empty','equals','does not equal'].includes(operator))return true;
 if(operator==='contains')return field?.type==='string';
 return field?.type==='number'||field?.type==='integer'||['date','date-time'].includes(field?.format??'');
}
