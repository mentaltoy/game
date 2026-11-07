import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSupportLockedAscent} from '../dist/stair-study/support-locked-v13.mjs';
import {STAIR_STANDARD} from '../dist/stair-study/stair-standard.mjs';

const frames=JSON.parse(fs.readFileSync(new URL('../dist/stair-study/frames.json',import.meta.url))).frames;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

test('the painted supporting foot stays on one tread throughout each step at 30/60/120 Hz',()=>{
  for (const height of [180,266,360]) for (const fps of [30,60,120]) {
    const anchor={x:976.2,y:750},g=createSupportLockedAscent({frames,anchor,steps:8,height});
    for(let tick=0;tick<=Math.ceil(8*STAIR_STANDARD.stepSeconds*fps);tick++) {
      const p=Math.min(8,tick/fps/STAIR_STANDARD.stepSeconds),d=g.placement(p),step=Math.floor(p);
      const support=step%2===0?'R':'L',sole=frames[d.frameIndex].feet[support];
      assert.equal(d.support,support);
      near(d.origin.x+sole.x*d.scale,anchor.x+step*30*height/266);
      near(d.origin.y+sole.y*d.scale,anchor.y-step*21*height/266);
    }
  }
});

test('holding a drawing no longer translates the planted sole or the whole image',()=>{
  const g=createSupportLockedAscent({frames,anchor:{x:976.2,y:750}});
  for (const start of [0,.25,.4,.7,1,1.25,1.4,1.8]) {
    const a=g.placement(start),b=g.placement(start+.02);
    assert.equal(a.frameIndex,b.frameIndex);
    assert.deepEqual(a.origin,b.origin);
  }
});

test('support transfers once, on the next landing drawing, with no premature switch',()=>{
  const g=createSupportLockedAscent({frames,anchor:{x:976.2,y:750},steps:6});
  for(let step=1;step<=6;step++) {
    const before=g.placement(step-1e-7),at=g.placement(step);
    assert.equal(before.supportIndex,step);
    assert.equal(at.supportIndex,step+1);
    assert.notEqual(before.support,at.support);
    assert.equal(at.frameIndex,step%2===0?0:8);
  }
});

test('the same authored ascent works on translated stairs without accumulating drift',()=>{
  const a=createSupportLockedAscent({frames,anchor:{x:100,y:800},steps:10});
  const b=createSupportLockedAscent({frames,anchor:{x:910,y:240},steps:10});
  for(let i=0;i<=1000;i++) {
    const x=a.placement(i/100),y=b.placement(i/100);
    assert.equal(x.frameIndex,y.frameIndex);
    near(y.origin.x-x.origin.x,810);near(y.origin.y-x.origin.y,-560);
  }
});
