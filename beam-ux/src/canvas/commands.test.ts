import {expect,it} from 'vitest';
import {duplicateAt,type JsonBlock} from '../blockdoc/json';
import {clipboardText,parseClipboard,pasteBlocks,wrapBlocks,unwrapBlock,editStyles,selectionRoots,assertPasteProfile} from './commands';
import {DEFAULT_STYLE_REGISTRY} from '../blockdoc/style-runtime';
const block=(id:string,children:JsonBlock[]=[]):JsonBlock=>({kind:'block',id,name:'div',isComponent:false,dynamic:false,props:[],children});
it('duplicate mints recursive UUIDv7 ids without changing the source',()=>{
 const source=block('old',[block('child')]);const result=duplicateAt([source],'0');
 const copy=result[1] as JsonBlock;
 expect(copy.id).toMatch(/^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/);
 expect((copy.children[0] as JsonBlock).id).not.toBe('child');expect(source.id).toBe('old');
});
it('clipboard roundtrip pastes fresh ids and retains source props/styles',()=>{
 const a=block('a');a.props=[{name:'title',kind:'string',value:'hello'}];
 const clip=parseClipboard(clipboardText([a],['0']));
 const result=pasteBlocks([block('target')],'0',clip);
 expect((result[0] as JsonBlock).children[0]).toMatchObject({props:a.props});
 expect(((result[0] as JsonBlock).children[0] as JsonBlock).id).not.toBe('a');
 expect(()=>parseClipboard('{"version":1,"nodes":[{}]}')).toThrow();
});
it('wrap requires contiguous siblings and unwrap preserves child identity',()=>{
 const doc=[block('a'),block('b'),block('c')];
 const wrapped=wrapBlocks(doc,['0','1'],'flex');
 expect((wrapped[0] as JsonBlock).style?.layers[0].declarations.display).toBe('flex');
 expect(unwrapBlock(wrapped,'0')).toEqual(doc);
 expect(()=>wrapBlocks(doc,['0','2'],'grid')).toThrow(/contiguous/);
 expect(selectionRoots(['0','0.1','2','2'])).toEqual(['0','2']);
});
it('multi-style edit preserves unrelated declarations and is atomic on invalid CSS',()=>{
 const a=block('a');a.style={layers:[{declarations:{color:'red',display:'grid'}}]};
 const doc=[a,block('b')];
 const result=editStyles(doc,['0','1'],{breakpoint:'md',state:null},'display','none',DEFAULT_STYLE_REGISTRY);
 expect((result[0] as JsonBlock).style?.layers[0].declarations.color).toBe('red');
 expect((result[1] as JsonBlock).style?.layers[0].declarations.display).toBe('none');
 expect(()=>editStyles(doc,['0','1'],{breakpoint:null,state:null},'color','red;}',DEFAULT_STYLE_REGISTRY)).toThrow();
 expect(doc[1].style).toBeUndefined();
});
it('checks the target profile recursively, including categories, attributes and code',()=>{
 const profile={profile:'test',version:1,'x-admits-code':false,doc:{admitsChildCategories:['html']},nodes:[{name:'div',category:'html',admitsChildCategories:['html'],attrsSchema:{type:'object',properties:{title:{type:'string'}},additionalProperties:false}}]};
 expect(()=>assertPasteProfile([block('ok')],profile,null)).not.toThrow();
 const unknown=block('x',[{...block('bad'),name:'Unknown'}]);
 expect(()=>assertPasteProfile([unknown],profile,null)).toThrow(/does not admit/);
 const badAttr=block('x');badAttr.props=[{name:'title',kind:'number',value:4}];
 expect(()=>assertPasteProfile([badAttr],profile,null)).toThrow(/Invalid attributes/);
 const code=block('x');code.children=[{kind:'opaque',reason:'expression',source:'{secret()}'}];
 expect(()=>assertPasteProfile([code],profile,null)).toThrow(/code/);
 expect(()=>assertPasteProfile([block('x')],{...profile,doc:{admitsChildCategories:[]}},null)).toThrow(/parent/);
 expect(()=>pasteBlocks([{...block('void'),name:'img'}],'0',[block('x')])).toThrow(/editable container/);
});
