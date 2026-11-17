import {useState} from 'react';
import {isJsonBlock,type JsonDoc} from '../blockdoc/json';
import {useCanvas,isEditGated} from './context';
import {useStyleSelection} from './StyleSelection';
import {effectiveDeclaration} from './inspector-style';
import {DEFAULT_STYLE_REGISTRY} from '../blockdoc/style-runtime';
import {blockStyleFields} from './block-style';
import {useCanvasSelection} from './CanvasSelection';
import {unavailableBindings} from './unavailable-bindings';
import {useBeamUxMessages} from '../messages.js';

export function CanvasOutline({doc,onSelect,onHide}:{doc:JsonDoc;onSelect:(path:string,add:boolean)=>void;onHide:(path:string,hidden:boolean)=>void}){
 const m=useBeamUxMessages();
 const [collapsed,setCollapsed]=useState<Set<string>>(new Set());
 const selection=useCanvasSelection();const {selection:layer}=useStyleSelection();
 const config=useCanvas();const unavailable=unavailableBindings(doc,config.profile,config.bindingPreview?.recordCollection,m);const registry=config.styleRegistry??DEFAULT_STYLE_REGISTRY;
 const toggle=(path:string)=>setCollapsed(previous=>{const next=new Set(previous);next.has(path)?next.delete(path):next.add(path);return next;});
 const rows:{path:string;depth:number;name:string;hasChildren:boolean;hidden:boolean;own:boolean}[]=[];
 const walk=(nodes:JsonDoc,parent:string,depth:number)=>nodes.forEach((node,i)=>{
  if(!isJsonBlock(node))return;const path=parent?`${parent}.${i}`:String(i);
  const style=blockStyleFields(node,{schema:{},attrs:{}}).attrs.bdStyle;
  const selectedLayer={breakpoint:layer.breakpoint,state:null};
  const own=style.layers.some(l=>(l.breakpoint??null)===layer.breakpoint&&!l.state&&l.declarations.display==='none');
  const sealed=node.dynamic||isEditGated(config,node);
  rows.push({path,depth,name:node.name??'Fragment',hasChildren:!sealed&&[...node.children,...Object.values(node.slots??{}).flat()].some(isJsonBlock),own,hidden:effectiveDeclaration(style,'display',selectedLayer,registry)?.value==='none'});
  if(!sealed&&!collapsed.has(path)){walk(node.children,path,depth+1);for(const [name,children] of Object.entries(node.slots??{}))walk(children,`${path}.slots.${name}`,depth+1);}
 });walk(doc,'',1);
 const focus=(index:number,root:HTMLElement)=>root.querySelectorAll<HTMLButtonElement>('[data-outline-select]')[index]?.focus();
 return <section className="ve-outline" aria-label={m.t('splicewire-beam-ux::messages.canvas_block_outline')}><h3>{m.t('splicewire-beam-ux::messages.canvas_outline')}</h3><p>{m.t('splicewire-beam-ux::messages.canvas_outline_hide_hint',{width:layer.breakpoint?`${layer.breakpoint}+`:m.t('splicewire-beam-ux::messages.canvas_all_widths')})}</p>
 <div role="tree" aria-label={m.t('splicewire-beam-ux::messages.canvas_page_blocks')} aria-multiselectable="true">{rows.map((row,index)=><div className="ve-outline-row" role="treeitem" aria-level={row.depth} aria-selected={selection.paths.includes(row.path)} aria-expanded={row.hasChildren?!collapsed.has(row.path):undefined} key={row.path} style={{paddingInlineStart:(row.depth-1)*12}}
 onKeyDown={event=>{
  const root=event.currentTarget.parentElement!;
  if(event.key==='ArrowDown'){event.preventDefault();focus(Math.min(rows.length-1,index+1),root);}
  if(event.key==='ArrowUp'){event.preventDefault();focus(Math.max(0,index-1),root);}
  if(event.key==='ArrowLeft'){event.preventDefault();if(row.hasChildren&&!collapsed.has(row.path))toggle(row.path);else{const parent=row.path.slice(0,row.path.lastIndexOf('.'));const at=rows.findIndex(r=>r.path===parent);if(at>=0)focus(at,root);}}
  if(event.key==='ArrowRight'){event.preventDefault();if(row.hasChildren&&collapsed.has(row.path))toggle(row.path);else if(row.hasChildren)focus(index+1,root);}
  if(event.key==='Home'){event.preventDefault();focus(0,root);}if(event.key==='End'){event.preventDefault();focus(rows.length-1,root);}
 }}>
 {row.hasChildren&&<button type="button" aria-label={m.t(collapsed.has(row.path)?'splicewire-beam-ux::messages.canvas_outline_expand':'splicewire-beam-ux::messages.canvas_outline_collapse',{name:row.name,path:row.path})} onClick={()=>toggle(row.path)}>{collapsed.has(row.path)?'▸':'▾'}</button>}
 <button type="button" data-outline-select="" onClick={event=>onSelect(row.path,event.ctrlKey||event.metaKey||event.shiftKey)}>{row.name} {row.path}</button>
 <button type="button" disabled={selection.commands?.readOnly} onClick={()=>onHide(row.path,!row.own)}>{m.t(row.own?'splicewire-beam-ux::messages.canvas_outline_show':'splicewire-beam-ux::messages.canvas_outline_hide',{name:row.name,path:row.path})}</button>
 {Object.entries(unavailable).filter(([path])=>path===row.path||path.slice(0,path.lastIndexOf('.'))===row.path).map(([path,messages])=><small role="status" data-binding-unavailable={path} key={path}>{m.t('splicewire-beam-ux::messages.canvas_binding_unavailable',{messages:messages.join('; ')})}</small>)}
 {row.hidden&&<small>{m.t('splicewire-beam-ux::messages.canvas_outline_hidden_at',{width:layer.breakpoint?`${layer.breakpoint}+`:m.t('splicewire-beam-ux::messages.canvas_all_widths')})}{!row.own?` ${m.t('splicewire-beam-ux::messages.canvas_outline_inherited')}`:''}</small>}
 </div>)}</div></section>;
}
