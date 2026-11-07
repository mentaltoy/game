import test from 'node:test';
import assert from 'node:assert/strict';
import {RUN_ART,RUN_TIMELINE,RUN_TRANSITIONS,chooseRunFrame} from '../dist/run-renderer.js';
import {gradeRun,RUN_GAIN} from '../dist/run-grade.js';

const pose={runWeight:1,runPhase:0,settled:false,turn:null};

test('run paintings retain the authored sequence, including corrected second stance order',()=>{
 assert.deepEqual(RUN_TIMELINE.map(x=>x[1]),[0,1,2,3,4,5,6,8,7,9,10,11]);
 for(const [time,cell]of RUN_TIMELINE)assert.equal(chooseRunFrame({...pose,runPhase:time}).cell,cell);
 for(const phase of [-2,0,1,5])assert.equal(chooseRunFrame({...pose,runPhase:phase}).cell,0);
 assert.equal(chooseRunFrame({...pose,runPhase:NaN}).cell,0);
});

test('whole transition paintings serve startup, stopping and both moving gait changes',()=>{
 assert.equal(chooseRunFrame({...pose,runLevel:0}),null);
 assert.equal(chooseRunFrame({...pose,runLevel:.15}).id,'run-transition-0');
 assert.equal(chooseRunFrame({...pose,runLevel:.5}).id,'run-transition-1');
 assert.equal(chooseRunFrame({...pose,runLevel:1}).id,'run-0');
 assert.equal(chooseRunFrame({...pose,runLevel:1,turn:{progress:.5}}),null);
 assert.equal(chooseRunFrame({...pose,settled:true}),null);
 for(const frame of RUN_TRANSITIONS)assert.equal(frame.floor,frame.baseline);
});

test('authored stance landmarks agree with the distance-driven stride at their key times',()=>{
 for(const cells of [[0,1,2,3],[6,8,7,9]]){
  const locations=cells.map(cell=>{
   const time=RUN_TIMELINE.find(x=>x[1]===cell)[0];
   return time*495*1.10+RUN_ART[cell].sole[0];
  });
  assert.ok(Math.max(...locations)-Math.min(...locations)<2,'At keyframes, planted source feet counter the travelled root distance.');
 }
 assert.deepEqual(RUN_ART.filter(x=>x.flight).map(x=>x.cell),[4,5,10,11]);
 for(const frame of RUN_ART.filter(x=>x.flight)){assert.equal(frame.sole,null);assert.ok(frame.floor<frame.baseline);}
});

test('display grading preserves alpha and leaves unknown artwork byte-identical',()=>{
 for(const frame of [...RUN_ART,...RUN_TRANSITIONS]){
  assert.ok(RUN_GAIN[frame.id]);
  const data=new Uint8ClampedArray(420*560*4);
  for(let i=0;i<data.length;i+=4){data[i]=142;data[i+1]=115;data[i+2]=85;data[i+3]=(i/4)%256;}
  const before=data.slice();gradeRun({data},420,frame);
  for(let i=3;i<data.length;i+=4)assert.equal(data[i],before[i]);
 }
 const data=new Uint8ClampedArray([100,90,80,255]);gradeRun({data},1,{cap:0,floor:1,root:0,id:'unknown'});
 assert.deepEqual([...data],[100,90,80,255]);
});
