import type {JsonBlock,JsonDoc,JsonNode} from '../blockdoc/json';

/** ADR-0228 EP-14: editing metadata on the same profile; never a second admission vocabulary. */
export type ProseRole = 'block'|'container'|'mark'|'inline'|'cell';
export interface ProseProfile { nodes: {name:string}[]; 'x-prose'?: Record<string,string> }
export interface ProseMark {type:string;attrs?:Record<string,unknown>}
export interface ProseNode {type:string;text?:string;attrs?:Record<string,unknown>;marks?:ProseMark[];content?:ProseNode[]}
const clone=<T,>(value:T):T=>JSON.parse(JSON.stringify(value)) as T;
const roles=new Set(['block','container','mark','inline','cell']);
export function proseRole(name:string|null,profile:ProseProfile):ProseRole|undefined {
 if(!name||!profile.nodes.some(n=>n.name===name)) return;
 const role=profile['x-prose']?.[name];
 return role&&roles.has(role)?role as ProseRole:undefined;
}
const shell=(node:JsonBlock)=>{const {children,...rest}=clone(node);return rest;};
const fresh=(name:string):JsonBlock=>({kind:'block',name,isComponent:/^[A-Z]/.test(name),dynamic:false,props:[],children:[],id:crypto.randomUUID()} as JsonBlock);

/** Layout, opaque content and undeclared host components end a run. Cells never share one. */
export function proseRuns(doc:JsonDoc,profile:ProseProfile):{start:number;end:number}[] {
 const result:{start:number;end:number}[]=[];
 let start=-1;
 const flush=(end:number)=>{if(start>=0)result.push({start,end});start=-1;};
 doc.forEach((node,index)=>{
  const role=node.kind==='block'?proseRole(node.name,profile):undefined;
  if(role==='cell'){flush(index);result.push({start:index,end:index+1});}
  else if(role==='block'||role==='container'){if(start<0)start=index;}
  else flush(index);
 });flush(doc.length);return result;
}

/** Inline JsonDoc blocks become editing marks; their entire non-child payload survives in attrs. */
export function toProse(doc:JsonDoc,profile:ProseProfile):ProseNode {
 let boundary=0;
 const inline=(nodes:JsonNode[],marks:ProseMark[]=[]):ProseNode[]=>nodes.flatMap(node=>{
  if(node.kind==='text') {
   // A boundary mark preserves adjacent JsonDoc text leaves even when PM coalesces text.
   const textMark={type:'beamTextBoundary',attrs:{key:++boundary}};
   return node.value?[{type:'text',text:node.value,marks:[...marks,textMark]}]:[{type:'beamEmpty',attrs:{text:true},marks}];
  }
  if(node.kind!=='block')throw new Error('Opaque content cannot be edited as prose.');
  const role=proseRole(node.name,profile);
  if(role==='mark') {
   const nested=[...marks,{type:node.name!,attrs:{beam:shell(node),depth:marks.length}}];
   return node.children.length?inline(node.children,nested):[{type:'beamEmpty',attrs:{text:false},marks:nested}];
  }
  if(role==='inline'&&!node.children.length)return [{type:node.name!,attrs:{beam:shell(node)},marks}];
  throw new Error(`Node ${node.name} is not declared inline prose.`);
 });
 const blocks=(nodes:JsonNode[]):ProseNode[]=>nodes.map(node=>{
  if(node.kind!=='block')throw new Error('A prose run requires declared blocks.');
  const role=proseRole(node.name,profile);
  if(role!=='block'&&role!=='container'&&role!=='cell')throw new Error(`Node ${node.name} is not declared block prose.`);
  if(role==='block')return {type:node.name!,attrs:{beam:shell(node),id:(node as JsonBlock & {id?:string}).id??null},content:inline(node.children)};
  const content:ProseNode[]=[];
  let pending:JsonNode[]=[];
  const flush=()=>{if(pending.length){content.push({type:'beamInlineRun',content:inline(pending)});pending=[];}};
  for(const child of node.children){
   const childRole=child.kind==='block'?proseRole(child.name,profile):undefined;
   if(child.kind==='text'||childRole==='mark'||childRole==='inline')pending.push(child);
   else {flush();content.push(...blocks([child]));}
  }
  flush();
  return {type:node.name!,attrs:{beam:shell(node),id:(node as JsonBlock & {id?:string}).id??null},content};
 });
 return {type:'doc',content:blocks(doc)};
}

