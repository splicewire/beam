import {createContext,useContext,useState,type ReactNode} from 'react';
import type {StyleSelection} from './inspector-style';
const Context=createContext<{selection:StyleSelection;select:(next:StyleSelection)=>void}>({selection:{breakpoint:null,state:null},select:()=>{}});
export function StyleSelectionProvider({children}:{children:ReactNode}){
 const [selection,select]=useState<StyleSelection>({breakpoint:null,state:null});
 return <Context.Provider value={{selection,select}}>{children}</Context.Provider>;
}
export const useStyleSelection=()=>useContext(Context);
