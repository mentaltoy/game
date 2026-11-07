import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRoomMotion,updateRoomMotion,getRoomPose} from '../dist/room-motion.js';
import {getRoomStairs,getRoomBounds} from '../dist/room-layout.js';
import {getAscentPlacement} from '../dist/ascent-renderer-v14.js';

const world={width:1644,height:957,characterHeight:266};
const nodes=getRoomStairs(world),bounds=getRoomBounds(world);
const frames=JSON.parse(fs.readFileSync(new URL('../dist/stair-study/frames.json',import.meta.url))).frames;
const transitionFrames=JSON.parse(fs.readFileSync(new URL('../dist/assets/stair-transitions-v14.json',import.meta.url)));
const options={nodes,frames,transitionFrames};
const create=()=>createRoomMotion({world,x:nodes[0].x,height:266,supportLockedAscent:true});
const near=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-8,message??`${a} != ${b}`);

function inspect(pose,seen=new Set()) {
  for(const key of ['x','floor','height','walkPhase'])assert.ok(Number.isFinite(pose[key]),`Physical ${key} is finite`);
  if(pose.surface!=='stairs')return null;
  const d=getAscentPlacement(pose,options);
  const ascending=pose.facing===1&&(pose.mode==='stepping'||pose.mode==='contact-hold'||pose.mode==='gathering');
  if(ascending)assert.ok(d,`No legacy ascent fallback in ${pose.mode}`);
  if(!d)return null;
  assert.notEqual(d.kind,'unavailable');seen.add(d.id);
  if(d.kind==='ground'){
    for(const key of ['x','floor','height','walkWeight'])assert.ok(Number.isFinite(d.pose[key]),`Ground ${key} is finite`);
    return d;
  }
  assert.equal(d.kind,'painted');
  for(const key of ['x','y','width','height','scale'])assert.ok(Number.isFinite(d[key]),`Drawing ${key} is finite`);
  for(const p of [d.head,d.contact,...Object.values(d.feet)])assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
  near(d.scale,266/500,'No per-frame resizing');
  near(d.feet[d.support].x,d.contact.x,'Selected forefoot must be pinned in X');
  near(d.feet[d.support].y,d.contact.y,'Selected forefoot must be pinned in Y');
  if(d.source==='cycle'){
    const index=d.supportIndex;
    near(d.contact.x,nodes.at(-1).x-(5-index)*30+10.64);
    near(d.contact.y,nodes.at(-1).y+(5-index)*21);
  }
  return d;
}

function tick(state,input,{fps=240,running=false,seen}={}){
  updateRoomMotion(state,input,1/fps,{running});
  const pose=getRoomPose(state);inspect(pose,seen);return pose;
}
function until(state,input,predicate,{fps=240,running=false,seen,seconds=15}={}){
  for(let i=0;i<seconds*fps;i++){
    const pose=tick(state,input,{fps,running,seen});if(predicate(pose))return pose;
  }
  assert.fail('Expected integrated room/controller/renderer state not reached.');
}

test('V14 room traversal has no missing or nonfinite drawings at 30/60/120 Hz, walking and running',()=>{
  for(const fps of [30,60,120])for(const running of [false,true]){
    const state=create(),seen=new Set();
    const end=until(state,1,p=>p.surface==='upper'&&p.x===bounds.max,{fps,running,seen});
    assert.equal(end.floor,nodes.at(-1).y);
    for(const cell of [0,1,2,3])assert.ok(seen.has(`stair-transition-v14-${cell}`),`Entry/landing cell ${cell} appeared at ${fps}Hz`);
    for(const cell of [0,2,3,4,5,6,7,8,10,11,12,13,14,15])assert.ok(seen.has(`stair-ascent-v13-${cell}`),`Approved ascent cell ${cell} appeared at ${fps}Hz`);
    const returned=until(state,-1,p=>p.surface==='lower'&&p.x===bounds.min,{fps,running,seen});
    assert.equal(returned.floor,nodes[0].y);
  }
});

test('release and resume preserve exact contact drawings on both feet at every interior support',()=>{
  for(const index of [1,2,3,4]){
    const state=create();
    until(state,1,p=>p.surface==='stairs'&&p.stepTo===index&&p.stepPhase>.4);
    const held=until(state,0,p=>p.surface==='stairs'&&p.mode==='contact-hold');
    assert.equal(held.index,index);
    const contact=getAscentPlacement(held,options);
    for(let frame=0;frame<240;frame++){
      const still=tick(state,0),d=getAscentPlacement(still,options);
      assert.equal(d.cell,contact.cell);assert.deepEqual(d.origin,contact.origin);
    }
    const resumed=tick(state,1),start=getAscentPlacement(resumed,options);
    assert.equal(resumed.stepFromCollected,false,'A split stance resumes without collecting or replacing art');
    assert.equal(start.cell,contact.cell);assert.deepEqual(start.origin,contact.origin);
    until(state,1,p=>p.surface==='upper');
  }
});

test('reversals collect both anatomical support groups before turning and descending',()=>{
  const seen=new Set();
  for(const index of [2,3]){
    const state=create();
    until(state,1,p=>p.surface==='stairs'&&p.stepTo===index&&p.stepPhase>.4);
    const turn=until(state,-1,p=>p.surface==='stairs'&&!!p.turn,{seen});
    const contact=getAscentPlacement(turn,options);
    assert.equal(contact.kind,'ground');assert.equal(contact.id,'ascent-collected-turn');
    const x=contact.pose.x,y=contact.pose.floor;
    until(state,-1,p=>{
      if(p.turn){const d=getAscentPlacement(p,options);near(d.pose.x,x);near(d.pose.floor,y);}
      return p.mode==='stepping'&&p.facing===-1;
    },{seen});
    until(state,-1,p=>p.surface==='lower',{seen});
  }
  for(const cell of [2,3,4,5])assert.ok(seen.has(`stair-transition-v14-${cell}`),`Collection cell ${cell} reached by real controller`);
});

test('canceling a turn resumes from a collected stance with the matching passing half',()=>{
  for(const index of [2,3]){
    const state=create();
    until(state,1,p=>p.surface==='stairs'&&p.stepTo===index&&p.stepPhase>.4);
    until(state,-1,p=>!!p.turn&&p.turn.progress>.25);
    const resumed=until(state,1,p=>p.surface==='stairs'&&p.mode==='stepping'&&p.facing===1);
    assert.equal(resumed.stepFrom,index);assert.equal(resumed.stepFromCollected,true);
    const before=getAscentPlacement(resumed,options);assert.equal(before.kind,'ground');
    const passing=until(state,1,p=>p.mode==='stepping'&&p.stepFrom===index&&p.stepPhase>.16);
    const drawn=getAscentPlacement(passing,options);
    assert.equal(drawn.source,'cycle');assert.equal(drawn.support,index%2?'R':'L');
    assert.ok([4,12].includes(drawn.cell));
    until(state,1,p=>p.surface==='upper');
  }
});
