import { gradeStair } from './stair-grade.js?v=9';

// Measured on the immutable 362 × 543 source cells. One physical shoe is
// selected for support; a second shadow is never inferred from the bbox.
export const STAIR_ART = {
  up: [
    {root:168,cap:21,floor:523,sole:[93.5,523]},
    {root:168,cap:18,floor:520,sole:[204,478]},
    {root:168.5,cap:18,floor:522,sole:[157,522]},
    {root:166.5,cap:18,floor:521,sole:[111,521]},
    {root:168,cap:19,floor:524,sole:[101,524]},
    {root:168,cap:17,floor:499,sole:[195.5,489]},
    {root:170.5,cap:19,floor:512,sole:[172,512]},
    {root:170,cap:18,floor:522,sole:[117,522]},
  ],
  down: [
    {root:197,cap:18,floor:506,sole:[254.5,506]},
    {root:195.5,cap:20,floor:506,sole:[248.5,466]},
    {root:192.5,cap:23,floor:506,sole:[231,465]},
    {root:193.5,cap:27,floor:505,sole:[211,484]},
    {root:193.5,cap:25,floor:523,sole:[132,523]},
    {root:193.5,cap:25,floor:512,sole:[154.5,512]},
    {root:192,cap:26,floor:520,sole:[149,520]},
    {root:193.5,cap:28,floor:525,sole:[252,513]},
  ],
  refined: [
  {
    "root": 168.2,
    "cap": 18,
    "floor": 512,
    "sole": [
      177.79999999999998,
      512.4
    ],
    "id": "stair-up-v9-0"
  },
  {
    "root": 168.2,
    "cap": 18,
    "floor": 511,
    "sole": [
      178.76,
      511.43999999999994
    ],
    "id": "stair-up-v9-1"
  },
  {
    "root": 167.68,
    "cap": 18,
    "floor": 509,
    "sole": [
      161.92,
      509.48
    ],
    "id": "stair-up-v9-2"
  },
  {
    "root": 167.68,
    "cap": 18,
    "floor": 490,
    "sole": [
      191.68,
      490.32
    ],
    "id": "stair-up-v9-3"
  },
  {
    "root": 167.68,
    "cap": 18,
    "floor": 503,
    "sole": [
      184,
      502.71999999999997
    ],
    "id": "stair-up-v9-4"
  },
  {
    "root": 168.2,
    "cap": 18,
    "floor": 505,
    "sole": [
      176.84,
      504.64
    ],
    "id": "stair-up-v9-5"
  },
  {
    "root": 167.68,
    "cap": 18,
    "floor": 502,
    "sole": [
      173.92,
      501.76
    ],
    "id": "stair-up-v9-6"
  },
  {
    "root": 167.68,
    "cap": 18,
    "floor": 502,
    "sole": [
      174.4,
      501.76
    ],
    "id": "stair-up-v9-7"
  },
  {
    "root": 193.51999999999998,
    "cap": 24,
    "floor": 526,
    "sole": [
      184.4,
      526.0799999999999
    ],
    "id": "stair-down-v9-0"
  },
  {
    "root": 194,
    "cap": 24,
    "floor": 518,
    "sole": [
      196.88,
      518.4
    ],
    "id": "stair-down-v9-1"
  },
  {
    "root": 194.48,
    "cap": 24,
    "floor": 514,
    "sole": [
      216.07999999999998,
      513.56
    ],
    "id": "stair-down-v9-2"
  },
  {
    "root": 194.48,
    "cap": 24,
    "floor": 523,
    "sole": [
      166.64,
      523.1999999999999
    ],
    "id": "stair-down-v9-3"
  },
  {
    "root": 194,
    "cap": 24,
    "floor": 526,
    "sole": [
      158.48,
      526
    ],
    "id": "stair-down-v9-4"
  },
  {
    "root": 194.48,
    "cap": 24,
    "floor": 524,
    "sole": [
      167.6,
      524.0799999999999
    ],
    "id": "stair-down-v9-5"
  },
  {
    "root": 193.96,
    "cap": 24,
    "floor": 523,
    "sole": [
      156.04,
      523.12
    ],
    "id": "stair-down-v9-6"
  },
  {
    "root": 194.44,
    "cap": 24,
    "floor": 523,
    "sole": [
      175.72,
      523.12
    ],
    "id": "stair-down-v9-7"
  }
],
  bridge: [
    {root:168.5,cap:18,floor:497,sole:[208.5,497],id:'stair-up-bridge-0'},
    {root:168.5,cap:18,floor:500,sole:[209,500],id:'stair-up-bridge-1'},
    {root:194.5,cap:20,floor:500,sole:[262,500],id:'stair-down-bridge-2'},
  ],
};
// Each entry is [first phase, cell, support (0=old tread, 1=new tread)].
// Wide double-contact poses are excluded from the repeatable cycle.
const UP = [[0,6,0],[.16,2,0],[.36,1,1],[.52,5,1],[.72,6,1],[.88,2,1]];
const DOWN = [[0,0,0],[.3,3,0],[.58,4,1],[.74,5,1],[.88,6,1]];
const UP_BRIDGED = [...UP,[.59,0,1,'bridge'],[.65,1,1,'bridge']].sort((a,b)=>a[0]-b[0]);
const DOWN_BRIDGED = [...DOWN,[.14,2,0,'bridge']].sort((a,b)=>a[0]-b[0]);
const TREAD_SLOPES = [12/211,10/212,10/214,7/214,8/738];

