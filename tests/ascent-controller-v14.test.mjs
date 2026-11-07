import test from 'node:test';
import assert from 'node:assert/strict';
import {createStairMotion,updateStairMotion,getStairPose} from '../dist/stair-motion.js';
import {createRoomMotion,updateRoomMotion,getRoomPose} from '../dist/room-motion.js';
import {getRoomStairs,getRoomBounds} from '../dist/room-layout.js';

const world={width:1644,height:957,characterHeight:266};
const nodes=getRoomStairs(world),bounds=getRoomBounds(world);
const make=(options={})=>createStairMotion({nodes,height:266,supportLockedAscent:true,...options});
function run(state,input,seconds,fps=120) {
  for(let i=0;i<Math.round(seconds*fps);i++)updateStairMotion(state,input,1/fps);
  return getStairPose(state);
}
function until(state,input,predicate) {
  for(let i=0;i<2400;i++) {
    updateStairMotion(state,input,1/240);
    const pose=getStairPose(state);
    if(predicate(pose))return pose;
  }
  assert.fail('Stair transition was not reached');
}
function supportsAreActual(pose) {
  assert.ok(pose.feet.some(f=>f.planted));
  for(const foot of pose.feet.filter(f=>f.planted)) {
    assert.equal(foot.x,nodes[foot.nodeIndex].x);
    assert.equal(foot.y,nodes[foot.nodeIndex].y);
  }
}

test('V14 release retains the landed split stance on every interior tread and resumes the next step',()=>{
  for(const fps of [30,60,120]) {
    const state=make();
    for(let target=1;target<nodes.length-1;target++) {
      run(state,1,.1,fps);
      const moving=getStairPose(state);
      assert.equal(moving.stepTo,target);
      assert.equal(moving.stepFromCollected,target===1);
      const stopped=run(state,0,1.5,fps);
      assert.equal(stopped.mode,'contact-hold');
      assert.equal(stopped.settled,true);
      assert.equal(stopped.walkWeight,1);
      assert.equal(stopped.ascentProgress,target);
      assert.equal(stopped.index,target);
      assert.deepEqual(stopped.feet.map(f=>f.nodeIndex).sort((a,b)=>a-b),[target-1,target]);
      supportsAreActual(stopped);
      assert.deepEqual(run(state,0,.4,fps),stopped,'Waiting must not gather or drift');
    }
  }
});

test('V14 returns a continuous absolute authored progress through all ascending steps and the landing gather',()=>{
  const state=make();let previous=0,sawGather=false;
  for(let i=0;i<5*240;i++) {
    updateStairMotion(state,1,1/240);const pose=getStairPose(state);
    supportsAreActual(pose);
    assert.ok(pose.ascentProgress>=previous);
    assert.ok(pose.ascentProgress-previous<.02);
    if(pose.mode==='stepping')assert.equal(pose.ascentProgress,pose.stepFrom+pose.stepPhase);
    if(pose.mode==='gathering') {
      sawGather=true;assert.equal(pose.ascentProgress,nodes.length-1);
      assert.deepEqual(pose.lastStep,{stepFrom:nodes.length-2,stepTo:nodes.length-1});
    }
    previous=pose.ascentProgress;
  }
  assert.ok(sawGather);
  assert.equal(previous,nodes.length-1);
  assert.equal(getStairPose(state).exitDirection,1);
});

test('V14 a reversal from a held ascent gathers then turns on the same support before descending',()=>{
  const state=make();until(state,1,p=>p.stepTo===3&&p.stepPhase>.2);
  const held=run(state,0,1.5);assert.equal(held.mode,'contact-hold');
  let sawGather=false,sawTurn=false;
  for(let i=0;i<300;i++) {
    updateStairMotion(state,-1,1/240);const pose=getStairPose(state);
    supportsAreActual(pose);
    if(pose.mode==='gathering') {
      sawGather=true;assert.equal(pose.ascentProgress,held.index);
      assert.deepEqual([pose.x,pose.floor],[held.x,held.floor]);
    }
    if(pose.turn) {
      sawTurn=true;assert.ok(pose.feet.every(f=>f.planted&&f.nodeIndex===held.index));
      assert.deepEqual([pose.x,pose.floor],[held.x,held.floor]);
    }
    if(pose.facing===-1)assert.equal(pose.ascentProgress,null);
  }
  assert.ok(sawGather&&sawTurn);
  assert.equal(run(state,-1,3).exitDirection,-1);
});

