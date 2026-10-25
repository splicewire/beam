import {createContext,useCallback,useContext,useState,type ReactNode} from 'react';
import type {JsonBlock,JsonDoc} from '../blockdoc/json';
import type {StyleSelection} from './inspector-style';
export interface CanvasCommands {
 doc:JsonDoc;
 readOnly:boolean;
 editBinding?:(path:string,change:(block:JsonBlock)=>JsonBlock)=>void;
 editStyle:(paths:string[],layer:StyleSelection,property:string,value:string|null)=>void;
}
const Context=createContext<{
 paths:string[];setPaths:(paths:string[])=>void;
 commands:CanvasCommands|null;register:(commands:CanvasCommands|null)=>void;
}>({paths:[],setPaths:()=>{},commands:null,register:()=>{}});
export function CanvasSelectionProvider({children}:{children:ReactNode}){
 const [paths,setPaths]=useState<string[]>([]);
 const [commands,setCommands]=useState<CanvasCommands|null>(null);
 const register=useCallback((next:CanvasCommands|null)=>setCommands(next),[]);
 return <Context.Provider value={{paths,setPaths,commands,register}}>{children}</Context.Provider>;
}
export const useCanvasSelection=()=>useContext(Context);
