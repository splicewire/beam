import {expect,it} from 'vitest';
import {canvasClearance} from './CanvasClearance';
it('preserves full-width clearance but does not subtract off-canvas panels from a prose host',()=>{
 expect(canvasClearance(0,1440,200,1140)).toEqual({marginLeft:212,marginRight:312});
 expect(canvasClearance(280,1000,200,980)).toEqual({marginLeft:0,marginRight:32});
 expect(canvasClearance(300,900,200,980)).toEqual({marginLeft:0,marginRight:0});
});
it('retains canvas space when both floating panels cover a narrow host',()=>{
 const value=canvasClearance(0,400,200,100);
 expect(400-value.marginLeft-value.marginRight).toBeCloseTo(240);
});
