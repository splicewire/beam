import {useLayoutEffect,useRef,useState,type ReactNode} from 'react';

/** Floating panels reserve only the part that intersects the host's content box. */
export function canvasClearance(left:number,right:number,leftPanelRight:number|null,rightPanelLeft:number|null){
 const width=Math.max(0,right-left);
 const l=leftPanelRight===null||leftPanelRight<=left?0:Math.min(width,leftPanelRight-left+12);
 const r=rightPanelLeft===null||rightPanelLeft>=right?0:Math.min(width,right-rightPanelLeft+12);
 // On a very narrow host, keep a usable canvas; the floating panels can be closed.
 const budget=Math.max(0,width-240), scale=l+r>budget&&l+r>0?budget/(l+r):1;
 return {marginLeft:l*scale,marginRight:r*scale};
}

export function CanvasClearance({children,panels}:{children:ReactNode;panels:string}){
 const ref=useRef<HTMLDivElement>(null);
 const [space,setSpace]=useState({marginLeft:0,marginRight:0});
 useLayoutEffect(()=>{
  const parent=ref.current?.parentElement;if(!parent)return;
  const update=()=>{
   const box=parent.getBoundingClientRect(),style=getComputedStyle(parent);
   const left=box.left+parent.clientLeft+(parseFloat(style.paddingLeft)||0);
   const right=box.left+parent.clientLeft+parent.clientWidth-(parseFloat(style.paddingRight)||0);
   const lp=parent.querySelector('.pe-left'),rp=parent.querySelector('.pe-versions,.pe-clear,.pe-right');
   const next=canvasClearance(left,right,lp?.getBoundingClientRect().right??null,rp?.getBoundingClientRect().left??null);
   setSpace(old=>old.marginLeft===next.marginLeft&&old.marginRight===next.marginRight?old:next);
  };
  update();
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(update);
  observer?.observe(parent);window.addEventListener('resize',update);
  return()=>{observer?.disconnect();window.removeEventListener('resize',update);};
 },[panels]);
 return <div ref={ref} className="pe-canvas" style={space}>{children}</div>;
}
