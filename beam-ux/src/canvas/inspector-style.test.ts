import {expect,it} from 'vitest';
import {effectiveDeclaration,editDeclaration,contrastRatio,readableShade} from './inspector-style';
import {DEFAULT_STYLE_REGISTRY} from '../blockdoc/style-runtime';
import type {BlockStyle} from '../blockdoc/style';

it('resolves inherited values in emitted CSS order and preserves other layers',()=>{
 const style={layers:[{declarations:{color:'red'}},{breakpoint:'md',declarations:{color:'blue'}},{breakpoint:'md',state:'hover',declarations:{color:'green'}}]};
 expect(effectiveDeclaration(style,'color',{breakpoint:'lg',state:'hover'},DEFAULT_STYLE_REGISTRY)).toMatchObject({value:'green',layer:'md / hover'});
 expect(effectiveDeclaration(style,'color',{breakpoint:null,state:null},DEFAULT_STYLE_REGISTRY)).toMatchObject({value:'red',layer:'Base'});
 const next=editDeclaration(style,{breakpoint:'lg',state:'hover'},'color','var(--brand)');
 expect(next.layers.slice(0,3)).toEqual(style.layers);
 expect(effectiveDeclaration(next,'color',{breakpoint:'lg',state:'hover'},DEFAULT_STYLE_REGISTRY)?.value).toBe('var(--brand)');
 expect(editDeclaration(next,{breakpoint:'lg',state:'hover'},'color',null)).toEqual(style);
});
it('unsets every declaration for the selected layer without resurrecting duplicate values',()=>{
 const style:BlockStyle={layers:[{declarations:{color:'red',padding:'1rem'}},{declarations:{color:'blue'}}]};
 expect(editDeclaration(style,{breakpoint:null,state:null},'color',null)).toEqual({layers:[{declarations:{padding:'1rem'}}]});
});
it('calculates contrast and suggests a readable shade, refusing unresolved colours',()=>{
 expect(contrastRatio('#000000','#ffffff')).toBeCloseTo(21);
 expect(contrastRatio('var(--unresolved)','#fff')).toBeNull();
 const shade=readableShade('#888888','#ffffff');
 expect(shade).not.toBeNull();
 expect(contrastRatio(shade!,'#fff')).toBeGreaterThanOrEqual(4.5);
});
