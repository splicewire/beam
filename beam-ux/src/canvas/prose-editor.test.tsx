// @vitest-environment jsdom
import React from 'react';
import {render,cleanup,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
import ProseRun from './ProseRun';
import profile from '../editor/default-profile.fixture.json';
import type {JsonDoc} from '../blockdoc/json';
afterEach(cleanup);
it('mounts a real rich-text blockdoc island with inline formatting and no second history',async()=>{
 const value:JsonDoc=[{kind:'block',name:'p',isComponent:false,dynamic:false,props:[],children:[{kind:'block',name:'strong',isComponent:false,dynamic:false,props:[],children:[{kind:'text',value:'bold'}]}]}];
 const onChange=vi.fn();
 const {container}=render(<ProseRun value={value} profile={profile} onChange={onChange}/>);
 await waitFor(()=>expect(container.querySelector('.ProseMirror strong')?.textContent).toBe('bold'));
 expect(container.querySelectorAll('[contenteditable=true]')).toHaveLength(1);
 expect(onChange).not.toHaveBeenCalled();
});
