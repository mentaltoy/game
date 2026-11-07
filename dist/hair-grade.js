// Hair-only display calibration. Apply to original pixels before normalizeHead.
// No pixel is moved, synthesized, blurred or sharpened; alpha is never written.
import { HEAD_CALIBRATION } from './head-calibration.js?v=6';
export const HAIR_REFERENCE = [76.802418227565, 66.05740137734861, 60.73185680065873];
export const HAIR_GAIN = {
  "approved-0": [0.9975,0.9994,0.99979],
  "approved-1": [1.00142,1.00522,1.00568],
  "approved-2": [0.99859,1.0006,1.00021],
  "approved-4": [0.96516,0.96416,0.9622],
  "approved-5": [1.00314,1.0038,1.00145],
  "approved-6": [1.0027,0.99883,0.9939],
  "bridge-0": [0.87117,0.87959,0.87327],
  "bridge-1": [0.86847,0.87631,0.87273],
  "bridge-2": [0.87437,0.88426,0.87626],
  "bridge-3": [0.87568,0.884,0.87818],
  "bridge-4": [0.87142,0.87813,0.87101],
  "bridge-5": [0.89303,0.90945,0.90703],
  "bridge-6": [0.80121,0.82725,0.83104],
  "supplement-0": [0.86627,0.87882,0.87303],
  "supplement-1": [0.90238,0.91226,0.89862],
  "turn-0": [0.9125,0.92612,0.9197],
  "turn-1": [0.94589,0.95451,0.94671],
  "turn-2": [0.93621,0.94787,0.94702],
  "turn-3": [0.98051,0.99848,0.99805],
  "turn-4": [0.98863,1.0128,1.01809],
  "turn-5": [0.93035,0.9467,0.94598],
  "turn-6": [0.91268,0.92583,0.91825],
  "settle-3": [0.92103,0.92547,0.9066]
};

// The hairline excludes forehead/eyebrows, with separate ear guards. Shapes
// are in the existing V6 registered head space; they do not deform the art.
// A separate low, rear-hair exposure corrects the brighter source brushwork.
// The crown, hairline and the protected ear/neck boundaries keep the V7 grade.
export const HAIR_SIDE_GAIN = {
  "bridge-0": 0.834753,
  "bridge-1": 0.828861,
  "bridge-2": 0.825803,
  "bridge-3": 0.819739,
  "bridge-4": 0.856061,
  "bridge-5": 0.810758,
  "bridge-6": 0.78,
  "supplement-0": 0.854287,
  "supplement-1": 0.880687,
  "turn-0": 0.817156,
  "turn-6": 0.850752,
  "settle-3": 0.879701
};
const PROFILE = [[-.135,-.025],[.135,-.025],[.135,.030],[.075,.030],
  [.065,.052],[.035,.070],[.017,.082],[.012,.105],[-.006,.125],
  [-.020,.151],[-.054,.166],[-.112,.166],[-.135,.125]];
const FRONT = [[-.135,-.025],[.135,-.025],[.135,.160],[.070,.160],
  [.063,.112],[.050,.083],[.030,.062],[0,.054],[-.030,.062],
  [-.050,.083],[-.063,.112],[-.070,.160],[-.135,.160]];
const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
const ramp = (a,b,x) => { const t=clamp((x-a)/(b-a),0,1); return t*t*(3-2*t); };
function polygonWeight(x,y,polygon) {
  let inside=false,distance=Infinity;
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const [ax,ay]=polygon[j],[bx,by]=polygon[i];
    if((ay>y)!==(by>y) && x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
    const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy),0,1);
    distance=Math.min(distance,Math.hypot(x-ax-t*dx,y-ay-t*dy));
  }
  // A small inner feather keeps skin/hairline boundary samples unchanged.
  return inside?ramp(.0015,.006,distance):0;
}
function earGuard(x,y,cx,cy,rx=.024,ry=.027) {
  return ramp(1,1.25,Math.hypot((x-cx)/rx,(y-cy)/ry));
}

/** Hair RGB calibration, once per atlas cell and before normalizeHead.
 * Unknown IDs are unchanged. Face, ears, brows, neck and costume are excluded.
 */
export function gradeHair(imageData,width,{cap,floor,root,id}) {
  const gain=HAIR_GAIN[id],data=imageData?.data;
  const imageHeight=data?.length/(width*4),bodyHeight=floor-cap;
  if(!gain||!data||!Number.isInteger(width)||width<=0||!Number.isInteger(imageHeight)
    ||![cap,floor,root].every(Number.isFinite)||bodyHeight<=0)return;
  const turn=id.startsWith('turn-')?Number(id.slice(5)):-1;
  const front=turn>=2&&turn<=4,mirror=turn>=4;
  const polygon=front?FRONT:PROFILE,calibration=HEAD_CALIBRATION[id];
  const top=Math.max(0,Math.floor(cap-.01*bodyHeight));
  const bottom=Math.min(imageHeight,Math.ceil(cap+.195*bodyHeight));
  const left=Math.max(0,Math.floor(root-.16*bodyHeight));
  const right=Math.min(width,Math.ceil(root+.16*bodyHeight));
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++) {
    const i=(y*width+x)*4;if(!data[i+3])continue;
    let u=(x-root)/bodyHeight,v=(y-cap)/bodyHeight;
    if(calibration){
      const influence=1-ramp(.145,.20,v);
      u*=1+(calibration.x-1)*influence;
      v*=1+(calibration.y-1)*influence;
    }
    if(mirror)u=-u;
    let weight=polygonWeight(u,v,polygon)*(1-ramp(.125,.145,v));
    if(front)weight*=earGuard(u,v,-.062,.092,.027,.028)*earGuard(u,v,.062,.092,.027,.028);
    else weight*=earGuard(u,v,turn===1||turn===5?-.036:-.010,.087,.027,.028);
    if(turn===1||turn===5)weight*=1-ramp(-.015,-.009,u)*ramp(.073,.079,v);
    if(weight===0)continue;
    const r=data[i],g=data[i+1],b=data[i+2],chroma=Math.max(r,g,b)-Math.min(r,g,b);
    // Neutral brown strands remain distinct from warm face/ear skin.
    weight*=(1-ramp(18,28,r-g))*(1-ramp(30,44,r-b))
      *(1-ramp(40,58,chroma))*(1-ramp(150,180,.2126*r+.7152*g+.0722*b));
    if(weight<.00001)continue;
    const side=1+ramp(.061,.085,v)*(1-ramp(-.025,.005,u))*((HAIR_SIDE_GAIN[id]||1)-1);
    data[i]=Math.round(r*(1+weight*(gain[0]*side-1)));
    data[i+1]=Math.round(g*(1+weight*(gain[1]*side-1)));
    data[i+2]=Math.round(b*(1+weight*(gain[2]*side-1)));
  }
}
