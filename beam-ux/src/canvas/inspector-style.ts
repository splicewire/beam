import type {BlockStyle} from '../blockdoc/style';
import {compileBlockStyle, type StyleRegistry} from '../blockdoc/style-runtime';
export interface StyleSelection {breakpoint: string|null; state: string|null}
const matches=(layer:StyleSelection,selected:StyleSelection)=>
 (layer.breakpoint??null)===selected.breakpoint&&(layer.state??null)===selected.state;
const width=(value:string)=>parseFloat(value)*(value.endsWith('px')?1:16);

/** Match the compiler's emitted order; later applicable declarations win. */
export function effectiveDeclaration(style:BlockStyle,property:string,selected:StyleSelection,registry:StyleRegistry) {
 let found:{value:string;layer:string}|undefined;
 const max=selected.breakpoint?width(registry.breakpoints[selected.breakpoint]):0;
 for(const layer of style.layers){
  if(layer.breakpoint&&width(registry.breakpoints[layer.breakpoint])>max)continue;
  if(layer.state&&layer.state!==selected.state)continue;
  if(Object.hasOwn(layer.declarations,property))found={value:layer.declarations[property],layer:[layer.breakpoint??'Base',layer.state].filter(Boolean).join(' / ')};
 }
 return found;
}
export function editDeclaration(style:BlockStyle,selected:StyleSelection,property:string,value:string|null):BlockStyle {
 const layers=style.layers.map(layer=>{
  const declarations={...layer.declarations};
  if(matches({breakpoint:layer.breakpoint??null,state:layer.state??null},selected))delete declarations[property];
  return {...layer,declarations};
 }).filter(layer=>Object.keys(layer.declarations).length);
 if(value!==null&&value!==''){
  const found=[...layers].reverse().find(layer=>matches({breakpoint:layer.breakpoint??null,state:layer.state??null},selected));
  if(found)found.declarations[property]=value;
  else layers.push({...selected,declarations:{[property]:value}});
 }
 return {layers};
}
export function validatedEdit(style:BlockStyle,selected:StyleSelection,property:string,value:string|null,registry:StyleRegistry){
 const next=editDeclaration(style,selected,property,value);
 compileBlockStyle(next,registry);
 return next;
}

function rgb(value:string):number[]|null {
 const hex=/^#([a-f\d]{3}|[a-f\d]{6})$/i.exec(value.trim());
 if(hex){const full=hex[1].length===3?[...hex[1]].map(c=>c+c).join(''):hex[1];return [0,2,4].map(i=>parseInt(full.slice(i,i+2),16));}
 const match=/^rgb\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)\s*\)$/i.exec(value.trim());
 return match&&match.slice(1).every(v=>+v<=255)?match.slice(1).map(Number):null;
}
const luminance=(channels:number[])=>channels.map(x=>{const c=x/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((v,c,i)=>v+c*[.2126,.7152,.0722][i],0);
export function contrastRatio(foreground:string,background:string):number|null {
 const a=rgb(foreground),b=rgb(background);if(!a||!b)return null;
 const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
export function readableShade(foreground:string,background:string):string|null {
 const start=rgb(foreground);if(!start||!rgb(background))return null;
 if((contrastRatio(foreground,background)??0)>=4.5)return foreground;
 const target=(contrastRatio('#000000',background)??0)>(contrastRatio('#ffffff',background)??0)?0:255;
 for(let step=1;step<=100;step++){
  const shade='#'+start.map(c=>Math.round(c+(target-c)*step/100).toString(16).padStart(2,'0')).join('');
  if((contrastRatio(shade,background)??0)>=4.5)return shade;
 }
 return null;
}
