import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {getRoomStairs} from '../../dist/room-layout.js';
import {createAscentGeometry,auditAscentGeometry} from './ascent-cycle.mjs';
import {createAscentMotion,updateAscentMotion,getAscentPose} from './ascent-motion.mjs';
const guide=JSON.parse(await fs.readFile(new URL('./curved-sixteen-targets.json',import.meta.url),'utf8'));
const frames=guide.frames.map(f=>({id:`ideal-${f.cell}`,crown:f.sourceHead,feet:{R:f.sourceR,L:f.sourceL}}));
const nodes=getRoomStairs(),geometry=createAscentGeometry({nodes,frames});

test('body trajectory remains C1 at actual contact and passing keys',()=>{
  const eps=1e-6;
  for(const k of geometry.keys.slice(1,-1)) {
    const before=geometry.sample(k.at-eps),after=geometry.sample(k.at+eps);
    for(const axis of ['x','y']) {
      assert.ok(Math.abs(before.head[axis]-after.head[axis])<.001);
      assert.ok(Math.abs(before.derivative[axis]-after.derivative[axis])<.003);
    }
  }
});
test('both anatomical legs alternate over successive real treads',()=>{
  for(let i=1;i<5;i++) {
    const drawing=geometry.placement(i+.5);
    assert.equal(drawing.support,(i-1)%2===0?'R':'L');
    assert.equal(drawing.feet[drawing.support].nodeIndex,i);
    assert.equal(drawing.frameIndex,(i-1)%2===0?4:12);
  }
});
test('held frames expose drift; no body freeze or backwards cell selection is hidden',()=>{
  const report=auditAscentGeometry(geometry);
  assert.equal(report.heldBodyFrames,0);
  assert.equal(report.backwardSelections,0);
  assert.ok(report.maxContactErrorY>3.5,'The higher first rise still needs dedicated art; do not certify this guide as final.');
  assert.ok(report.switches.length>=30);
});
test('release stops at the next split stance without gathering onto a flat pose',()=>{
  const state=createAscentMotion({nodes});
  while(state.progress<2.3)updateAscentMotion(state,1,1/60);
  for(let i=0;i<120;i++)updateAscentMotion(state,0,1/60);
  const pose=getAscentPose(state);
  assert.equal(pose.ascentProgress,3);assert.equal(pose.mode,'contact-hold');assert.equal(pose.facing,1);
  const drawing=geometry.placement(pose.ascentProgress);
  assert.equal(drawing.feet.R.nodeIndex,3);assert.equal(drawing.feet.L.nodeIndex,2);
});
test('missing reverse and landing transitions are explicit, never an instant flip/exit',()=>{
  const state=createAscentMotion({nodes,index:3});
  updateAscentMotion(state,-1,1/60);
  assert.equal(getAscentPose(state).requiresTransition,'stair-reversal');assert.equal(state.progress,3);
  assert.equal(getAscentPose(state).facing,1);
  updateAscentMotion(state,1,1/60);
  assert.equal(state.requiresTransition,null);
  for(let i=0;i<180;i++)updateAscentMotion(state,1,1/60);
  const pose=getAscentPose(state);
  assert.equal(pose.ascentProgress,5);assert.equal(pose.requiresTransition,'landing-gather');assert.equal(pose.exitDirection,0);
});
test('rapid input does not freeze in flight or lose the held contact',()=>{
  const state=createAscentMotion({nodes});
  for(let i=0;i<120;i++)updateAscentMotion(state,i%3===0?-1:1,1/120);
  for(let i=0;i<240;i++)updateAscentMotion(state,0,1/120);
  assert.equal(state.progress,Math.round(state.progress));assert.equal(state.rate,0);assert.equal(state.mode,'contact-hold');
});
