import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRoomAscentGeometry,getAscentPlacement,getGroundPoseAtAscentContact,createAscentGroundHandoff,ASCENT_GROUND_CONTACT} from '../dist/ascent-renderer-v14.js';
import {getRoomStairs} from '../dist/room-layout.js';
const frames=JSON.parse(fs.readFileSync(new URL('../dist/stair-study/frames.json',import.meta.url))).frames;
const nodes=getRoomStairs(),height=266;
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const pose=(from,phase)=>({height,facing:1,supportLockedAscent:true,mode:'stepping',stepFrom:from,stepTo:from+1,stepPhase:phase,ascentProgress:from+phase,index:from});

test('the full ascent repeats fixed 30/21 supports and reaches the real landing',()=>{
  const g=createRoomAscentGeometry({nodes,frames,height});
  for(let i=1;i<g.nodes.length;i++){close(g.nodes[i].x-g.nodes[i-1].x,30);close(g.nodes[i-1].y-g.nodes[i].y,21);}
  const final=g.placement(4);close(final.contact?.x??final.target.x,nodes.at(-1).x+10.64);close(final.target.y,nodes.at(-1).y);
  for(let step=1;step<5;step++)for(let i=0;i<120;i++) {
    const p=getAscentPlacement(pose(step,i/120),{nodes,frames});
    const sole=frames[p.cell].feet[p.support];
    close(p.x+sole.x*p.scale,p.contact.x);close(p.y+sole.y*p.scale,p.contact.y);
    close(p.contact.x,nodes.at(-1).x-(5-step)*30+10.64);close(p.contact.y,nodes.at(-1).y+(5-step)*21);
  }
});

test('interior contact holds equal the preceding step endpoint and next step start',()=>{
  for(let index=2;index<5;index++){
    const options={nodes,frames},a=getAscentPlacement(pose(index-1,1),options);
    const hold=getAscentPlacement({...pose(index,0),mode:'contact-hold',index,ascentProgress:index},options);
    const next=getAscentPlacement(pose(index,0),options);
    assert.deepEqual(a.origin,hold.origin);assert.deepEqual(hold.origin,next.origin);
    assert.equal(a.cell,hold.cell);assert.equal(next.cell,hold.cell);
  }
});

test('descent and the approved turn remain delegated to the legacy renderer',()=>{
  assert.equal(getAscentPlacement({...pose(3,.2),facing:-1},{nodes,frames}),null);
  assert.equal(getAscentPlacement({...pose(3,.2),turn:{progress:.4}},{nodes,frames}),null);
});

test('an entry requires its own measured drawings and never silently selects V9 artwork',()=>{
  assert.equal(getAscentPlacement(pose(0,.1),{nodes,frames}).kind,'ground');
  assert.equal(getAscentPlacement(pose(0,.4),{nodes,frames}).kind,'unavailable');
  const contact=getAscentPlacement(pose(0,.9),{nodes,frames});assert.equal(contact.cell,0);assert.equal(contact.supportIndex,1);
});

test('the neutral handoff is registered to the actual approved forefoot, not pose.x',()=>{
  const p={height,x:1065.4,floor:687,facing:1},contact={x:1076.04,y:687};
  const aligned=getGroundPoseAtAscentContact(p,contact);
  close(aligned.x+ASCENT_GROUND_CONTACT.xPerHeight*height,contact.x);
  close(aligned.floor+ASCENT_GROUND_CONTACT.yPerHeight*height,contact.y);
  assert.equal(aligned.walkWeight,0);
});

test('landing registration survives the stair gather and stays fixed until new support',()=>{
  const handoff=createAscentGroundHandoff(),contact={x:1076.04,y:687};
  const ground={height,x:1065.4,floor:687,walkPhase:0,surface:'upper',locomotion:'walk'};
  handoff.arm(contact);
  const stair={...ground,surface:'stairs'};
  assert.equal(handoff.prepare(stair),stair);
  const first=handoff.prepare(ground),dx=first.x-ground.x,dy=first.floor-ground.floor;
  close(first.x+ASCENT_GROUND_CONTACT.xPerHeight*height,contact.x);
  for(const phase of [.1,.2,.3,.4,.49]){
    const physical={...ground,x:ground.x+phase*20,walkPhase:phase};
    const drawn=handoff.prepare(physical);
    close(drawn.x-physical.x,dx);close(drawn.floor-physical.floor,dy);
  }
  const transferred={...ground,walkPhase:.51};assert.equal(handoff.prepare(transferred),transferred);
});