test('V14 completed turn retracing can resume ascent from collected feet without losing an index',()=>{
  const state=make();until(state,1,p=>p.stepTo===2&&p.stepPhase>.2);
  const held=run(state,0,1.5);
  until(state,-1,p=>p.turn?.progress>.2);
  const resumed=until(state,1,p=>p.mode==='stepping');
  assert.equal(resumed.facing,1);
  assert.equal(resumed.stepFrom,held.index);
  assert.equal(resumed.stepTo,held.index+1);
  assert.equal(resumed.stepFromCollected,true);
});

test('V14 changes only ascent cadence; the descending controller matches its prior trajectory',()=>{
  const up=make();until(up,1,p=>p.stepFrom===1&&p.stepPhase>.2);
  assert.ok(Math.abs(up.rate-1/.45)<1e-10);
  const old=createStairMotion({nodes,height:266,facing:-1}),current=make({facing:-1});
  const comparable=pose=>{const {supportLockedAscent,...rest}=pose;return rest;};
  for(const [input,seconds] of [[-1,.17],[0,.8],[-1,.6],[0,.5],[-1,2]]) {
    for(let i=0;i<Math.round(seconds*120);i++) {
      updateStairMotion(old,input,1/120);updateStairMotion(current,input,1/120);
      assert.deepEqual(comparable(getStairPose(current)),comparable(getStairPose(old)));
    }
  }
  assert.equal(current.maxRate,1/.34);
});

test('V14 ascent collection lasts .32 seconds and keeps its timing when the command changes',()=>{
  const state=make();until(state,1,p=>p.stepTo===2&&p.stepPhase>.2);
  run(state,0,1.5);
  updateStairMotion(state,-1,1/240);
  assert.equal(state.gather.duration,.32);
  assert.equal(getStairPose(state).gatherProgress,0);
  for(let i=1;i<=72;i++) {
    updateStairMotion(state,i%2===0?1:-1,1/240);
    const pose=getStairPose(state);
    assert.equal(pose.mode,'gathering');
    assert.equal(state.gather.duration,.32);
    assert.ok(Math.abs(pose.gatherProgress-(i/240)/.32)<1e-10);
  }
  const done=run(state,0,.1,240);
  assert.equal(done.mode,'idle');assert.equal(done.gatherProgress,null);
  assert.ok(done.feet.every(f=>f.planted&&f.nodeIndex===done.index));
});

test('V14 collection duration is configurable for ascent only and reaches the room controller',()=>{
  const ascending=make({ascentGatherDuration:.4});until(ascending,1,p=>p.stepTo===1&&p.stepPhase>.2);
  until(ascending,-1,p=>p.mode==='gathering');assert.equal(ascending.gather.duration,.4);
  for(const [facing,supportLockedAscent] of [[-1,false],[-1,true],[1,false]]) {
    const legacyTiming=make({facing,supportLockedAscent,ascentGatherDuration:.4});
    until(legacyTiming,facing,p=>p.stepPhase>.2);until(legacyTiming,0,p=>p.mode==='gathering');
    assert.equal(legacyTiming.gather.duration,.14);
  }
  const room=createRoomMotion({world,x:nodes[2].x,supportLockedAscent:true,ascentGatherDuration:.4});
  assert.equal(room.stairs.ascentGatherDuration,.4);
  assert.throws(()=>make({ascentGatherDuration:0}));
});

test('V14 room integration completes a round trip and handoffs at the same supports at 30/60/120 Hz',()=>{
  const results=[30,60,120].map(fps=>{
    const state=createRoomMotion({world,x:bounds.min,supportLockedAscent:true});
    const transitions=[];let previous=getRoomPose(state);
    for(const input of [1,-1])for(let i=0;i<22*fps;i++) {
      updateRoomMotion(state,input,1/fps);const pose=getRoomPose(state);
      assert.ok(pose.x>=bounds.min&&pose.x<=bounds.max);
      if(pose.surface!==previous.surface)transitions.push([previous.surface,pose.surface]);
      if(pose.surface==='stairs')supportsAreActual(pose);
      previous=pose;
    }
    return {transitions,pose:previous};
  });
  for(const {transitions,pose} of results) {
    assert.deepEqual(transitions,[['lower','stairs'],['stairs','upper'],['upper','stairs'],['stairs','lower']]);
    assert.equal(pose.x,bounds.min);assert.equal(pose.floor,nodes[0].y);
    assert.equal(pose.surface,'lower');assert.equal(pose.facing,-1);assert.equal(pose.settled,true);
  }
});
