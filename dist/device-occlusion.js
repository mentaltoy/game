// Hidden-side cloth restorations, painted from the exact V5 waist crops.
// The source painting, alpha, silhouette and animation metadata stay intact.
// Coordinates below are in the original cell, before mirroring or grading.
const path = (...points) => points;
const main = (left, top, right, bottom) => path([left+5,top],[right-4,top],[right,top+5],[right,bottom-10],[right-3,bottom-3],[right-9,bottom],[left+6,bottom],[left,bottom-5],[left,top+7]);
const antenna = (x,y) => path([x,y],[x+4,y],[x+5,y+12],[x-1,y+12]);
const cord = (x,y) => path([x+10,y],[x+15,y+1],[x+11,y+12],[x+6,y+22],[x,y+30],[x-4,y+26],[x-2,y+19],[x+4,y+10]);

// Protected polygons locate the existing near-arm edge. Within them the
// original skin is retained; only visible hardware and mixed device edges
// can receive the painted restoration.
const above = (...edge) => [[120,170],[330,170],[330,edge[edge.length-1][1]],...edge.slice().reverse(),[120,edge[0][1]]];
export const DEVICE_PATCHES = [
  {id:'approved-0',tile:0,crop:[141,184,96,96],shapes:[main(177,214,202,258),antenna(188,203),cord(168,222)]},
  {id:'bridge-0',tile:1,crop:[141,184,96,96],shapes:[main(178,213,203,257),antenna(189,203),cord(170,219)]},
  {id:'approved-1',tile:2,crop:[141,184,96,96],shapes:[main(179,211,202,254),antenna(190,201),cord(170,219)]},
  {id:'bridge-1',tile:3,crop:[141,184,96,96],shapes:[main(177,211,202,254),antenna(189,202),cord(171,219)],protect:[[[120,190],[160,190],[168,209],[173,231],[180,265],[180,280],[120,280]]]},
  {id:'approved-2',tile:4,crop:[141,184,96,96],shapes:[main(178,211,202,254),antenna(190,202)],protect:[[[120,190],[165,190],[174,213],[179,237],[185,266],[185,280],[120,280]]]},
  {id:'supplement-0',tile:5,crop:[184,265,128,128],shapes:[path([230,314],[245,322],[259,331],[271,342],[268,354],[261,360],[242,362],[232,357],[229,349]),path([225,316],[237,323],[231,338],[223,350],[216,350],[213,345],[217,331]),antenna(264,289)],protect:[above([220,313],[231,323],[242,331],[257,341],[272,350],[290,363])],mixedHardware:[[247,329],[250,331]]},
  {id:'bridge-2',tile:6,crop:[141,184,96,96],shapes:[main(174,210,202,258),cord(167,220)],protect:[above([181,211],[190,221],[202,231],[216,240])]},
  {id:'bridge-3',tile:7,crop:[141,184,96,96],shapes:[main(175,210,202,257),cord(168,216)],protect:[above([180,210],[190,219],[204,228],[219,237])]},
  {id:'approved-4',tile:8,crop:[141,184,96,96],shapes:[main(175,211,201,256),cord(166,217)],protect:[above([183,208],[195,216],[209,224],[222,232])]},
  {id:'bridge-4',tile:9,crop:[141,184,96,96],shapes:[main(175,210,203,254),cord(166,217)],protect:[above([180,207],[192,215],[206,224],[222,232])]},
  {id:'approved-5',tile:10,crop:[141,184,96,96],shapes:[main(177,210,204,254),cord(169,215)],protect:[above([183,209],[195,217],[208,225],[224,232])]},
  {id:'bridge-5',tile:11,crop:[141,184,96,96],shapes:[main(176,211,203,254),cord(168,218)],protect:[above([179,210],[190,221],[203,230],[219,240])]},
  {id:'approved-6',tile:12,crop:[141,184,96,96],shapes:[main(168,211,195,252),cord(160,216)],protect:[above([176,213],[185,225],[195,237],[207,248])]},
  {id:'bridge-6',tile:13,crop:[141,184,96,96],shapes:[main(175,213,202,252),antenna(190,207)],protect:[[[120,190],[161,190],[169,208],[175,229],[183,255],[189,277],[120,280]]]},
  {id:'supplement-1',tile:14,crop:[193,255,128,128],shapes:[main(241,298,270,354),antenna(255,287),cord(230,310)]},
  {id:'settle-3',tile:15,crop:[214,255,128,128],shapes:[main(264,295,289,355),antenna(276,285),cord(255,305)],protect:[[[214,275],[250,275],[254,299],[259,326],[266,353],[271,383],[214,383]]]},
];
const patches = new Map(DEVICE_PATCHES.map(entry => [entry.id, entry]));

function signedDistance(x,y,polygon) {
  let inside=false, closest=Infinity;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const [ax,ay]=polygon[j], [bx,by]=polygon[i];
    if((ay>y)!==(by>y) && x<(bx-ax)*(y-ay)/(by-ay)+ax) inside=!inside;
    const dx=bx-ax,dy=by-ay, length=dx*dx+dy*dy;
    const t=length?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/length)):0;
    closest=Math.min(closest,Math.hypot(x-ax-dx*t,y-ay-dy*t));
  }
  return inside?closest:-closest;
}

export function deviceMaskAt(entry,x,y,pixels,index=0) {
  const distance=Math.max(...entry.shapes.map(shape=>signedDistance(x,y,shape)))+2;
  if(distance<=-1) return 0;
  if(entry.protect?.some(shape=>signedDistance(x,y,shape)>=-.75)) {
    if(!pixels) return 0;
    const r=pixels[index],g=pixels[index+1],b=pixels[index+2];
    // The authored skin remains exact. Yellow display pixels adjacent to it
    // are not skin and must disappear with the rest of the hardware.
    const mixedHardware=entry.mixedHardware?.some(([px,py])=>Math.floor(x)===px && Math.floor(y)===py);
    if(!mixedHardware && r>85 && r-g>23 && g-b>8 && g-b<(r-g)*.9+12) return 0;
  }
  const t=Math.max(0,Math.min(1,(distance+1)/2));
  return t*t*(3-2*t);
}

export function createFarSidePainting(frame,patchAtlas) {
  const entry=patches.get(frame.id);
  if(!entry || !patchAtlas) return null;
  const result=document.createElement('canvas');
  result.width=frame.width; result.height=frame.height;
  const ctx=result.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(frame.image,0,0);
  const [x,y,width,height]=entry.crop;
  const crop=document.createElement('canvas'); crop.width=width; crop.height=height;
  const cropCtx=crop.getContext('2d',{willReadFrequently:true});
  const tileWidth=patchAtlas.width/4,tileHeight=patchAtlas.height/4;
  cropCtx.drawImage(patchAtlas,entry.tile%4*tileWidth,Math.floor(entry.tile/4)*tileHeight,tileWidth,tileHeight,0,0,width,height);
  const source=ctx.getImageData(x,y,width,height), restored=cropCtx.getImageData(0,0,width,height);
  for(let cy=0;cy<height;cy++) for(let cx=0;cx<width;cx++) {
    const i=(cy*width+cx)*4,weight=deviceMaskAt(entry,x+cx+.5,y+cy+.5,source.data,i);
    if(!weight || source.data[i+3]===0) continue;
    for(let channel=0;channel<3;channel++) source.data[i+channel]=Math.round(source.data[i+channel]*(1-weight)+restored.data[i+channel]*weight);
    // Original alpha is authoritative: no new opaque pixel or contour.
  }
  ctx.putImageData(source,x,y);
  return result;
}
