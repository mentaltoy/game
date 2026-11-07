import test from 'node:test';
import assert from 'node:assert/strict';
import { createStairMotion, updateStairMotion, getStairPose } from '../dist/stair-motion.js';
import { getRoomStairs } from '../dist/room-layout.js';

const nodes=getRoomStairs(), make=options=>createStairMotion({nodes,height:266,...options});
function run(state,input,seconds,frequency=120) {
  for(let i=0;i<Math.ceil(seconds*frequency);i++) updateStairMotion(state,input,1/frequency);
  return getStairPose(state);
}
function verifySupports(pose) {
  for(const foot of pose.feet) if(foot.planted) {
    assert.ok(Number.isInteger(foot.nodeIndex));
    assert.equal(foot.x,nodes[foot.nodeIndex].x);
    assert.equal(foot.y,nodes[foot.nodeIndex].y);
  }
  assert.ok(pose.feet.some(foot=>foot.planted),'At least one shoe must support the body.');
}

test('climbs the measured five supports and exits at the exact landing join',()=>{
  const state=make(); let previous=getStairPose(state);
  for(let i=0;i<720;i++) {
    updateStairMotion(state,1,1/120); const pose=getStairPose(state);
    verifySupports(pose);
    assert.ok(pose.x>=previous.x && pose.floor<=previous.floor);
    assert.ok(Math.hypot(pose.x-previous.x,pose.floor-previous.floor)<1.1,'Root must stay continuous.');
    previous=pose;
  }
  assert.equal(previous.x,nodes.at(-1).x); assert.equal(previous.floor,nodes.at(-1).y);
  assert.equal(previous.exitDirection,1); assert.equal(previous.settled,true);
});

test('descends with the same discrete supports and no fall at the lower join',()=>{
  const state=make({facing:-1}); let previous=getStairPose(state);
  for(let i=0;i<720;i++) {
    updateStairMotion(state,-1,1/120); const pose=getStairPose(state);
    verifySupports(pose);
    assert.ok(pose.x<=previous.x && pose.floor>=previous.floor);
    assert.ok(Math.hypot(pose.x-previous.x,pose.floor-previous.floor)<1.1);
    previous=pose;
  }
  assert.equal(previous.x,nodes[0].x); assert.equal(previous.floor,nodes[0].y);
  assert.equal(previous.exitDirection,-1); assert.equal(previous.settled,true);
});

test('release midway completes only the active tread then gathers safely',()=>{
  const state=make(); run(state,1,.18);
  const before=getStairPose(state), target=before.stepTo;
  assert.equal(before.mode,'stepping'); assert.ok(before.stepPhase>0 && before.stepPhase<1);
  const after=run(state,0,2);
  assert.equal(after.x,nodes[target].x); assert.equal(after.floor,nodes[target].y);
  assert.equal(after.settled,true); assert.equal(after.exitDirection,0);
  assert.ok(after.feet.every(foot=>foot.planted && foot.nodeIndex===target));
  verifySupports(after);
});

test('reversal settles first and turns without changing the support position',()=>{
  const state=make(); run(state,1,.18);
  let sawGather=false,sawTurn=false,turnPosition=null;
  for(let i=0;i<500;i++) {
    updateStairMotion(state,-1,1/240); const pose=getStairPose(state);
    verifySupports(pose);
    if(pose.mode==='gathering') sawGather=true;
    if(pose.turn) {
      sawTurn=true; turnPosition??=[pose.x,pose.floor];
      assert.deepEqual([pose.x,pose.floor],turnPosition);
      assert.ok(pose.feet.every(foot=>foot.planted));
    }
  }
  assert.ok(sawGather && sawTurn);
  const pose=run(state,-1,2); assert.equal(pose.x,nodes[0].x); assert.equal(pose.facing,-1);
});

test('quick reversal can retrace a turn without swapping direction instantly',()=>{
  const state=make({index:2});
  run(state,-1,.16); const middle=getStairPose(state);
  assert.ok(middle.turn && middle.turn.progress>0 && middle.turn.progress<1);
  updateStairMotion(state,1,1/240); const retrace=getStairPose(state);
  assert.ok(retrace.turn); assert.ok(Math.abs(retrace.turn.progress-middle.turn.progress)<.02);
  run(state,1,.6);
  assert.equal(getStairPose(state).facing,1);
  verifySupports(getStairPose(state));
});

test('the stance foot does not slide during an ascending or descending swing',()=>{
  for(const facing of [1,-1]) {
    const state=make({facing}); let support=null,footId=null;
    for(let i=0;i<60;i++) {
      updateStairMotion(state,facing,1/240); const pose=getStairPose(state);
      if(!support) {footId=pose.supportFoot;support={...pose.feet[footId]};}
      assert.deepEqual(pose.feet[footId],support);
    }
  }
});

test('all treads can be stopped on and resumed without losing a step',()=>{
  const state=make();
  for(let target=1;target<nodes.length;target++) {
    run(state,1,.1); run(state,0,1);
    const pose=getStairPose(state);
    assert.equal(state.index,target); assert.equal(pose.settled,true); verifySupports(pose);
  }
  assert.equal(run(state,1,.1).exitDirection,1);
});

test('30, 60 and 120 Hz all arrive at the same exit without bypassing supports',()=>{
  const results=[30,60,120].map(frequency=>run(make(),1,5,frequency));
  for(const pose of results) {
    assert.equal(pose.x,nodes.at(-1).x); assert.equal(pose.floor,nodes.at(-1).y);
    assert.equal(pose.exitDirection,1); assert.equal(pose.settled,true); verifySupports(pose);
  }
});

test('invalid geometry is rejected and elapsed-time spikes stay bounded',()=>{
  assert.throws(()=>createStairMotion({nodes:[nodes[1],nodes[0]],height:266}));
  assert.throws(()=>make({index:1.4}));
  const state=make(); updateStairMotion(state,1,1000);
  assert.equal(state.index,0); assert.ok(getStairPose(state).x<nodes[1].x);
  updateStairMotion(state,NaN,NaN); verifySupports(getStairPose(state));
});
