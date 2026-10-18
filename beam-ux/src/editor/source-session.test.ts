import {expect,it} from 'vitest';
import {LocalSession} from './local-session';

it('retains unapplied source across reload and applies it as exactly one undo step',()=>{
 const session=new LocalSession({entry:'e',user:'u',base:'v1'},[{kind:'text',value:'old'}]);
 session.beginSource('old');
 session.editSource('new');
 const resumed=LocalSession.resume(session.identity,session.snapshot());
 expect(resumed.source?.text).toBe('new');
 expect(resumed.body).toEqual([{kind:'text',value:'old'}]);
 expect(()=>resumed.saved('v2')).toThrow(/Source Mode/);
 resumed.applySource([{kind:'text',value:'new'}]);
 expect(resumed.source).toBeNull();
 expect(resumed.body).toEqual([{kind:'text',value:'new'}]);
 resumed.undo();
 expect(resumed.body).toEqual([{kind:'text',value:'old'}]);
 expect(resumed.canUndo).toBe(false);
});

it('discarding source changes no body and creates no undo step',()=>{
 const session=new LocalSession({entry:'e',user:'u',base:'v1'},[]);
 session.beginSource('');session.editSource('<p>draft');session.discardSource();
 expect(session.body).toEqual([]);expect(session.canUndo).toBe(false);expect(session.dirty).toBe(false);
});

it('refuses a delayed print when the Local Session changed while printing',()=>{
 const session=new LocalSession({entry:'e',user:'u',base:'v1'},[]);
 const printedBody=session.body;
 session.change([{kind:'text',value:'newer'}]);
 expect(()=>session.beginSource('old source',printedBody)).toThrow(/changed while printing/);
 expect(session.source).toBeNull();
});
