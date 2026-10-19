// @vitest-environment jsdom
import {render,cleanup,waitFor} from '@testing-library/react';
import {afterEach,beforeAll,expect,it,vi} from 'vitest';
import ProseRun from './ProseRun';
import profile from '../editor/default-profile.fixture.json';
import type {JsonDoc} from '../blockdoc/json';
afterEach(cleanup);
beforeAll(()=>{
 Range.prototype.getClientRects=()=>[] as unknown as DOMRectList;
 Range.prototype.getBoundingClientRect=()=>new DOMRect();
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
