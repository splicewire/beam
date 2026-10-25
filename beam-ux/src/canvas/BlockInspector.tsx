import {useEffect,useId,useState} from 'react';
import {useEditShellMount} from '@schemastud/frame';
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

const PANELS:Record<string,string[]>={
 Size:['width','height','min-width','max-width','min-height','max-height','aspect-ratio','object-fit'],
 Layout:['display','position','top','right','bottom','left','z-index','padding','margin','gap','flex-direction','justify-content','align-items','grid-template-columns'],
 Text:['font-family','font-size','font-weight','line-height','letter-spacing','text-align','text-decoration','color'],
 Appearance:['background-color','background-image','border','border-color','border-radius','opacity'],
 Effects:['box-shadow','text-shadow','filter','transform','transition'],
};
interface Node {type:string;attrsSchema?:SchemaNode;attrs?:Record<string,unknown>}

/** One NodeAccess write path, shared by the in-page and standalone editors. */
export function BlockInspector(){
 const mount=useEditShellMount();
 const config=useCanvas();
 const canvasSelection=useCanvasSelection();
 const {selection,select}=useStyleSelection();
 const registry=config.styleRegistry??DEFAULT_STYLE_REGISTRY;
 const [error,setError]=useState<string|null>(null);
 const [rendered,setRendered]=useState<Record<string,string>>({});
 const [rawProperty,setRawProperty]=useState('');
 const [rawValue,setRawValue]=useState('');
 const [gradientStart,setGradientStart]=useState('#ffffff');
 const [gradientEnd,setGradientEnd]=useState('#000000');
 const tokenId=useId();
 const id=mount.selectedNodeId;
 const node=id!==null?mount.getNode(id) as Node|null:null;
 const attrs=node?.attrs??{};
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
 if(!node||id===null)return <div data-frame-region="inspector" data-frame-inspector-empty="">Select a block to edit</div>;
 const write=(property:string,value:string|null)=>{
  try{
   if(canvasSelection.commands)canvasSelection.commands.editStyle(selected,selection,property,value);
   else {const next=validatedEdit(style,selection,property,value,registry);mount.setNodeAttrs(id,{...attrs,bdStyle:next});}
   setError(null);
  }
  catch(e){setError(e instanceof Error?e.message:String(e));}
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
   <label>{property} token<select aria-label={`${property} token`} value={tokens.includes(value)?value:''} onChange={event=>{if(event.target.value)write(property,event.target.value);}}>
    <option value="">Custom value</option>{tokens.map(token=><option key={token} value={token}>{token} {resolve(token)!==token?`(${resolve(token)})`:''}</option>)}</select></label>
   <label>{property}<input aria-label={property} list={tokenId} key={`${id}:${selection.breakpoint}:${selection.state}:${property}:${value}`} defaultValue={value}
    placeholder={mixed?'Mixed values':inherited?.value||rendered[property]||'Unset'} onBlur={event=>{if(event.target.value!==value)write(property,event.target.value||null);}}/></label>
   {mixed&&<small>{property}: Mixed values</small>}
   <small>{inherited?`${inherited.layer}: ${resolve(inherited.value)}`:rendered[property]?`Rendered / inherited: ${rendered[property]}`:'No value'}</small>
   {(property==='color'||property.endsWith('-color'))&&<ColourControls property={property} value={value||inherited?.value||rendered[property]||'#000000'} onChange={value=>write(property,value)} onError={setError}/>}
   <div><button type="button" onClick={()=>write(property,null)}>Unset {property}</button>
    <button type="button" onClick={event=>{const input=event.currentTarget.closest('div')?.parentElement?.querySelector('input');input?.focus();}}>Edit {property} as text</button>
    <button type="button" onClick={()=>{void navigator.clipboard?.writeText(`${property}: ${value||inherited?.value||rendered[property]||''};`).catch(()=>setError('Could not copy declaration'));}}>Copy {property}</button></div>
  </div>;
 };
 return <div data-frame-region="inspector" data-node-type={node.type} style={{padding:12,overflow:'auto'}}>
  {error&&<p role="alert">{error}</p>}
  {selected.length<=1&&<BindingInspector key={id} path={id}/>}
  {selected.length>1&&<p>{selected.length} blocks selected — Block Style edits apply together.</p>}
  {effectiveDeclaration(style,'display',{breakpoint:selection.breakpoint,state:null},registry)?.value==='none'&&<p>Hidden for visitors at {selection.breakpoint?`${selection.breakpoint}+`:'all widths'} after publish. An earlier layer may still hide this block when this override is cleared.</p>}
  {selected.length<=1&&<section aria-label="Element properties"><h3>{node.type} properties</h3><SchemaForm key={id} schema={{...node.attrsSchema,properties}} formData={props}
   uiSchema={{'ui:submitButtonOptions':{norender:true}}} onChange={(event:{formData?:unknown})=>mount.setNodeAttrs(id,{...(event.formData as Record<string,unknown>),...(Object.hasOwn(attrs,'className')?{className:attrs.className}:{}),bdStyle:style})}/></section>}
  {selected.length<=1&&config.mediaLibrary&&Object.entries(properties).filter(([name,schema])=>
    (node.type==='img'&&name==='src')||(schema as Record<string,unknown>)?.['x-component-prop-type']==='image'
  ).map(([name])=><MediaPicker key={`${id}:${name}`} label={name} library={config.mediaLibrary!}
    onChoose={url=>{const current=mount.getNode(id) as Node|null;if(current)mount.setNodeAttrs(id,{...current.attrs,[name]:url});}}/>)}
  {!rootStyles?<p>Style panels are unavailable: this component does not declare root-style forwarding.</p>:<>
   <label>Breakpoint<select aria-label="Breakpoint" value={selection.breakpoint??''} onChange={event=>select({...selection,breakpoint:event.target.value||null})}>
    <option value="">Base</option>{Object.entries(registry.breakpoints).map(([name,width])=><option key={name} value={name}>{name} ({width})</option>)}</select></label>
   <label>State<select aria-label="State" value={selection.state??''} onChange={event=>select({...selection,state:event.target.value||null})}>
    <option value="">Default</option>{Object.keys(registry.states).map(name=><option key={name}>{name}</option>)}</select></label>
   <p>Layout-width preview only, capped by available space. Media-query styles follow the browser viewport; states are edited here, not simulated.</p>
   <datalist id={tokenId}>{tokens.map(token=><option key={token} value={token}>{resolve(token)}</option>)}</datalist>
   {Object.entries(PANELS).map(([name,fields])=><details key={name}><summary>{name}</summary>{fields.map(field)}</details>)}
   <details><summary>Gradient stops</summary>
    <label>Start colour token<select aria-label="Start colour token" value={tokens.includes(gradientStart)?gradientStart:''} onChange={event=>{if(event.target.value)setGradientStart(event.target.value);}}>
     <option value="">Custom colour</option>{tokens.map(token=><option key={token} value={token}>{token}</option>)}</select></label>
    <label>Start colour<input type={tokens.includes(gradientStart)?'text':'color'} value={gradientStart} onChange={event=>setGradientStart(event.target.value)}/></label>
    <label>End colour token<select aria-label="End colour token" value={tokens.includes(gradientEnd)?gradientEnd:''} onChange={event=>{if(event.target.value)setGradientEnd(event.target.value);}}>
     <option value="">Custom colour</option>{tokens.map(token=><option key={token} value={token}>{token}</option>)}</select></label>
    <label>End colour<input type={tokens.includes(gradientEnd)?'text':'color'} value={gradientEnd} onChange={event=>setGradientEnd(event.target.value)}/></label>
    <button type="button" onClick={()=>write('background-image',`linear-gradient(${gradientStart}, ${gradientEnd})`)}>Apply gradient</button>
   </details>
   <details><summary>Advanced</summary>{[...new Set(style.layers.flatMap(layer=>Object.keys(layer.declarations)))].filter(property=>!Object.values(PANELS).flat().includes(property)).map(field)}
    <label>CSS property<input value={rawProperty} onChange={event=>setRawProperty(event.target.value)}/></label>
    <label>CSS value token<select aria-label="CSS value token" value={tokens.includes(rawValue)?rawValue:''} onChange={event=>{if(event.target.value)setRawValue(event.target.value);}}>
     <option value="">Custom value</option>{tokens.map(token=><option key={token} value={token}>{token}</option>)}</select></label>
    <label>CSS value<input list={tokenId} value={rawValue} onChange={event=>setRawValue(event.target.value)}/></label><button type="button" onClick={()=>write(rawProperty,rawValue)}>Set declaration</button>
   </details>
   <section aria-label="Text contrast"><h3>Text contrast</h3><p>{ratio===null?'Contrast unknown: use opaque resolved colours.':`${ratio.toFixed(2)}:1 — ${ratio>=4.5?'meets':'below'} normal-text AA`}</p>
    {shade&&ratio!==null&&ratio<4.5&&<button type="button" onClick={()=>write('color',shade)}>Use readable shade ({shade})</button>}</section>
  </>}
 </div>;
}