export function fromProse(doc:ProseNode,profile:ProseProfile):JsonDoc {
 const seen=new Set<string>();
 const restore=(name:string,attrs?:Record<string,unknown>):JsonBlock=>{
  const block={...(attrs?.beam?clone(attrs.beam) as JsonBlock:fresh(name)),children:[]} as JsonBlock & {id?:string};
  if(typeof attrs?.id==='string')block.id=attrs.id;
  if(block.id){if(seen.has(block.id))block.id=crypto.randomUUID();seen.add(block.id);}
  if(name==='a'&&typeof attrs?.href==='string'){
   block.props=block.props.filter(p=>p.name!=='href');block.props.push({kind:'string',name:'href',value:attrs.href});
  }
  return block;
 };
 const inline=(nodes:ProseNode[]):JsonNode[]=>{
  const roots:JsonNode[]=[];
  let active:{key:string;block:JsonBlock}[]=[];
  let previousTextKey:unknown;
  for(const node of nodes){
   const marks=(node.marks??[]).filter(m=>m.type!=='beamTextBoundary').sort((a,b)=>Number(a.attrs?.depth??0)-Number(b.attrs?.depth??0));
   let shared=0;
   while(shared<marks.length&&shared<active.length&&active[shared].key===JSON.stringify(marks[shared]))shared++;
   active=active.slice(0,shared);
   for(let i=shared;i<marks.length;i++){
    const mark=marks[i];
    if(proseRole(mark.type,profile)!=='mark')throw new Error(`Undeclared prose mark ${mark.type}`);
    const block=restore(mark.type,mark.attrs);
    (active.length?active[active.length-1].block.children:roots).push(block);
    active.push({key:JSON.stringify(mark),block});
   }
   const target=active.length?active[active.length-1].block.children:roots;
   const textKey=node.marks?.find(m=>m.type==='beamTextBoundary')?.attrs?.key;
   if(node.type==='text'){
    const previous=target[target.length-1];
    if(previous?.kind==='text'&&textKey===previousTextKey)previous.value+=node.text??'';
    else target.push({kind:'text',value:node.text??''});
   } else if(node.type==='beamEmpty') {
    if(node.attrs?.text)target.push({kind:'text',value:''});
   } else {
    if(proseRole(node.type,profile)!=='inline')throw new Error(`Undeclared inline prose ${node.type}`);
    target.push(restore(node.type,node.attrs));
   }
   previousTextKey=textKey;
  }
  return roots;
 };
 const blocks=(nodes:ProseNode[]):JsonDoc=>nodes.flatMap(node=>{
  if(node.type==='beamInlineRun')return inline(node.content??[]);
  const role=proseRole(node.type,profile);
  if(role!=='block'&&role!=='container'&&role!=='cell')throw new Error(`Undeclared prose block ${node.type}`);
  const block=restore(node.type,node.attrs);
  block.children=role==='block'?inline(node.content??[]):blocks(node.content??[]);
  return [block];
 });
 if(doc.type!=='doc')throw new Error('A prose document must have a doc root.');
 return blocks(doc.content??[]);
}

/** Compile editing structure solely from the profile roles. Original admission entries stay untouched. */
export function proseManifest(profile:ProseProfile) {
 const properties={beam:{default:null},depth:{default:0}};
 const nodes=profile.nodes.flatMap(node=>{
  const role=proseRole(node.name,profile);
  if(!role||role==='mark')return [];
  return [{name:node.name,group:role==='inline'?'inline':'block',category:role==='inline'?'proseInline':'proseBlock',
   admitsChildCategories:null,admitsText:role==='block',
   contentExpression:role==='inline'?'':role==='block'?'inline*':(node.name==='ul'||node.name==='ol')?'li*':'proseBlock*',
   attrsSchema:{type:'object',properties}}];
 });
 nodes.push({name:'beamInlineRun',group:'block',category:'proseBlock',admitsChildCategories:null,admitsText:true,contentExpression:'inline*',attrsSchema:{type:'object',properties}},
 {name:'beamEmpty',group:'inline',category:'proseInline',admitsChildCategories:null,admitsText:false,contentExpression:'',attrsSchema:{type:'object',properties:{...properties,text:{default:false}}} } as typeof nodes[number]);
 const marks=profile.nodes.filter(node=>proseRole(node.name,profile)==='mark').map(node=>({name:node.name,excludes:'',attrsSchema:{type:'object',properties:{...properties,href:{default:null}}}}));
 return {profile:'prose-editing',version:1,'x-prose':profile['x-prose'] as Record<string,ProseRole>,doc:{admitsChildCategories:['proseBlock']},nodes,
 marks:[...marks,{name:'beamTextBoundary',excludes:'',attrsSchema:{type:'object',properties:{key:{default:null}}}}]};
}
