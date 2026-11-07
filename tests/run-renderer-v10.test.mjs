import test from 'node:test';
import assert from 'node:assert/strict';
import {RUN_ART,RUN_TIMELINE,RUN_STRIDE_HEIGHT,RUN_PERIOD,chooseRunFrame} from '../dist/run-renderer-v10.js';
import {normalizeRunHead} from '../dist/run-head-calibration-v10.js';
import {gradeRun,RUN_GAIN} from '../dist/run-grade-v10.js';

const pose={runLevel:1,runWeight:1,runPhase:0,settled:false,turn:null};
test('V10 keeps both anatomical half-cycles and starts on the matching rear-arm contact',()=>{
 assert.deepEqual(RUN_TIMELINE.map(x=>x[1]),[6,7,8,9,10,0,11,1,2,3,4,5]);
 for(const [phase,cell]of RUN_TIMELINE)assert.equal(chooseRunFrame({...pose,runPhase:phase}).cell,cell);
 assert.equal(RUN_PERIOD,.8);assert.equal(chooseRunFrame({...pose,turn:{progress:.5}}),null);
});
test('V10 key contact times follow the actual painted sole displacement',()=>{
 for(const cells of [[5,6,7,8,9],[0,11,1,2,3]]){
  let last=-1;const points=cells.map(cell=>{let time=RUN_TIMELINE.find(x=>x[1]===cell)[0];if(time<last)time+=1;last=time;return time*495*RUN_STRIDE_HEIGHT+RUN_ART[cell].sole[0];});
  assert.ok(Math.max(...points)-Math.min(...points)<.001);
 }
 assert.deepEqual(RUN_ART.filter(x=>x.flight).map(x=>x.cell),[4,10]);
 for(const art of RUN_ART.filter(x=>x.flight)){assert.equal(art.sole,null);assert.ok(art.floor<art.baseline);}
});
test('only the repaired painting receives head registration and pixels below its collar are identical',()=>{
 for(const art of RUN_ART){
  const pixels={data:new Uint8ClampedArray(420*560*4)};for(let i=0;i<pixels.data.length;i++)pixels.data[i]=i%251;
  const before=pixels.data.slice(),applied=normalizeRunHead(pixels,420,art);
  if(art.cell!==3){assert.equal(applied,false);assert.deepEqual(pixels.data,before);}
  else {assert.equal(applied,true);const row=Math.ceil(art.cap+.2*(art.floor-art.cap));assert.deepEqual(pixels.data.subarray(row*420*4),before.subarray(row*420*4));}
 }
});
test('V10 material grading is defined for all new paintings and never changes alpha',()=>{
 for(const art of RUN_ART){
  assert.ok(RUN_GAIN[art.id]);const pixels={data:new Uint8ClampedArray(420*560*4)};
  for(let i=0;i<pixels.data.length;i+=4){pixels.data.set([145,114,84,(i/4)%256],i);}
  const before=pixels.data.slice();gradeRun(pixels,420,art);
  for(let i=3;i<before.length;i+=4)assert.equal(pixels.data[i],before[i]);
 }
});
