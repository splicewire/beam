import {lazy,Suspense} from 'react';
import type {JsonDoc} from '../blockdoc/json';
import {CanvasNode,type CanvasNodeProps} from './CanvasNode';
import {useCanvas,isEditGated} from './context';
import {proseRuns,toProse} from './prose';
const ProseRun=lazy(()=>import('./ProseRun'));
export type ProseChange=(parent:string,start:number,end:number,body:JsonDoc)=>void;
export function CanvasSiblings({nodes,parent,editing,onEditProse,...props}:{nodes:JsonDoc;parent:string;onEditProse?:ProseChange}&Omit<CanvasNodeProps,'node'|'path'|'onEditProse'>){
 const config=useCanvas();
 const path=(index:number)=>parent?`${parent}.${index}`:String(index);
 const profile=config.profile;
 let run: {start:number;end:number}|undefined;
 if(profile&&editing&&onEditProse){
  run=proseRuns(nodes,profile).find(r=>Array.from({length:r.end-r.start},(_,i)=>path(r.start+i)).some(p=>editing===p||editing.startsWith(`${p}.`)));
  if(run){
   const body=nodes.slice(run.start,run.end);
   const gated=(doc:JsonDoc):boolean=>doc.some(n=>n.kind==='block'&&(isEditGated(config,n)||gated(n.children)));
   try{if(gated(body))run=undefined;else toProse(body,profile);}catch{run=undefined;}
  }
 }
 return <>{nodes.map((node,index)=>{
  if(run&&index>=run.start&&index<run.end){
   if(index!==run.start)return null;
   const {start,end}=run;
   return <div key={path(index)} data-bd-path={path(index)}><Suspense fallback={<span role="status">Loading text editor…</span>}>
    <ProseRun value={nodes.slice(start,end)} profile={profile!} onChange={body=>onEditProse!(parent,start,end,body)}/>
   </Suspense></div>;
  }
  return <CanvasNode key={path(index)} node={node} path={path(index)} editing={editing} onEditProse={onEditProse} {...props}/>;
 })}</>;
}
