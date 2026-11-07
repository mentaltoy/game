// V9 running paintings. Whole figures only; the approved walk is a fallback.
// Atlas packing uses one uniform 1.20 source scale and a fixed 495px character
// reference, never per-frame bounding height. Flight poses retain their lift.
import { gradeRun } from './run-grade.js';
export const RUN_ART = [{"id":"run-0","cell":0,"cap":73,"floor":519,"root":210,"baseline":519,"sole":[218.5,519],"flight":false,"devicePatch":[124,221,112,112]},{"id":"run-1","cell":1,"cap":73,"floor":519,"root":210,"baseline":519,"sole":[164.0,519],"flight":false,"devicePatch":[122,214,112,112]},{"id":"run-2","cell":2,"cap":72,"floor":520,"root":210,"baseline":520,"sole":[123.5,520],"flight":false,"devicePatch":[123,220,112,112]},{"id":"run-3","cell":3,"cap":72,"floor":522,"root":210,"baseline":522,"sole":[84.5,522],"flight":false,"devicePatch":[123,220,112,112]},{"id":"run-4","cell":4,"cap":71,"floor":470,"root":210,"baseline":520,"sole":null,"flight":true,"devicePatch":[125,220,112,112]},{"id":"run-5","cell":5,"cap":73,"floor":509,"root":210,"baseline":520,"sole":null,"flight":true,"devicePatch":[126,220,112,112]},{"id":"run-6","cell":6,"cap":74,"floor":520,"root":210,"baseline":520,"sole":[240.5,520],"flight":false,"devicePatch":[124,222,112,112]},{"id":"run-7","cell":7,"cap":75,"floor":520,"root":210,"baseline":520,"sole":[158.0,520],"flight":false,"devicePatch":[121,222,112,112]},{"id":"run-8","cell":8,"cap":76,"floor":518,"root":210,"baseline":518,"sole":[169.0,518],"flight":false,"devicePatch":[117,222,112,112]},{"id":"run-9","cell":9,"cap":73,"floor":519,"root":210,"baseline":519,"sole":[86.5,519],"flight":false,"devicePatch":[122,222,112,112]},{"id":"run-10","cell":10,"cap":72,"floor":484,"root":210,"baseline":520,"sole":null,"flight":true,"devicePatch":[123,217,112,112]},{"id":"run-11","cell":11,"cap":75,"floor":511,"root":210,"baseline":520,"sole":null,"flight":true,"devicePatch":[127,222,112,112]}];
export const RUN_TIMELINE = [[0,0],[.0995,1],[.1726,2],[.2472,3],[.36,4],[.46,5],
 [.5,6],[.6308,8],[.6506,7],[.781,9],[.88,10],[.96,11]];
export const RUN_TRANSITIONS = [
 {id:'run-transition-0',cell:0,cap:44,floor:520,root:210,baseline:520,sole:[183,520],flight:false,devicePatch:[131,186,136,136]},
 {id:'run-transition-1',cell:1,cap:62,floor:520,root:210,baseline:520,sole:[170,520],flight:false,devicePatch:[103,202,136,136]}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mod=v=>((v%1)+1)%1;
const distance=(a,b)=>mod(b-a+.5)-.5;
const REFERENCE_HEIGHT=495;
function canvas(width,height){const c=document.createElement('canvas');c.width=width;c.height=height;return c;}
function pointDistance(x,y,polygon){
 let inside=false,closest=Infinity;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const [ax,ay]=polygon[j],[bx,by]=polygon[i];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
  const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);
  closest=Math.min(closest,Math.hypot(x-ax-t*dx,y-ay-t*dy));
 }
 return inside?closest:-closest;
}
const DEVICE_SHAPES=[[[44,32],[69,33],[72,39],[67,78],[62,84],[43,82],[39,75]],
 [[57,23],[63,24],[63,39],[56,39]],[[35,39],[43,39],[40,54],[35,69],[30,75],[28,68],[32,53]]];
