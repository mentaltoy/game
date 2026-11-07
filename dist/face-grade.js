// Face-only colour calibration, once per source cell before normalizeHead.
// Multiplication preserves painted highlights, shadows and detail. No geometry,
// alpha or sampling changes; hair, eyes, brows and costume are excluded.
import { HEAD_CALIBRATION } from './head-calibration.js?v=6';
export const FACE_REFERENCE = [175.6276125932201, 127.75116655325178, 90.26598802894162];
export const FACE_GAIN = {
  "approved-0": [0.985761,0.989648,0.998043],
  "approved-1": [1.004165,1.001355,0.989569],
  "approved-2": [0.994173,0.998342,0.994165],
  "approved-4": [0.99587,0.998648,1.001965],
  "approved-5": [1.021842,1.030183,1.02559],
  "approved-6": [1.039201,1.042377,1.038978],
  "bridge-0": [0.987372,0.974092,0.939801],
  "bridge-1": [0.97605,0.964324,0.931711],
  "bridge-2": [0.991583,0.974095,0.932223],
  "bridge-3": [0.986614,0.972339,0.930003],
  "bridge-4": [0.970935,0.953906,0.926438],
  "bridge-5": [1.006037,0.985354,0.947648],
  "bridge-6": [0.983639,0.963731,0.897934],
  "supplement-0": [1.038885,0.985594,0.908965],
  "supplement-1": [1.030739,0.993118,0.933284],
  "turn-0": [1.011134,0.98665,0.935622],
  "turn-1": [1.015536,0.985343,0.928243],
  "turn-2": [1.029233,1.003678,0.932235],
  "turn-3": [1.021543,0.997783,0.922321],
  "turn-4": [1.019602,0.988768,0.924758],
  "turn-5": [1.038233,1.00458,0.937864],
  "turn-6": [1.030799,1.006345,0.948884],
  "settle-3": [1.039697,1.024008,0.967812]
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ramp=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

/** Apply to original pixels, after gradeHair and before normalizeHead.
 * Turn targets retain the source paintings' darker frontal lighting.
 * Unknown frames and invalid inputs are left unchanged.
 */
export function gradeFace(imageData,width,{cap,floor,root,id}) {
  const gain=FACE_GAIN[id],data=imageData?.data;
  const imageHeight=data?.length/(width*4),H=floor-cap;
  if(!gain||!data||!Number.isInteger(width)||width<=0||!Number.isInteger(imageHeight)
    ||![cap,floor,root].every(Number.isFinite)||H<=0)return;
  const calibration=HEAD_CALIBRATION[id];
  const top=Math.max(0,Math.floor(cap+.025*H));
  const bottom=Math.min(imageHeight,Math.ceil(cap+.175*H));
  const left=Math.max(0,Math.floor(root-.15*H));
  const right=Math.min(width,Math.ceil(root+.15*H));
  for(let y=top;y<bottom;y++)for(let x=left;x<right;x++) {
    const i=(y*width+x)*4;if(!data[i+3])continue;
    let u=(x-root)/H,v=(y-cap)/H;
    if(calibration){
      const influence=1-ramp(.145,.20,v);
      u*=1+(calibration.x-1)*influence;
      v*=1+(calibration.y-1)*influence;
    }
    let weight=ramp(.043,.052,v)*(1-ramp(.130,.155,v))
      *(1-ramp(.125,.145,Math.abs(u)));
    const r=data[i],g=data[i+1],b=data[i+2],luma=.2126*r+.7152*g+.0722*b;
    // Warm pigment identifies skin while excluding the neutral brown hair,
    // dark eyes/brows, eye whites and the blue-grey collar.
    weight*=ramp(17,24,r-g)*ramp(30,40,r-b)*ramp(7,13,g-b)
      *ramp(48,68,luma)*(1-ramp(240,252,luma));
    if(weight<.00001)continue;
    data[i]=Math.round(r*(1+weight*(gain[0]-1)));
    data[i+1]=Math.round(g*(1+weight*(gain[1]-1)));
    data[i+2]=Math.round(b*(1+weight*(gain[2]-1)));
  }
}