test('running handoff retires only with explicit flight evidence',()=>{
  const handoff=createAscentGroundHandoff(),contact={x:1076.04,y:687};
  const ground={height,x:1065.4,floor:687,walkPhase:0,surface:'upper',locomotion:'run'};
  handoff.arm(contact);
  const first=handoff.prepare(ground),next={...ground,x:1070,walkPhase:.6};
  close(handoff.prepare(next).x-next.x,first.x-ground.x);
  assert.equal(handoff.prepare(next,{isAirborne:true}),next);
  assert.equal(handoff.prepare({...next,x:1075}).x,1075);
});

test('collected restarts keep the anatomical support and begin at its passing half',()=>{
  for(let index=1;index<5;index++){
    const initial=getAscentPlacement({...pose(index,.05),stepFromCollected:true},{nodes,frames});
    assert.equal(initial.kind,'ground');
    const passing=getAscentPlacement({...pose(index,.15),stepFromCollected:true},{nodes,frames});
    const reference=getAscentPlacement(pose(index,.5),{nodes,frames});
    assert.deepEqual(passing.origin,reference.origin);assert.equal(passing.support,reference.support);assert.equal(passing.cell,reference.cell);
    const end=getAscentPlacement({...pose(index,1),stepFromCollected:true},{nodes,frames});
    const contact=getAscentPlacement(pose(index,1),{nodes,frames});
    assert.deepEqual(end.origin,contact.origin);assert.equal(end.cell,contact.cell);
  }
});

test('collection groups retain a measured support transfer and finish on the registered settle',()=>{
  const index=1,contact=getAscentPlacement(pose(index,0),{nodes,frames});
  const groupSupport=contact.support,other=groupSupport==='L'?'R':'L';
  const transitionFrames={frames:[{cell:5,id:'collection-transfer',kind:'gather',groupSupport,support:other,at:.5,
    crown:{x:250,y:20},feet:{L:{x:220,y:500},R:{x:280,y:500}}}]};
  const gathered={...pose(index,0),index,mode:'gathering',lastStep:{stepFrom:0,stepTo:1},gatherProgress:.6};
  const d=getAscentPlacement(gathered,{nodes,frames,transitionFrames});
  assert.equal(d.cell,5);assert.equal(d.support,other);assert.deepEqual(d.contact,contact.contact);
  close(d.feet[other].x,d.contact.x);close(d.feet[other].y,d.contact.y);
  const settle=getAscentPlacement({...gathered,gatherProgress:.9},{nodes,frames,transitionFrames});
  assert.equal(settle.kind,'ground');assert.equal(settle.pose.walkWeight,.2);
  close(settle.pose.x+17.642857142857142,contact.contact.x);
  close(settle.pose.floor-1.163265306122449,contact.contact.y);
});

test('the shipped transition drawings cover entry and both collection groups',()=>{
  const transitionFrames=JSON.parse(fs.readFileSync(new URL('../dist/assets/stair-transitions-v14.json',import.meta.url)));
  for(let i=0;i<100;i++){
    const entry=getAscentPlacement(pose(0,i/100),{nodes,frames,transitionFrames});
    assert.notEqual(entry.kind,'unavailable');
    if(entry.source==='transition'){
      close(entry.contact.x,nodes[0].x);close(entry.contact.y,nodes[0].y-height/504);
    }
    for(const index of [1,2]){
      const gather=getAscentPlacement({...pose(index,0),index,mode:'gathering',lastStep:{stepFrom:index-1,stepTo:index},gatherProgress:i/100},{nodes,frames,transitionFrames});
      assert.notEqual(gather.kind,'unavailable');
    }
  }
});