const TRANSITION_DEVICE_SHAPES=[
 [[94,80],[125,84],[130,96],[124,125],[117,140],[103,145],[90,137],[85,121],[89,97]],
 [[108,66],[119,68],[119,83],[107,83]]
].map(shape=>shape.map(([x,y])=>[x*136/220,y*136/220]));
function hideDevice(image,art,atlas,{columns=4,rows=3,shapes=DEVICE_SHAPES}={}){
 const result=canvas(420,560),ctx=result.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
 const [x,y,width,height]=art.devicePatch,patch=canvas(width,height),pctx=patch.getContext('2d',{willReadFrequently:true});
 const tw=atlas.width/columns,th=atlas.height/rows;
 pctx.drawImage(atlas,art.cell%columns*tw,Math.floor(art.cell/columns)*th,tw,th,0,0,width,height);
 const a=ctx.getImageData(x,y,width,height),b=pctx.getImageData(0,0,width,height);
 for(let py=0;py<height;py++)for(let px=0;px<width;px++){
  const i=(py*width+px)*4;if(!a.data[i+3])continue;
  const d=Math.max(...shapes.map(shape=>pointDistance(px+.5,py+.5,shape)));
  let weight=clamp((d+4)/4,0,1);weight=weight*weight*(3-2*weight);if(!weight)continue;
  const r=a.data[i],g=a.data[i+1],blue=a.data[i+2];
  // Only cell 1 has a foreground hand crossing the device itself.
  if(art.id==='run-1'&&r>85&&r-g>23&&g-blue>8&&g-blue<(r-g)*.9+12)continue;
  for(let channel=0;channel<3;channel++)a.data[i+channel]=Math.round(a.data[i+channel]*(1-weight)+b.data[i+channel]*weight);
 }
 ctx.putImageData(a,x,y);return result;
}
export function chooseRunFrame(pose){
 const level=Number.isFinite(pose.runLevel)?pose.runLevel:pose.runWeight;
 if(pose.turn||pose.settled||!(level>0.02))return null;
 if(level<.32)return RUN_TRANSITIONS[0];
 if(level<.70)return RUN_TRANSITIONS[1];
 const phase=mod(Number.isFinite(pose.runPhase)?pose.runPhase:0);
 let selected=RUN_TIMELINE[0],nearest=Infinity;
 for(const entry of RUN_TIMELINE){const d=Math.abs(distance(phase,entry[0]));if(d<nearest){selected=entry;nearest=d;}}
 return RUN_ART[selected[1]];
}
/** runPhase is distance-driven. runWeight is state, never an opacity blend. */
export function createRunRenderer({runImage,devicePatchAtlas,transitionImage,transitionDevicePatchAtlas,groundRenderer}){
 if(!runImage||runImage.width!==1680||runImage.height!==1680||!devicePatchAtlas||!groundRenderer)
  throw new Error('The 12-pose run atlas, hidden-hip restoration and approved ground renderer are required.');
 const frames=new Map();
 function prepare(art,atlas,columns,patchAtlas,patchOptions){
  const image=canvas(420,560),ctx=image.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(atlas,art.cell%columns*420,Math.floor(art.cell/columns)*560,420,560,0,0,420,560);
  const left=hideDevice(image,art,patchAtlas,patchOptions);
  for(const [painting,deviceHidden] of [[image,false],[left,true]]){
   const context=painting.getContext('2d',{willReadFrequently:true});
   const pixels=context.getImageData(0,0,420,560);
   gradeRun(pixels,420,{...art,deviceHidden});context.putImageData(pixels,0,0);
  }
  frames.set(art.id,{art,right:image,left});
 }
 RUN_ART.forEach(art=>prepare(art,runImage,4,devicePatchAtlas));
 const hasTransitions=transitionImage?.width===840&&transitionImage?.height===560&&transitionDevicePatchAtlas;
 if(hasTransitions)RUN_TRANSITIONS.forEach(art=>prepare(art,transitionImage,2,transitionDevicePatchAtlas,{columns:2,rows:1,shapes:TRANSITION_DEVICE_SHAPES}));
 const select=pose=>{const art=chooseRunFrame(pose);return art&&frames.has(art.id)?art:null;};
 return {
  source:{renderer:'whole-painted-run',frameCount:12,referenceHeight:REFERENCE_HEIGHT,
   frameOrder:RUN_TIMELINE.map(x=>x[1]),frameTimes:RUN_TIMELINE.map(x=>x[0]),strideHeightRatio:1.10,
   flightCells:[4,5,10,11],transitionCount:hasTransitions?2:0,grading:'fixed-material-rgb',device:'right-hip-hidden-when-left'},
  getFootprints(pose){
   const art=select(pose);if(!art)return groundRenderer.getFootprints(pose);
   if(art.flight)return [];
   const scale=pose.height/REFERENCE_HEIGHT,facing=pose.facing<0?-1:1;
   return [{x:pose.x+(art.sole[0]-art.root)*scale*facing,y:pose.floor,clearance:0,contact:1}];
  },
  draw(ctx,pose,{alpha=1,reflection=false}={}){
   const art=select(pose);if(!art){groundRenderer.draw(ctx,pose,{alpha,reflection});return;}
   const image=pose.facing<0?frames.get(art.id).left:frames.get(art.id).right,scale=pose.height/REFERENCE_HEIGHT;
   ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   ctx.translate(pose.x,pose.floor);ctx.scale((pose.facing<0?-1:1)*scale,(reflection?-.26:1)*scale);
   if(reflection)ctx.filter='blur(2px)';
   ctx.drawImage(image,-art.root,-art.baseline);ctx.restore();
  }
 };
}
