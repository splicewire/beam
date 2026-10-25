import {useState} from 'react';
import type {ConditionOperator,ConditionRule} from '../blockdoc/bindings.js';
import {assertRepeat} from '../blockdoc/bindings.js';
import {getAt,isJsonBlock,VOID_TAGS,type JsonBlock} from '../blockdoc/json.js';
import {useCanvas} from './context.js';
import {useCanvasSelection} from './CanvasSelection.js';
import {bindingFields,collectionOffers,recordOffer,repeatCollection,bindText,scalarValue,condition,type BindingField} from './binding-edit.js';
const OPERATORS:ConditionOperator[]=['is set','is empty','equals','does not equal','greater than','less than','contains'];

/** Every edit uses the canvas's existing Local Session command/undo path. It never saves or reads Records. */
export function BindingInspector({path}:{path:string}){
 const config=useCanvas();const {commands}=useCanvasSelection();const [error,setError]=useState<string|null>(null);const [mode,setMode]=useState<'all'|'any'>('all');
 const node=commands?getAt(commands.doc,path):null;
 if(!node||!isJsonBlock(node)||!commands?.editBinding)return null;
 const offers=collectionOffers(config.profile);
 const offer=recordOffer(commands.doc,path,offers,config.bindingPreview?.recordCollection);
 const fields=offer?bindingFields(offer.schema):[];
 const rich=(field:BindingField)=>['markdown','mdx','blockdoc','jsondoc'].includes(field.format??'');
 const plainFields=fields.filter(field=>!rich(field));
 const repeatOffer=offers.find(item=>item.name===node.repeat?.collection);
 const disabled=commands.readOnly;
 const edit=(change:(node:JsonBlock)=>JsonBlock)=>{try{commands.editBinding?.(path,change);setError(null);}catch(e){setError(e instanceof Error?e.message:String(e));}};
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
 const fieldSelect=(label:string,value:string,change:(field:string)=>void,list=fields)=><label>{label}<select aria-label={label} value={value} disabled={disabled||!list.length} onChange={event=>change(event.target.value)}>
  <option value="">None</option>{list.map(field=><option key={field.path} value={field.path}>{field.label} ({field.path})</option>)}</select></label>;
 const properties=config.profile?.nodes.find(item=>item.name===node.name)?.attrsSchema?.properties??{};
 return <section aria-label="Data binding"><h3>Data binding</h3>{error&&<p role="alert">{error}</p>}
  <fieldset disabled={disabled}><legend>Repeat Records</legend>
   <label>Collection<select aria-label="Collection" value={node.repeat?.collection??''} onChange={event=>edit(block=>repeatCollection(block,event.target.value))}>
    <option value="">No Repeat</option>{offers.map(item=><option key={item.name} value={item.name}>{item.name}</option>)}</select></label>
   {node.repeat?.relation&&<p>This nested Repeat uses its declared relation. Relation editing is unavailable here.</p>}
   {node.repeat?.collection&&<>
    <label>Record limit<input aria-label="Record limit" type="number" min={1} max={100} value={query.limit??25} onChange={event=>queryChange({...query,limit:Number(event.target.value)})}/></label>
    {fieldSelect('Sort field',sort.replace(/^-/,'')?sortFields.find(field=>field.sortName===sort.replace(/^-/,''))?.path??'':'',field=>queryChange({...query,sort:field?`${sort.startsWith('-')?'-':''}${sortName(field)}`:null}),sortFields)}
    <label>Sort order<select aria-label="Sort order" value={sort.startsWith('-')?'descending':'ascending'} onChange={event=>queryChange({...query,sort:sort?`${event.target.value==='descending'?'-':''}${sort.replace(/^-/,'')}`:null})}><option value="ascending">Ascending</option><option value="descending">Descending</option></select></label>
    {fieldSelect('Filter field',filter?filterFields.find(field=>field.filterName===filter[0])?.path??'':'',field=>queryChange({...query,filter:field?{[filterName(field)]:scalarValue(repeatFields.find(item=>item.path===field)?.type==='boolean'?'false':repeatFields.find(item=>item.path===field)?.type==='number'||repeatFields.find(item=>item.path===field)?.type==='integer'?'0':'',repeatFields.find(item=>item.path===field))}:null}),filterFields)}
    {filter&&<label>Filter value<input aria-label="Filter value" key={filter[0]} defaultValue={String(filter[1]??'')} onBlur={event=>{try{queryChange({...query,filter:{[filter[0]]:scalarValue(event.target.value,filterFields.find(field=>field.filterName===filter[0]))}});}catch(e){setError(e instanceof Error?e.message:String(e));}}}/></label>}
   </>}
  </fieldset>
  {!fields.length&&<p>No Record fields are in scope. Choose a Repeat Collection or save a Record Page declaration first.</p>}
  {!node.isComponent&&!VOID_TAGS.has(node.name??'')&&fieldSelect('Text field',node.children.find(child=>child.kind==='text')?.field??'',field=>edit(block=>bindText(block,field)),plainFields)}
  {Object.keys(properties).filter(name=>name!=='className'&&!/^on/i.test(name)&&!['dangerouslySetInnerHTML','srcDoc'].includes(name)).map(name=>fieldSelect(`Bind ${name}`,String(node.props.find(prop=>prop.name===name&&prop.kind==='field')?.value??''),field=>edit(block=>({...block,props:[...block.props.filter(prop=>prop.name!==name),...(field?[{kind:'field' as const,name,value:field}]:[])]})),fields.filter(field=>!rich(field)||(node.name==='RichMarkdown'&&name==='content'&&field.format==='markdown'))))}
  <fieldset disabled={disabled||!fields.length}><legend>Display condition</legend>
   <label>Match<select aria-label="Condition match" value={join} onChange={event=>{const next=event.target.value==='any'?'any':'all';setMode(next);if(rules.length)setRules(rules,next);}}><option value="all">All rules</option><option value="any">Any rule</option></select></label>
   {rules.map((rule,index)=><div key={index}>
    {fieldSelect(`Rule ${index+1} field`,rule.field,field=>modifyRule(index,{field,operator:'is set'}))}
    <label>Rule {index+1} operator<select aria-label={`Rule ${index+1} operator`} value={rule.operator} onChange={event=>{const operator=OPERATORS.find(op=>op===event.target.value);if(operator)modifyRule(index,{...rule,operator});}}>{OPERATORS.filter(op=>operatorAllowed(op,fields.find(field=>field.path===rule.field))).map(operator=><option key={operator}>{operator}</option>)}</select></label>
    {!['is set','is empty'].includes(rule.operator)&&<label>Rule {index+1} value<input aria-label={`Rule ${index+1} value`} key={`${rule.field}:${rule.operator}`} defaultValue={String(rule.value??'')} onBlur={event=>{try{modifyRule(index,{...rule,value:scalarValue(event.target.value,fields.find(field=>field.path===rule.field))});}catch(e){setError(e instanceof Error?e.message:String(e));}}}/></label>}
    <button type="button" onClick={()=>setRules(rules.filter((_,i)=>i!==index))}>Remove rule {index+1}</button>
   </div>)}
   <button type="button" onClick={()=>fields[0]&&setRules([...rules,{field:fields[0].path,operator:'is set'}])}>Add display rule</button>
  </fieldset>
 </section>;
}
function operatorAllowed(operator:ConditionOperator,field?:BindingField):boolean{
 if(['is set','is empty','equals','does not equal'].includes(operator))return true;
 if(operator==='contains')return field?.type==='string';
 return field?.type==='number'||field?.type==='integer'||['date','date-time'].includes(field?.format??'');
}
