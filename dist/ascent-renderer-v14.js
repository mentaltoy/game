import {createSupportLockedAscent} from './stair-study/support-locked-v13.mjs';
import {registerPaintedColours} from './stair-study/display-grade.mjs';
import {STAIR_STANDARD} from './stair-study/stair-standard.mjs';

const clamp=(value,low,high)=>Math.max(low,Math.min(high,value));
const readFrames=value=>Array.isArray(value)?value:value?.frames;
const point=(origin,local,scale)=>({x:origin.x+local.x*scale,y:origin.y+local.y*scale});

// Measured from approved turn-painted-v4 cell 0, with the ground renderer's
// existing 266/504 normalization. These are a shoe landmark, not pose.x.
export const ASCENT_GROUND_CONTACT=Object.freeze({
  xPerHeight:18.47222222222222/266,
  yPerHeight:-1.5833333333333333/266,
});
// The neutral drawing hides the far/left sole. This is an authored staging
// assumption under the body root, not an anatomical measurement of that foot.
// It must stay separate from the measured near/right landing contact above.
export const ASCENT_ENTRY_CONTACT=Object.freeze({xPerHeight:0,yPerHeight:-1/504});
const SETTLE_CONTACT=Object.freeze({xPerHeight:17.642857142857142/266,yPerHeight:-1.163265306122449/266});

export function createRoomAscentGeometry({nodes,frames,height,referenceHeight=500}) {
  if(!Array.isArray(nodes)||nodes.length<3||!nodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y))) {
    throw new Error('The ascent renderer needs a lower join and raised tread supports.');
  }
  const last=nodes.length-1,steps=last-1,unit=height/STAIR_STANDARD.referenceHeight;
  const landing=nodes[last];
  // Author regular treads backwards from the real landing. The floor-to-first
  // tread depth change is an authored entry, never a stretched repeat cycle.
  const anchor={
    x:landing.x-steps*STAIR_STANDARD.tread*unit+20*height/referenceHeight,
    y:landing.y+steps*STAIR_STANDARD.rise*unit,
  };
  return createSupportLockedAscent({frames:readFrames(frames),anchor,steps,height,referenceHeight});
}

function neutralPose(pose,position={x:pose.x,y:pose.floor}) {
  return {...pose,x:position.x,floor:position.y,mode:'idle',walkWeight:0,settled:true};
}

/** Register the approved neutral whole drawing around the same forefoot. */
export function getGroundPoseAtAscentContact(pose,contact,{settle=false}={}) {
  const landmark=settle?SETTLE_CONTACT:ASCENT_GROUND_CONTACT;
  const result=neutralPose(pose,{
    x:contact.x-landmark.xPerHeight*pose.height,
    y:contact.y-landmark.yPerHeight*pose.height,
  });
  return settle?{...result,mode:'stopping',walkWeight:.2,settled:false}:result;
}

/** A fixed coordinate handoff, retired on a new support rather than decayed
 * while the original shoe remains planted. `isAirborne` comes from the chosen
 * running drawing; the renderer never guesses flight from a time threshold.
 */
export function createAscentGroundHandoff() {
  let pending=null,active=null;
  return {
    arm(contact){pending={...contact};active=null;},
    prepare(pose,{isAirborne=false}={}) {
      // The game prepares every physical pose before choosing its renderer.
      // Collection still belongs to the stairs, so keep its pending landing.
      if(pose.surface==='stairs')return pose;
      if(pose.surface!=='upper'){pending=null;active=null;return pose;}
      if(pending) {
        const aligned=getGroundPoseAtAscentContact(pose,pending);
        active={dx:aligned.x-pose.x,dy:aligned.floor-pose.floor,lastPhase:pose.walkPhase??0,travel:0};pending=null;
      }
      if(!active)return pose;
      const phase=pose.walkPhase??0;
      let advance=phase-active.lastPhase;
      if(advance<-.5)advance+=1;
      if(advance>=0&&advance<.5)active.travel+=advance;
      active.lastPhase=phase;
      if(isAirborne||(pose.locomotion!=='run'&&active.travel>=.5)) {active=null;return pose;}
      return {...pose,x:pose.x+active.dx,floor:pose.floor+active.dy};
    },
  };
}

function paintedPlacement(drawing) {
  return {...drawing,kind:'painted',source:'cycle',cell:drawing.frameIndex,
    id:`stair-ascent-v13-${drawing.frameIndex}`,x:drawing.origin.x,y:drawing.origin.y,
    width:500*drawing.scale,height:620*drawing.scale,
    contact:{...drawing.target,clearance:0,contact:1}};
}

