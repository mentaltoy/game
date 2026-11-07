import {createStandardStairNodes} from './stair-standard.mjs';

// Authored once for the standard stair. Retain the effective V12 beats;
// cells 1/9 were sub-millisecond selection artifacts, not visible intervals.
// A new foot takes the weight only at phase 1/2, on its landing drawing.
export const ASCENT_BEATS = Object.freeze([
  [0,0],[.125,2],[.25,3],[.375,4],[.625,5],[.688,6],[.875,7],
  [1,8],[1.125,10],[1.25,11],[1.375,12],[1.625,13],[1.688,14],[1.75,15],
].map(([phase,cell])=>Object.freeze({phase,cell})));

export function createSupportLockedAscent({frames,anchor,steps=2,height=266,referenceHeight=500}) {
  if (!Array.isArray(frames) || frames.length!==16 || !Number.isFinite(referenceHeight) || referenceHeight<=0) {
    throw new Error('The ascent needs sixteen measured whole-frame drawings.');
  }
  const nodes=createStandardStairNodes({anchor,steps,height}),scale=height/referenceHeight;
  // Static offsets from each drawing's measured sole. No moving correction,
  // interpolation, morph, or per-step search for a body position is applied.
  const poses=frames.map((frame,cell)=>{
    if (![frame.crown?.x,frame.crown?.y,frame.feet?.R?.x,frame.feet?.R?.y,frame.feet?.L?.x,frame.feet?.L?.y].every(Number.isFinite)) {
      throw new Error(`Missing painted sole/crown coordinates in frame ${cell}.`);
    }
    const support=cell<8?'R':'L',sole=frame.feet[support];
    return {frame,cell,support,offset:{x:-sole.x*scale,y:-sole.y*scale}};
  });
  function placement(progress) {
    if (!Number.isFinite(progress)) throw new Error('Ascent progress must be finite.');
    const p=Math.max(0,Math.min(steps,progress)),step=Math.floor(p),phase=p%2;
    let beat=ASCENT_BEATS[0];
    for (const next of ASCENT_BEATS) {if (next.phase>phase) break;beat=next;}
    const pose=poses[beat.cell],supportIndex=step+1,target=nodes[supportIndex];
    const origin={x:target.x+pose.offset.x,y:target.y+pose.offset.y};
    const point=local=>({x:origin.x+local.x*scale,y:origin.y+local.y*scale});
    return {frameIndex:pose.cell,frame:pose.frame,scale,origin,
      head:point(pose.frame.crown),support:pose.support,supportIndex,target,
      feet:{R:point(pose.frame.feet.R),L:point(pose.frame.feet.L)},progress:p};
  }
  return {nodes,scale,steps,placement};
}
