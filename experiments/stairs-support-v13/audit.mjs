import fs from 'node:fs';
import {createSupportLockedAscent,ASCENT_BEATS} from '../../dist/stair-study/support-locked-v13.mjs';
const frames=JSON.parse(fs.readFileSync(new URL('../../dist/stair-study/frames.json',import.meta.url))).frames;
const g=createSupportLockedAscent({frames,anchor:{x:986.84,y:750},steps:2});
let maxSupportingPointError=0,previous=null,maxHeldDrawingTranslation=0;
for(let i=0;i<=2400;i++) {
  const d=g.placement(i/1200),foot=d.feet[d.support];
  maxSupportingPointError=Math.max(maxSupportingPointError,Math.hypot(foot.x-d.target.x,foot.y-d.target.y));
  if(previous&&previous.frameIndex===d.frameIndex&&previous.supportIndex===d.supportIndex) {
    maxHeldDrawingTranslation=Math.max(maxHeldDrawingTranslation,Math.hypot(d.origin.x-previous.origin.x,d.origin.y-previous.origin.y));
  }
  previous=d;
}
const poses=[...ASCENT_BEATS.map(b=>g.placement(b.phase)),g.placement(2)];
const changes=poses.slice(1).map((d,i)=>{
  const before=poses[i];
  return {from:before.frameIndex,to:d.frameIndex,phase:d.progress,
    headJump:Math.hypot(d.head.x-before.head.x,d.head.y-before.head.y),
    transfer:before.support!==d.support};
});
const report={referenceHeight:266,tread:30,rise:21,stepSeconds:.45,
  maxSupportingPointError,maxHeldDrawingTranslation,
  maxHeadChangeBetweenDrawings:Math.max(...changes.map(c=>c.headJump)),changes,
  note:'The supporting landmark is fixed. This does not certify every pixel of the painted sole, the outgoing foot at double contact, or continuous head motion.'};
fs.writeFileSync(new URL('./geometry-audit.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,changes:undefined}));