// The optional V9 paintings bridge measured head/sole positions. A drawing is
// translated as a whole around a tread contact; it never follows the root while
// its supporting shoe is planted.
function refinedEntry(pose,nodes) {
 const rise=Math.abs(nodes[pose.stepTo].y-nodes[pose.stepFrom].y)/pose.height;
 const up=[[0,6,0,'up',[129,512]],[.13,2,0,'refined',[121.12,509.48]],[.32,1,1,'up',[165,478]],[.46,5,1,'up',[160,489]],[.57,3,1,'refined',[150.88,490.32]],[.69,4,1,'refined',[147.04,502.72]],[.80,5,1,'refined',[135.56,504.64]],[.91,6,1,'up',[129,512]]];
 if(rise>.09)up.splice(2,0,[.23,2,0,'up',[113,522]]);
 const down=[[0,8,0,'refined'],[.13,9,0,'refined'],[.27,10,0,'refined'],[.40,11,0,'refined',[216.56,497.28]],[.61,11,1,'refined'],[.72,13,1,'refined'],[.82,15,1,'refined'],[.93,8,1,'refined']];
 if(rise>.09)down.splice(4,0,[.51,3,0,'down',[215.6,484]]);
 let entry=(pose.facing===1?up:down)[0];
 for(const candidate of pose.facing===1?up:down)if(pose.stepPhase>=candidate[0])entry=candidate;
 return entry;
}
function selectedEntry(pose,bridges) {
  const sequence=pose.facing===1?(bridges?UP_BRIDGED:UP):(bridges?DOWN_BRIDGED:DOWN);
  let result=sequence[0];
  for(const entry of sequence) if(pose.stepPhase>=entry[0]) result=entry;
  return result;
}

