import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url),prefix='splicewire-beam-transforms::messages.';
const defaults=JSON.parse(readFileSync(new URL('src/messages.defaults.json',root),'utf8'));
if(!defaults||typeof defaults!=='object'||Array.isArray(defaults)||Object.entries(defaults).some(([key,line])=>!key.startsWith(prefix)||typeof line!=='string'))throw new Error('Invalid package default lines');
const catalog={version:1,package:'@splicewire/beam-transforms',sourceLocale:'en',namespace:'splicewire-beam-transforms',sharesWith:null,messages:Object.fromEntries(Object.entries(defaults).sort(([a],[b])=>a.localeCompare(b)))};
const text=JSON.stringify(catalog,null,2)+'\n',target=new URL('messages.default.json',root);
if(process.argv.length===3&&process.argv[2]==='--write')writeFileSync(target,text);
else if(process.argv.length!==2||readFileSync(target,'utf8')!==text)throw new Error('Stale catalog; run messages:catalog:write');
const used=new Set();
function walk(dir){for(const e of readdirSync(dir,{withFileTypes:true})){const p=new URL(e.name+(e.isDirectory()?'/':''),dir);if(e.isDirectory())walk(p);else if(/\.[jt]sx?$/.test(e.name)&&!/\.(?:test|spec|stories|story|fixtures?)\.[jt]sx?$/.test(e.name)){for(const m of readFileSync(p,'utf8').matchAll(/splicewire-beam-transforms::messages\.[A-Za-z0-9_]+/g))used.add(m[0]);}}}
walk(new URL('src/',root));
const missing=[...used].filter(k=>!Object.hasOwn(defaults,k)),unused=Object.keys(defaults).filter(k=>!used.has(k));
if(missing.length||unused.length)throw new Error(JSON.stringify({missing,unused}));
console.log(JSON.stringify({catalog:fileURLToPath(target),count:Object.keys(defaults).length,missing,unused,wrote:process.argv.includes('--write')}));
