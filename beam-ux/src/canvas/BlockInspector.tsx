import {useEffect,useId,useState} from 'react';
import {useEditShellMount} from '@schemastud/frame/editor';
import {SchemaForm,type SchemaNode} from '@schemastud/seam';
import type {BlockStyle} from '../blockdoc/style';
import {DEFAULT_STYLE_REGISTRY} from '../blockdoc/style-runtime';
import {useCanvas} from './context';
import {useStyleSelection} from './StyleSelection';
import {contrastRatio,effectiveDeclaration,readableShade,validatedEdit} from './inspector-style';
import {DEFAULT_VAR_SUGGESTIONS} from './templates';
import {useCanvasSelection} from './CanvasSelection';
import {getAt,isJsonBlock} from '../blockdoc/json';
import {MediaPicker} from '../editor/MediaPicker';
import {BindingInspector} from './BindingInspector';
import {blockStyleFields} from './block-style';
import {authoredEntry} from './authored-components';
import {ComponentProps} from './ComponentProps';
import {useBeamUxMessages,type BeamUxMessageKey} from '../messages.js';
import {notice,noticeOf,say,type Notice} from '../message-descriptor.js';

const PANELS:Record<string,string[]>={
 Size:['width','height','min-width','max-width','min-height','max-height','aspect-ratio','object-fit'],
 Layout:['display','position','top','right','bottom','left','z-index','padding','margin','gap','flex-direction','justify-content','align-items','grid-template-columns'],
 Text:['font-family','font-size','font-weight','line-height','letter-spacing','text-align','text-decoration','color'],
 Appearance:['background-color','background-image','border','border-color','border-radius','opacity'],
 Effects:['box-shadow','text-shadow','filter','transform','transition'],
};
/** The panel names are keys; the reader sees their catalog line. */
const PANEL_LABEL:Record<string,BeamUxMessageKey>={Size:'splicewire-beam-ux::messages.inspect_panel_size',Layout:'splicewire-beam-ux::messages.inspect_panel_layout',Text:'splicewire-beam-ux::messages.inspect_panel_text',Appearance:'splicewire-beam-ux::messages.inspect_panel_appearance',Effects:'splicewire-beam-ux::messages.inspect_panel_effects'};
interface Node {type:string;attrsSchema?:SchemaNode;attrs?:Record<string,unknown>}