function ColourControls({property,value,onChange,onError}:{property:string;value:string;onChange:(value:string)=>void;onError:(error:string)=>void}){
 const parsed=colourInput(value);
 const alpha=parsed?.alpha??1;
 const hex=parsed?.hex??'#000000';
 const change=(colour:string,opacity:number)=>onChange(opacity===1?colour:`rgb(${[1,3,5].map(i=>parseInt(colour.slice(i,i+2),16)).join(' ')} / ${opacity})`);
 const EyeDropper=(globalThis as unknown as {EyeDropper?:new()=>{open:()=>Promise<{sRGBHex:string}>}}).EyeDropper;
 return <div>
  {!parsed&&<small>Use the text or token field for this colour format.</small>}
  <label>{property} colour<input type="color" aria-label={`${property} colour`} value={hex} disabled={!parsed} onChange={event=>change(event.target.value,alpha)}/></label>
  <label>{property} alpha<input type="number" aria-label={`${property} alpha`} min="0" max="1" step="0.05" value={alpha} disabled={!parsed} onChange={event=>{const next=Number(event.target.value);if(Number.isFinite(next)&&next>=0&&next<=1){change(hex,next);}}}/></label>
  {EyeDropper?<button type="button" onClick={()=>{void new EyeDropper().open().then(result=>change(result.sRGBHex,alpha)).catch(error=>{if(error?.name!=='AbortError')onError('Could not sample colour');});}}>Pick {property} from screen</button>:<small>Screen eyedropper unavailable in this browser.</small>}
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