function transitionPlacement(frame,target,pose,meta,referenceHeight) {
  const scale=pose.height/referenceHeight,support=frame.support,sole=frame.feet?.[support];
  if(!sole||![sole.x,sole.y,frame.crown?.x,frame.crown?.y].every(Number.isFinite)) {
    throw new Error(`Missing measured transition contact for ${frame.id??frame.cell}.`);
  }
  const origin={x:target.x-sole.x*scale,y:target.y-sole.y*scale};
  return {kind:'painted',source:'transition',cell:frame.cell,id:frame.id??`stair-transition-${frame.cell}`,
    frame,scale,origin,x:origin.x,y:origin.y,width:(meta.cellWidth??500)*scale,height:(meta.cellHeight??620)*scale,
    support,head:point(origin,frame.crown,scale),contact:{...target,clearance:0,contact:1},
    feet:Object.fromEntries(Object.entries(frame.feet).map(([side,p])=>[side,point(origin,p,scale)]))};
}

function chooseTransition(meta,kind,support,phase) {
  let chosen=null;
  for(const frame of readFrames(meta)??[]) {
    if(frame.kind===kind&&(frame.groupSupport??frame.support)===support&&phase>=(frame.at??0)
      &&(!chosen||(frame.at??0)>(chosen.at??0)))chosen=frame;
  }
  return chosen;
}

/** Pure placement for both rendering and boundary/contact verification.
 * `null` means legacy descent/turn. `unavailable` explicitly identifies an
 * unfinished entry/collection rather than silently using an old stair pose.
 */
export function getAscentPlacement(pose,{nodes,frames,transitionFrames,referenceHeight=500,geometry}={}) {
  if(pose.supportLockedAscent===false)return null;
  const current=Number.isFinite(pose.ascentProgress)?pose.ascentProgress
    :pose.mode==='stepping'?pose.stepFrom+(pose.stepPhase??0):pose.index;
  const last=nodes.length-1;
  const g=geometry??createRoomAscentGeometry({nodes,frames,height:pose.height,referenceHeight});
  const cycle=p=>paintedPlacement(g.placement(clamp(p-1,0,last-1)));
  const gatheredAscent=pose.lastStep?.stepTo>pose.lastStep?.stepFrom&&pose.index>=1;
  if(gatheredAscent&&(pose.mode==='idle'||pose.turn)) {
    const contact=cycle(pose.index);
    return {kind:'ground',id:pose.turn?'ascent-collected-turn':'ascent-collected-neutral',
      pose:getGroundPoseAtAscentContact(pose,contact.contact),contact:contact.contact};
  }
  if(pose.facing!==1||pose.turn)return null;
  if(pose.mode==='stepping'&&pose.stepFrom===0) {
    const phase=clamp(pose.stepPhase??0,0,1);
    if(phase>=(transitionFrames?.entryContactPhase??.78))return cycle(1);
    if(phase<(transitionFrames?.entryStartPhase??.18))return {kind:'ground',id:'ascent-entry-neutral',pose:neutralPose(pose,nodes[0])};
    const frame=chooseTransition(transitionFrames,'entry','L',phase);
    if(!frame)return {kind:'unavailable',id:'ascent-entry-missing'};
    const target={x:nodes[0].x+ASCENT_ENTRY_CONTACT.xPerHeight*pose.height,
      y:nodes[0].y+ASCENT_ENTRY_CONTACT.yPerHeight*pose.height};
    return {...transitionPlacement(frame,target,pose,transitionFrames,referenceHeight),supportIndex:0};
  }
  if(pose.mode==='stepping'&&pose.stepFrom>=1&&pose.stepFromCollected) {
    const phase=clamp(pose.stepPhase??0,0,1),contact=cycle(pose.stepFrom);
    if(phase<.15)return {kind:'ground',id:'ascent-collected-restart',pose:getGroundPoseAtAscentContact(pose,contact.contact),contact:contact.contact};
    // A collected rear shoe is already on this tread: begin with the matching
    // passing half, not a split pose that would put it down on the tread below.
    return cycle(pose.stepFrom+.5+.5*(phase-.15)/.85);
  }
  if(pose.mode==='gathering'&&pose.lastStep?.stepTo>pose.lastStep?.stepFrom) {
    const index=pose.index??pose.lastStep.stepTo,phase=clamp(pose.gatherProgress??0,0,1),contact=cycle(index);
    if(phase<(transitionFrames?.gatherStartPhase??.18))return contact;
    if(phase>=(transitionFrames?.gatherGroundPhase??.86))return {kind:'ground',id:'ascent-final-collection',
      pose:getGroundPoseAtAscentContact(pose,contact.contact,{settle:true}),contact:contact.contact};
    const frame=chooseTransition(transitionFrames,'gather',contact.support,phase);
    if(!frame)return {kind:'unavailable',id:`ascent-gather-${contact.support}-missing`,lastContact:contact};
    return {...transitionPlacement(frame,contact.contact,pose,transitionFrames,referenceHeight),supportIndex:index};
  }
  if(pose.mode==='contact-hold'&&Number.isFinite(current)&&current>=1)return cycle(current);
  if(pose.mode==='stepping'&&Number.isFinite(current)&&current>=1)return cycle(current);
  return null;
}