/** One NodeAccess write path, shared by the in-page and standalone editors. */
export function BlockInspector(){
 const m=useBeamUxMessages();
 const mount=useEditShellMount();
 const config=useCanvas();
 const canvasSelection=useCanvasSelection();
 const {selection,select}=useStyleSelection();
 const registry=config.styleRegistry??DEFAULT_STYLE_REGISTRY;
 const [error,setError]=useState<Notice|null>(null);
 const [rendered,setRendered]=useState<Record<string,string>>({});
 const [rawProperty,setRawProperty]=useState('');
 const [rawValue,setRawValue]=useState('');
 const [gradientStart,setGradientStart]=useState('#ffffff');
 const [gradientEnd,setGradientEnd]=useState('#000000');
 const tokenId=useId();
 const id=mount.selectedNodeId;
 const node=id!==null?mount.getNode(id) as Node|null:null;
 const attrs=node?.attrs??{};
 const component=authoredEntry(config,node?.type);
 const style=(attrs.bdStyle??{layers:[]}) as BlockStyle;
 const selected=canvasSelection.commands&&canvasSelection.paths.includes(id??'')?canvasSelection.paths:[...(id?[id]:[])];
 const styles=selected.map(path=>{
  const block=canvasSelection.commands?getAt(canvasSelection.commands.doc,path):null;
  return block&&isJsonBlock(block)?blockStyleFields(block,{schema:{},attrs:{}}).attrs.bdStyle:style;
 });
 const tokens=config.varSuggestions??DEFAULT_VAR_SUGGESTIONS;
 useEffect(()=>{
  const element=[...document.querySelectorAll<HTMLElement>('[data-bd-path]')].find(el=>el.dataset.bdPath===id);
  if(!element){setRendered({});return;}
  const computed=getComputedStyle(element);
  const properties=[...Object.values(PANELS).flat(),...tokens.map(token=>/^var\((--[^,)]+)/.exec(token)?.[1]).filter((v):v is string=>!!v)];
  setRendered(Object.fromEntries(properties.map(property=>[property,computed.getPropertyValue(property).trim()])));
 },[id,JSON.stringify(attrs),tokens.join('|')]);
 if(!node||id===null)return <div data-frame-region="inspector" data-frame-inspector-empty="">{m.t('splicewire-beam-ux::messages.inspect_select_block')}</div>;
 const write=(property:string,value:string|null)=>{
  try{
   if(canvasSelection.commands)canvasSelection.commands.editStyle(selected,selection,property,value);
   else {const next=validatedEdit(style,selection,property,value,registry);mount.setNodeAttrs(id,{...attrs,bdStyle:next});}
   setError(null);
  }
  catch(e){setError(noticeOf(e,String(e)));}
 };
 const own=(property:string)=>{
  if(styles.length>1&&new Set(styles.map(s=>effectiveDeclaration(s,property,selection,registry)?.value??'')).size>1)return '';
  let value='';
  for(const layer of style.layers)if((layer.breakpoint??null)===selection.breakpoint&&(layer.state??null)===selection.state&&Object.hasOwn(layer.declarations,property))value=layer.declarations[property];
  return value;
 };
 const resolve=(value:string)=>value.replace(/var\((--[a-zA-Z0-9-]+)\)/g,(expression,key)=>rendered[key]||expression);
 const properties={...((node.attrsSchema?.properties??{}) as Record<string,unknown>)};
 delete properties.bdStyle;
 // Components expose declared props; className remains source-owned, never an inspector edit.
 delete properties.className;
 const props=Object.fromEntries(Object.entries(attrs).filter(([key])=>Object.hasOwn(properties,key)));
 const forwardsRoot=(name:string)=>!/^[A-Z]/.test(name)||config.profile?.nodes.some(entry=>entry.name===name&&'x-forwards-root-style' in entry&&entry['x-forwards-root-style']===true)===true;
 const rootStyles=forwardsRoot(node.type)&&selected.every(path=>{const n=canvasSelection.commands?getAt(canvasSelection.commands.doc,path):null;return !n||!isJsonBlock(n)||forwardsRoot(n.name??'');});
 const foreground=resolve(effectiveDeclaration(style,'color',selection,registry)?.value||rendered.color||'');
 const background=resolve(effectiveDeclaration(style,'background-color',selection,registry)?.value||rendered['background-color']||'');
 const ratio=contrastRatio(foreground,background);
 const shade=readableShade(foreground,background);
 const field=(property:string)=>{
  const inherited=effectiveDeclaration(style,property,selection,registry);
  const value=own(property);
  const mixed=styles.length>1&&new Set(styles.map(s=>effectiveDeclaration(s,property,selection,registry)?.value??'')).size>1;
  return <div key={property} style={{marginBlock:8}}>
   <label>{m.t('splicewire-beam-ux::messages.inspect_property_token',{property})}<select aria-label={m.t('splicewire-beam-ux::messages.inspect_property_token',{property})} value={tokens.includes(value)?value:''} onChange={event=>{if(event.target.value)write(property,event.target.value);}}>
    <option value="">{m.t('splicewire-beam-ux::messages.inspect_custom_value')}</option>{tokens.map(token=><option key={token} value={token}>{token} {resolve(token)!==token?`(${resolve(token)})`:''}</option>)}</select></label>
   <label>{property}<input aria-label={property} list={tokenId} key={`${id}:${selection.breakpoint}:${selection.state}:${property}:${value}`} defaultValue={value}
    placeholder={mixed?m.t('splicewire-beam-ux::messages.inspect_mixed_values'):inherited?.value||rendered[property]||m.t('splicewire-beam-ux::messages.inspect_unset')} onBlur={event=>{if(event.target.value!==value)write(property,event.target.value||null);}}/></label>
   {mixed&&<small>{m.t('splicewire-beam-ux::messages.inspect_property_mixed',{property})}</small>}
   <small>{inherited?`${inherited.layer}: ${resolve(inherited.value)}`:rendered[property]?m.t('splicewire-beam-ux::messages.inspect_rendered_inherited',{value:rendered[property]}):m.t('splicewire-beam-ux::messages.inspect_no_value')}</small>
   {(property==='color'||property.endsWith('-color'))&&<ColourControls property={property} value={value||inherited?.value||rendered[property]||'#000000'} onChange={value=>write(property,value)} onError={setError}/>}
   <div><button type="button" onClick={()=>write(property,null)}>{m.t('splicewire-beam-ux::messages.inspect_unset_property',{property})}</button>
    <button type="button" onClick={event=>{const input=event.currentTarget.closest('div')?.parentElement?.querySelector('input');input?.focus();}}>{m.t('splicewire-beam-ux::messages.inspect_edit_as_text',{property})}</button>
    <button type="button" onClick={()=>{void navigator.clipboard?.writeText(`${property}: ${value||inherited?.value||rendered[property]||''};`).catch(()=>setError(notice('splicewire-beam-ux::messages.inspect_copy_failed')));}}>{m.t('splicewire-beam-ux::messages.inspect_copy_property',{property})}</button></div>
  </div>;
 };
 return <div data-frame-region="inspector" data-node-type={node.type} style={{padding:12,overflow:'auto'}}>
  {error&&<p role="alert">{say(m,error)}</p>}
  {selected.length<=1&&<BindingInspector key={id} path={id}/>}
  {selected.length>1&&<p>{m.choice('splicewire-beam-ux::messages.inspect_blocks_selected',selected.length)}</p>}
  {effectiveDeclaration(style,'display',{breakpoint:selection.breakpoint,state:null},registry)?.value==='none'&&<p>{m.t('splicewire-beam-ux::messages.inspect_hidden_at',{width:selection.breakpoint?`${selection.breakpoint}+`:m.t('splicewire-beam-ux::messages.inspect_all_widths')})}</p>}
  {selected.length<=1&&component&&<ComponentProps key={id} path={id} entry={component}/>}
  {selected.length<=1&&!component&&<section aria-label={m.t('splicewire-beam-ux::messages.inspect_element_properties')}><h3>{m.t('splicewire-beam-ux::messages.inspect_type_properties',{type:node.type})}</h3><SchemaForm key={id} schema={{...node.attrsSchema,properties}} formData={props}
   uiSchema={{'ui:submitButtonOptions':{norender:true}}} onChange={(event:{formData?:unknown})=>mount.setNodeAttrs(id,{...(event.formData as Record<string,unknown>),...(Object.hasOwn(attrs,'className')?{className:attrs.className}:{}),bdStyle:style})}/></section>}
  {selected.length<=1&&config.mediaLibrary&&Object.entries(properties).filter(([name,schema])=>
    (node.type==='img'&&name==='src')||(schema as Record<string,unknown>)?.['x-component-prop-type']==='image'
  ).map(([name])=><MediaPicker key={`${id}:${name}`} label={name} library={config.mediaLibrary!}
    onChoose={url=>{const current=mount.getNode(id) as Node|null;if(current)mount.setNodeAttrs(id,{...current.attrs,[name]:url});}}/>)}
  {!rootStyles?<p>{m.t('splicewire-beam-ux::messages.inspect_no_root_style')}</p>:<>
   <label>{m.t('splicewire-beam-ux::messages.inspect_breakpoint')}<select aria-label={m.t('splicewire-beam-ux::messages.inspect_breakpoint')} value={selection.breakpoint??''} onChange={event=>select({...selection,breakpoint:event.target.value||null})}>
    <option value="">{m.t('splicewire-beam-ux::messages.inspect_base')}</option>{Object.entries(registry.breakpoints).map(([name,width])=><option key={name} value={name}>{name} ({width})</option>)}</select></label>
   <label>{m.t('splicewire-beam-ux::messages.inspect_state')}<select aria-label={m.t('splicewire-beam-ux::messages.inspect_state')} value={selection.state??''} onChange={event=>select({...selection,state:event.target.value||null})}>
    <option value="">{m.t('splicewire-beam-ux::messages.inspect_default')}</option>{Object.keys(registry.states).map(name=><option key={name}>{name}</option>)}</select></label>
   <p>{m.t('splicewire-beam-ux::messages.inspect_preview_explainer')}</p>
   <datalist id={tokenId}>{tokens.map(token=><option key={token} value={token}>{resolve(token)}</option>)}</datalist>
   {Object.entries(PANELS).map(([name,fields])=><details key={name}><summary>{PANEL_LABEL[name]?m.t(PANEL_LABEL[name]):name}</summary>{fields.map(field)}</details>)}
   <details><summary>{m.t('splicewire-beam-ux::messages.inspect_gradient_stops')}</summary>
    <label>{m.t('splicewire-beam-ux::messages.inspect_start_colour_token')}<select aria-label={m.t('splicewire-beam-ux::messages.inspect_start_colour_token')} value={tokens.includes(gradientStart)?gradientStart:''} onChange={event=>{if(event.target.value)setGradientStart(event.target.value);}}>
     <option value="">{m.t('splicewire-beam-ux::messages.inspect_custom_colour')}</option>{tokens.map(token=><option key={token} value={token}>{token}</option>)}</select></label>
    <label>{m.t('splicewire-beam-ux::messages.inspect_start_colour')}<input type={tokens.includes(gradientStart)?'text':'color'} value={gradientStart} onChange={event=>setGradientStart(event.target.value)}/></label>
    <label>{m.t('splicewire-beam-ux::messages.inspect_end_colour_token')}<select aria-label={m.t('splicewire-beam-ux::messages.inspect_end_colour_token')} value={tokens.includes(gradientEnd)?gradientEnd:''} onChange={event=>{if(event.target.value)setGradientEnd(event.target.value);}}>
     <option value="">{m.t('splicewire-beam-ux::messages.inspect_custom_colour')}</option>{tokens.map(token=><option key={token} value={token}>{token}</option>)}</select></label>
    <label>{m.t('splicewire-beam-ux::messages.inspect_end_colour')}<input type={tokens.includes(gradientEnd)?'text':'color'} value={gradientEnd} onChange={event=>setGradientEnd(event.target.value)}/></label>
    <button type="button" onClick={()=>write('background-image',`linear-gradient(${gradientStart}, ${gradientEnd})`)}>{m.t('splicewire-beam-ux::messages.inspect_apply_gradient')}</button>
   </details>
   <details><summary>{m.t('splicewire-beam-ux::messages.inspect_advanced')}</summary>{[...new Set(style.layers.flatMap(layer=>Object.keys(layer.declarations)))].filter(property=>!Object.values(PANELS).flat().includes(property)).map(field)}
    <label>{m.t('splicewire-beam-ux::messages.inspect_css_property')}<input value={rawProperty} onChange={event=>setRawProperty(event.target.value)}/></label>
    <label>{m.t('splicewire-beam-ux::messages.inspect_css_value_token')}<select aria-label={m.t('splicewire-beam-ux::messages.inspect_css_value_token')} value={tokens.includes(rawValue)?rawValue:''} onChange={event=>{if(event.target.value)setRawValue(event.target.value);}}>
     <option value="">{m.t('splicewire-beam-ux::messages.inspect_custom_value')}</option>{tokens.map(token=><option key={token} value={token}>{token}</option>)}</select></label>
    <label>{m.t('splicewire-beam-ux::messages.inspect_css_value')}<input list={tokenId} value={rawValue} onChange={event=>setRawValue(event.target.value)}/></label><button type="button" onClick={()=>write(rawProperty,rawValue)}>{m.t('splicewire-beam-ux::messages.inspect_set_declaration')}</button>
   </details>
   <section aria-label={m.t('splicewire-beam-ux::messages.inspect_text_contrast')}><h3>{m.t('splicewire-beam-ux::messages.inspect_text_contrast')}</h3><p>{ratio===null?m.t('splicewire-beam-ux::messages.inspect_contrast_unknown'):m.t(ratio>=4.5?'splicewire-beam-ux::messages.inspect_contrast_meets':'splicewire-beam-ux::messages.inspect_contrast_below',{ratio:ratio.toFixed(2)})}</p>
    {shade&&ratio!==null&&ratio<4.5&&<button type="button" onClick={()=>write('color',shade)}>{m.t('splicewire-beam-ux::messages.inspect_use_readable_shade',{shade})}</button>}</section>
  </>}
 </div>;
}