/** Pure placement data, also used by the source-art contact review. */
export function getStairFramePlacement(pose,{nodes,referenceHeight=500,bridges=false,refined=false}) {
  if(refined && pose.mode==='gathering' && pose.lastStep && (pose.gatherProgress??1)<.45) pose={...pose,...pose.lastStep,stepPhase:1,mode:'stepping'};
  if(pose.mode!=='stepping') return null;
  const direction=pose.facing===1?'up':'down',entry=refined?refinedEntry(pose,nodes):selectedEntry(pose,bridges),cell=entry[1],source=entry[3]||direction;
  const art=STAIR_ART[source][cell],sole=entry[4]||art.sole,scale=pose.height/referenceHeight;
  const nodeIndex=entry[2]?pose.stepTo:pose.stepFrom,node=nodes[nodeIndex];
  if(!node) throw new Error('The stair pose references an unavailable support.');
  const supportX=node.x-(refined&&direction==='up'?pose.height*.083:0);
  const x=refined?supportX-sole[0]*scale:pose.x-art.root*scale,contactX=x+sole[0]*scale;
  const xScale=nodes[0].x/916,yScale=nodes[0].y/800;
  const tread=node.step??nodeIndex-1;
  const slope=tread<0?0:(TREAD_SLOPES[Math.min(tread,4)]||0)*yScale/xScale;
  const contactY=node.y+(contactX-node.x)*slope;
  return {direction,source,cell,id:art.id||`stair-${direction}-${cell}`,scale,x,y:contactY-sole[1]*scale,sole,head:{x:x+art.root*scale,y:contactY-(sole[1]-art.cap)*scale},
    width:362*scale,height:543*scale,contact:{x:contactX,y:contactY,clearance:0,contact:1},supportIndex:nodeIndex};
}

function neutralPose(pose) {
  if(pose.turn) return {...pose,walkWeight:0};
  if(pose.mode==='gathering') return {...pose,walkWeight:.2*(1-(pose.gatherProgress??0)),mode:'stopping'};
  return {...pose,walkWeight:0};
}

export function createStairRenderer({upImage,downImage,bridgeImage,refinementImage,groundRenderer,nodes,referenceHeight=500}) {
  if(!upImage || !downImage || !groundRenderer || !Array.isArray(nodes) || nodes.length<2) {
    throw new Error('Stair paintings, the ground renderer and tread supports are required.');
  }
  if(!Number.isFinite(referenceHeight)||referenceHeight<=0) throw new Error('Invalid stair illustration scale.');
  function read(atlas,direction) {
    const columns=direction==='bridge'?2:4;
    if(atlas.width!==columns*362||atlas.height!==(direction==='refined'?2172:1086)) throw new Error('Stair atlas must retain its source cell geometry.');
    return STAIR_ART[direction].map((art,cell)=>{
      const image=document.createElement('canvas');image.width=362;image.height=543;
      const ctx=image.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(atlas,(cell%columns)*362,Math.floor(cell/columns)*543,362,543,0,0,362,543);
      const pixels=ctx.getImageData(0,0,362,543);
      gradeStair(pixels,362,{cap:art.cap,floor:art.floor,root:art.root,id:art.id||`stair-${direction}-${cell}`});
      ctx.putImageData(pixels,0,0);
      return image;
    });
  }
  const frames={up:read(upImage,'up'),down:read(downImage,'down')};
  if(bridgeImage) frames.bridge=read(bridgeImage,'bridge');
  if(refinementImage) frames.refined=read(refinementImage,'refined');
  function placement(pose) { return getStairFramePlacement(pose,{nodes,referenceHeight,bridges:!!bridgeImage,refined:!!refinementImage}); }
  return {
    source:{renderer:refinementImage?'whole-painted-stairs-v9':'whole-painted-stairs',referenceHeight,upCells:[6,2,1,5],downCells:[0,3,4,5,6],bridgeCells:bridgeImage?[0,1,2]:[],supports:refinementImage?'fixed-tread-contact':'one-authored-sole',refined:!!refinementImage},
    getFootprints(pose) {
      const drawing=placement(pose);
      return drawing?[drawing.contact]:groundRenderer.getFootprints(neutralPose(pose));
    },
    draw(ctx,pose,options={}) {
      const drawing=placement(pose);
      if(!drawing) { groundRenderer.draw(ctx,neutralPose(pose),options);return; }
      if(options.reflection || (options.alpha??1)<=0) return;
      ctx.save();ctx.globalAlpha*=options.alpha??1;
      ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      ctx.drawImage(frames[drawing.source][drawing.cell],drawing.x,drawing.y,drawing.width,drawing.height);
      ctx.restore();
    },
  };
}
