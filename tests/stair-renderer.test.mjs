import test from 'node:test';
import assert from 'node:assert/strict';
import {getStairFramePlacement,STAIR_ART} from '../dist/stair-renderer.js';
import {getRoomStairs} from '../dist/room-layout.js';

const nodes=getRoomStairs();
function pose(from,to,phase,height=266) {
  return {mode:'stepping',facing:Math.sign(to-from),height,stepFrom:from,stepTo:to,stepPhase:phase,
    x:nodes[from].x+(nodes[to].x-nodes[from].x)*phase,
    floor:nodes[from].y+(nodes[to].y-nodes[from].y)*phase};
}

test('every selected stair illustration uses one fixed scale and an actual sole anchor',()=>{
  for(const direction of [1,-1]) for(let from=direction===1?0:nodes.length-1;direction===1?from<nodes.length-1:from>0;from+=direction) {
    for(let i=0;i<=100;i++) {
      const p=pose(from,from+direction,i/100),drawing=getStairFramePlacement(p,{nodes}),art=STAIR_ART[drawing.direction][drawing.cell];
      assert.equal(drawing.scale,266/500);
      assert.equal(drawing.x+art.root*drawing.scale,p.x);
      assert.ok(Math.abs(drawing.y+art.sole[1]*drawing.scale-drawing.contact.y)<1e-9);
      assert.ok(Math.abs(drawing.x+art.sole[0]*drawing.scale-drawing.contact.x)<1e-9);
      assert.ok([from,from+direction].includes(drawing.supportIndex));
      assert.equal(drawing.contact.contact,1);
      assert.equal(drawing.contact.clearance,0);
    }
  }
});

test('idle, collecting and rotation use the ground artwork at the same world position',()=>{
  for(const mode of ['idle','gathering','turning']) {
    assert.equal(getStairFramePlacement({...pose(2,3,.5),mode},{nodes}),null);
  }
});

test('resizing changes the single global scale rather than resizing individual heads',()=>{
  for(const height of [180,266,360]) for(const phase of [0,.18,.4,.6,.78,.94]) {
    const drawing=getStairFramePlacement(pose(2,3,phase,height),{nodes});
    assert.ok(Math.abs(drawing.width-362*height/500)<1e-9);
    assert.ok(Math.abs(drawing.height-543*height/500)<1e-9);
  }
});

test('only the three accepted bridge paintings enter their intended transitions',()=>{
  for(const [p,expected] of [[pose(2,3,.6),'stair-up-bridge-0'],[pose(2,3,.68),'stair-up-bridge-1'],[pose(3,2,.2),'stair-down-bridge-2']]) {
    const drawing=getStairFramePlacement(p,{nodes,bridges:true});
    assert.equal(drawing.id,expected); assert.equal(drawing.scale,266/500);
    const art=STAIR_ART[drawing.source][drawing.cell];
    assert.ok(Math.abs(drawing.y+art.sole[1]*drawing.scale-drawing.contact.y)<1e-9);
  }
  for(let i=0;i<=100;i++) for(const facing of [1,-1]) {
    const drawing=getStairFramePlacement(pose(facing>0?2:3,facing>0?3:2,i/100),{nodes,bridges:true});
    assert.notEqual(drawing.id,'stair-down-bridge-3');
  }
});

test('V9 pins the painted supporting point across every hold on every tread',()=>{
  for(const direction of [1,-1]) for(let from=direction===1?0:5;direction===1?from<5:from>0;from+=direction) {
    const contacts=new Map();
    for(let i=0;i<=1000;i++) {
      const drawing=getStairFramePlacement(pose(from,from+direction,i/1000),{nodes,bridges:true,refined:true});
      const prior=contacts.get(drawing.supportIndex);
      if(prior){assert.ok(Math.abs(drawing.contact.x-prior.x)<1e-9);assert.ok(Math.abs(drawing.contact.y-prior.y)<1e-9);}
      contacts.set(drawing.supportIndex,drawing.contact);
      assert.ok(Math.abs(drawing.x+drawing.sole[0]*drawing.scale-drawing.contact.x)<1e-9);
      assert.ok(Math.abs(drawing.y+drawing.sole[1]*drawing.scale-drawing.contact.y)<1e-9);
      assert.equal(drawing.scale,266/500);
    }
  }
});

test('V9 keeps the head advancing through the source paintings, including the taller first riser',()=>{
  for(const direction of [1,-1]) for(let from=direction===1?0:5;direction===1?from<5:from>0;from+=direction) {
    let previous=null;
    for(let i=0;i<=1000;i++) {
      const drawing=getStairFramePlacement(pose(from,from+direction,i/1000),{nodes,bridges:true,refined:true});
      if(previous){
        assert.ok((drawing.head.x-previous.head.x)*direction>=-1e-8,`backward head at ${from}, ${i}`);
        assert.ok(Math.abs(drawing.head.x-previous.head.x)<10.01);
        assert.ok(Math.abs(drawing.head.y-previous.head.y)<8.7);
      }
      previous=drawing;
    }
  }
});

test('V9 retains the final whole painting at the beginning of a collection, without resetting its step',()=>{
  for(const direction of [1,-1]) {
    const from=direction===1?2:3,to=from+direction,previous=pose(from,to,1);
    const expected=getStairFramePlacement(previous,{nodes,refined:true});
    const gathering={...previous,mode:'gathering',stepFrom:to,stepTo:to,stepPhase:0,gatherProgress:.1,lastStep:{stepFrom:from,stepTo:to}};
    const actual=getStairFramePlacement(gathering,{nodes,refined:true});
    assert.equal(actual.id,expected.id);assert.equal(actual.x,expected.x);assert.equal(actual.y,expected.y);
    assert.equal(getStairFramePlacement({...gathering,gatherProgress:.7},{nodes,refined:true}),null);
  }
});
