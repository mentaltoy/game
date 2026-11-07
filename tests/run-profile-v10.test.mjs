import test from 'node:test';
import assert from 'node:assert/strict';
import { createGroundLocomotion, updateGroundLocomotion, getGroundLocomotionPose } from '../dist/run-motion.js';
import { createRoomMotion, updateRoomMotion, getRoomPose } from '../dist/room-motion.js';
import { RUN_STRIDE_HEIGHT, RUN_PERIOD } from '../dist/run-renderer-v10.js';

const height=957*.278,runStride=height*RUN_STRIDE_HEIGHT,runSpeed=runStride/RUN_PERIOD;

test('V10 running profile completes one authored cycle in the reference period at full speed',()=>{
 const state=createGroundLocomotion({x:0,min:-10000,max:10000,height,floor:800,speed:160,runStride,runSpeed});
 for(let i=0;i<240;i++)updateGroundLocomotion(state,1,1/240,{running:true});
 const before=getGroundLocomotionPose(state);
 for(let i=0;i<Math.round(RUN_PERIOD*240);i++)updateGroundLocomotion(state,1,1/240,{running:true});
 const after=getGroundLocomotionPose(state);
 assert.ok(Math.abs(after.x-before.x-runStride)<1e-7);
 assert.ok(Math.abs(after.runPhase-before.runPhase)<1e-7);
 assert.equal(after.speed,runSpeed);
});

test('V10 running profile approaches both stair joins safely from different starting distances',()=>{
 const world={width:1644,height:957};
 for(const [x,input,exit] of [[90,1,'upper'],[400,1,'upper'],[580,1,'upper'],[740,1,'upper'],[900,1,'upper'],[1100,-1,'lower'],[1300,-1,'lower'],[1540,-1,'lower']]){
  const state=createRoomMotion({world,x,height,speed:160,runStride,runSpeed});
  let visited=false,exited=false,previous=getRoomPose(state);
  for(let i=0;i<240*12;i++){
   updateRoomMotion(state,input,1/240,{running:true});const pose=getRoomPose(state);
   assert.ok(Math.abs(pose.x-previous.x)<=runSpeed/240+1e-7);
   if(pose.surface==='stairs'){
    visited=true;assert.equal(pose.locomotion,'walk');assert.equal(pose.runWeight,0);
   }
   if(visited&&pose.surface===exit){exited=true;break;}
   previous=pose;
  }
  assert.ok(visited&&exited,`No interrupted stair traversal from ${x} towards ${input}.`);
 }
});
