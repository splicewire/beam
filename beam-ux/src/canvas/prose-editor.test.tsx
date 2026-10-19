// @vitest-environment jsdom
import {render,cleanup,waitFor,act,fireEvent,screen} from '@testing-library/react';
import {useState} from 'react';
import {afterEach,beforeAll,expect,it,vi} from 'vitest';
import ProseRun from './ProseRun';
import profile from '../editor/default-profile.fixture.json';
import type {JsonDoc} from '../blockdoc/json';
afterEach(cleanup);
beforeAll(()=>{
 Range.prototype.getClientRects=()=>[] as unknown as DOMRectList;
 Range.prototype.getBoundingClientRect=()=>new DOMRect();
});

it('does not setContent or move the caret on its JsonDoc echo, but applies an external edit',async()=>{
 const initial:JsonDoc=[{kind:'block',name:'h2',isComponent:false,dynamic:false,props:[],children:[{kind:'text',value:'Heading'}]}];
 function Controlled(){
  const [value,setValue]=useState(initial);
  return <><ProseRun value={value} profile={profile} onChange={setValue}/><button onClick={()=>setValue([{...initial[0],children:[{kind:'text',value:'External change'}]}] as JsonDoc)}>External</button></>;
 }
 const {container}=render(<Controlled/>);
 const dom=container.querySelector('.ProseMirror') as HTMLElement & {editor:{
  commands:{setTextSelection:(value:{from:number;to:number})=>void;insertContent:(text:string)=>void};
  commandManager:{rawCommands:{setContent:(...args:unknown[])=>unknown}};
  getText:()=>string;state:{selection:{from:number}};
 }};
 const editor=dom.editor;
 const setContent=vi.spyOn(editor.commandManager.rawCommands,'setContent');
 await act(async()=>{editor.commands.setTextSelection({from:1,to:8});});
 const sentence='Immediate heading characters';
 for(const char of sentence){
  await act(async()=>{
   editor.commands.insertContent(char);
   await new Promise(resolve=>setTimeout(resolve,5));
  });
 }
 expect(editor.getText()).toBe(sentence);
 expect(editor.state.selection.from).toBe(sentence.length+1);
 expect(setContent).not.toHaveBeenCalled();
 fireEvent.click(screen.getByRole('button',{name:'External'}));
 await waitFor(()=>expect(editor.getText()).toBe('External change'));
 expect(setContent).toHaveBeenCalledTimes(1);
});
it('mounts a real rich-text blockdoc island with inline formatting and no second history',async()=>{
 const value:JsonDoc=[{kind:'block',name:'p',isComponent:false,dynamic:false,props:[],children:[{kind:'block',name:'strong',isComponent:false,dynamic:false,props:[],children:[{kind:'text',value:'bold'}]}]}];
 const onChange=vi.fn();
 const {container}=render(<ProseRun value={value} profile={profile} onChange={onChange}/>);
 await waitFor(()=>expect(container.querySelector('.ProseMirror strong')?.textContent).toBe('bold'));
 expect(container.querySelectorAll('[contenteditable=true]')).toHaveLength(1);
 await waitFor(()=>expect(document.activeElement).toBe(container.querySelector('[contenteditable=true]')));
 expect(onChange).not.toHaveBeenCalled();
});

it('pastes rich paragraphs and lists through blockdoc and emits inline JsonDoc blocks',async()=>{
 const onChange=vi.fn();
 const {container}=render(<ProseRun value={[{kind:'block',name:'p',isComponent:false,dynamic:false,props:[],children:[]}]} profile={profile} onChange={onChange}/>);
 const editor=container.querySelector('.ProseMirror') as HTMLElement;
 const html='<p>One <strong>bold</strong> and <a href="/hello">link</a></p><ul><li><p>List</p></li></ul>';
 const event=new Event('paste',{bubbles:true,cancelable:true});
 Object.defineProperty(event,'clipboardData',{value:{getData:(type:string)=>type==='text/html'?html:'One bold and link\nList',files:[]}});
 editor.dispatchEvent(event);
 await waitFor(()=>expect(onChange).toHaveBeenCalled());
 const doc=JSON.stringify(onChange.mock.calls.at(-1)![0]);
 expect(doc).toContain('"name":"strong"');expect(doc).toContain('"name":"a"');expect(doc).toContain('/hello');expect(doc).toContain('"name":"ul"');expect(doc).toContain('List');
});
