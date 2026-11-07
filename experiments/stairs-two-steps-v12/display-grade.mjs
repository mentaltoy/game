// Static colour registration of complete paintings. No blur, geometry, alpha,
// body-part animation or temporal blend. The source PNG remains untouched.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const ramp=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t);};
function weights(x,y,r,g,b){
 const l=.2126*r+.7152*g+.0722*b;
 const shirt=ramp(150,175,y)*(1-ramp(300,320,y))*(1-ramp(.16,.28,(Math.max(r,g,b)-Math.min(r,g,b))/Math.max(1,r,g,b)));
 const pants=ramp(310,335,y)*(1-ramp(455,485,y))*ramp(5,14,r-g)*ramp(8,20,g-b)*(1-ramp(1.26,1.38,r/Math.max(1,g)));
 const hair=ramp(78,87,y)*(1-ramp(128,146,y))*(1-ramp(252,270,x))*ramp(202,214,x)*(1-ramp(95,125,l));
 const face=ramp(106,123,y)*(1-ramp(157,176,y))*ramp(245,262,x)*(1-ramp(285,297,x))*ramp(1.24,1.4,r/Math.max(1,g));
 return {shirt,pants,hair,face};
}
function means(data,width){const sums=Object.fromEntries(['shirt','pants','hair','face'].map(k=>[k,[0,0,0,0]]));for(let y=75;y<Math.min(490,data.length/4/width);y++)for(let x=140;x<Math.min(390,width);x++){const i=(y*width+x)*4;if(data[i+3]<230)continue;const w=weights(x,y,...data.slice(i,i+3));for(const k in w)if(w[k]>.6){for(let c=0;c<3;c++)sums[k][c]+=data[i+c]*w[k];sums[k][3]+=w[k];}}return Object.fromEntries(Object.entries(sums).map(([k,s])=>[k,s.slice(0,3).map(v=>v/Math.max(1,s[3]))]));}
export function registerPaintedColours(arrays,width=500){const reference=means(arrays[0],width),audit=[];for(const data of arrays){const before=means(data,width),gain={};for(const k in before){const cap=k==='face'?.06:k==='pants'?.10:.12;gain[k]=before[k].map((v,c)=>v>1?clamp(reference[k][c]/v,1-cap,1+cap):1);}for(let y=75;y<Math.min(490,data.length/4/width);y++)for(let x=140;x<Math.min(390,width);x++){const i=(y*width+x)*4;if(!data[i+3])continue;const w=weights(x,y,...data.slice(i,i+3));for(let c=0;c<3;c++){let delta=0;for(const k in w)delta+=(gain[k][c]-1)*w[k];data[i+c]=clamp(Math.round(data[i+c]*(1+delta)),0,255);}}audit.push({before,gain,after:means(data,width)});}return {reference,audit};}