export function createAscentRenderer({atlas,frames,transitionAtlas,transitionFrames,groundRenderer,legacyRenderer,nodes,referenceHeight=500}) {
  const cycleFrames=readFrames(frames),transitions=readFrames(transitionFrames)??[];
  if(!atlas||!groundRenderer||!legacyRenderer||!Array.isArray(cycleFrames)||cycleFrames.length!==16) {
    throw new Error('V14 needs the V13 paintings and the approved ground/descent renderers.');
  }
  if(Boolean(transitionAtlas)!==Boolean(transitionFrames))throw new Error('Transition paintings and measured metadata must be supplied together.');
  function read(atlas,items,{columns=4,cellWidth=500,cellHeight=620}={}) {
    return items.map(frame=>{
      const image=document.createElement('canvas');image.width=cellWidth;image.height=cellHeight;
      const context=image.getContext('2d',{willReadFrequently:true});
      context.drawImage(atlas,(frame.cell%columns)*cellWidth,Math.floor(frame.cell/columns)*cellHeight,cellWidth,cellHeight,0,0,cellWidth,cellHeight);
      return {image,pixels:context.getImageData(0,0,cellWidth,cellHeight),cell:frame.cell};
    });
  }
  const cycle=read(atlas,cycleFrames),transition=transitionAtlas?read(transitionAtlas,transitions,transitionFrames):[];
  // Same static registration, with the exact same V13 key as colour reference.
  if(transitionFrames&&(transitionFrames.cellWidth??500)!==500)throw new Error('Transition cells must keep the shared 500-pixel authoring plane.');
  const paintings=[...cycle,...transition];registerPaintedColours(paintings.map(p=>p.pixels.data));
  for(const painting of paintings)painting.image.getContext('2d').putImageData(painting.pixels,0,0);
  const sources={cycle:new Map(cycle.map(p=>[p.cell,p.image])),transition:new Map(transition.map(p=>[p.cell,p.image]))};
  const handoff=createAscentGroundHandoff();let armedLanding=false;
  let cachedHeight=null,geometry=null;
  function placement(pose) {
    if(pose.height!==cachedHeight){geometry=createRoomAscentGeometry({nodes,frames:cycleFrames,height:pose.height,referenceHeight});cachedHeight=pose.height;}
    const drawing=getAscentPlacement(pose,{nodes,frames:cycleFrames,transitionFrames,referenceHeight,geometry});
    if(pose.facing===1&&pose.mode==='gathering'&&pose.index===nodes.length-1&&drawing?.contact&&!armedLanding) {
      handoff.arm(drawing.contact);armedLanding=true;
    }
    if(pose.mode==='stepping'&&(pose.stepFrom===0||pose.facing===-1))armedLanding=false;
    return drawing;
  }
  function fallback(pose,drawing) {
    if(drawing?.kind==='ground')return {renderer:groundRenderer,pose:drawing.pose};
    // Missing transition artwork is intentionally visible to the integrator.
    // It must be completed before release; no V8/V9 ascent is substituted.
    if(drawing?.kind==='unavailable')throw new Error(`Incomplete V14 transition: ${drawing.id}`);
    return {renderer:legacyRenderer,pose};
  }
  return {
    source:{renderer:'whole-painted-ascent-v14',referenceHeight,frameCount:cycle.length+transition.length,
      grading:'v13-static-colour-registration',supports:'registered-forefoot-on-standard-treads',
      transitionReady:transitions.length>=6,downRenderer:legacyRenderer.source?.renderer},
    getPlacement:placement,
    prepareGroundPose(pose,options){return handoff.prepare(pose,options);},
    getArtwork(pose){return placement(pose)?.id??'stair-refined-v9';},
    getFootprints(pose){const d=placement(pose);if(d?.kind==='painted')return [d.contact];const f=fallback(pose,d);return f.renderer.getFootprints(f.pose);},
    draw(ctx,pose,options={}) {
      const d=placement(pose);
      if(d?.kind!=='painted'){const f=fallback(pose,d);f.renderer.draw(ctx,f.pose,options);return;}
      if(options.reflection||(options.alpha??1)<=0)return;
      ctx.save();ctx.globalAlpha*=options.alpha??1;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      ctx.drawImage(sources[d.source].get(d.cell),d.x,d.y,d.width,d.height);ctx.restore();
    },
  };
}