function ColourControls({property,value,onChange,onError}:{property:string;value:string;onChange:(value:string)=>void;onError:(error:Notice)=>void}){
 const m=useBeamUxMessages();
 const parsed=colourInput(value);
 const alpha=parsed?.alpha??1;
 const hex=parsed?.hex??'#000000';
 const change=(colour:string,opacity:number)=>onChange(opacity===1?colour:`rgb(${[1,3,5].map(i=>parseInt(colour.slice(i,i+2),16)).join(' ')} / ${opacity})`);
 const EyeDropper=(globalThis as unknown as {EyeDropper?:new()=>{open:()=>Promise<{sRGBHex:string}>}}).EyeDropper;
 return <div>
  {!parsed&&<small>{m.t('splicewire-beam-ux::messages.inspect_colour_format_unsupported')}</small>}
  <label>{m.t('splicewire-beam-ux::messages.inspect_property_colour',{property})}<input type="color" aria-label={m.t('splicewire-beam-ux::messages.inspect_property_colour',{property})} value={hex} disabled={!parsed} onChange={event=>change(event.target.value,alpha)}/></label>
  <label>{m.t('splicewire-beam-ux::messages.inspect_property_alpha',{property})}<input type="number" aria-label={m.t('splicewire-beam-ux::messages.inspect_property_alpha',{property})} min="0" max="1" step="0.05" value={alpha} disabled={!parsed} onChange={event=>{const next=Number(event.target.value);if(Number.isFinite(next)&&next>=0&&next<=1){change(hex,next);}}}/></label>
  {EyeDropper?<button type="button" onClick={()=>{void new EyeDropper().open().then(result=>change(result.sRGBHex,alpha)).catch(error=>{if(error?.name!=='AbortError')onError(notice('splicewire-beam-ux::messages.inspect_sample_failed'));});}}>{m.t('splicewire-beam-ux::messages.inspect_pick_from_screen',{property})}</button>:<small>{m.t('splicewire-beam-ux::messages.inspect_eyedropper_unavailable')}</small>}
 </div>;
}

function colourInput(value:string):{hex:string;alpha:number}|null {
 const hex=/^#([a-f\d]{3}|[a-f\d]{6}|[a-f\d]{8})$/i.exec(value.trim());
 if(hex){const full=hex[1].length===3?[...hex[1]].map(c=>c+c).join(''):hex[1];return {hex:'#'+full.slice(0,6),alpha:full.length===8?parseInt(full.slice(6),16)/255:1};}
 const match=/^rgba?\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/i.exec(value.trim());
 if(!match)return null;
 const channels=match.slice(1,4).map(Number);const alpha=match[4]===undefined?1:Number(match[4]);
 if(channels.some(c=>c>255)||!Number.isFinite(alpha)||alpha<0||alpha>1)return null;
 return {hex:'#'+channels.map(c=>c.toString(16).padStart(2,'0')).join(''),alpha};
}
