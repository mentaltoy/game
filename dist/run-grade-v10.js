// Static display grading for the authored V10 running paintings.
// RGB only: never writes alpha, deforms a pose, smooths detail or moves a foot.
export const RUN_REFERENCE = {"shirt":[100.6886168416642,96.42329377403135,99.88758102878833],"pants":[140.9524644275798,115.02304954019253,87.37271444505309],"hair":[76.802418227565,66.05740137734861,60.73185680065873],"face":[175.6276125932201,127.75116655325178,90.26598802894162]};
export const RUN_GAIN = {
  "run-transition-0": {"shirt":[1.031211,1.052848,1.071634],"pants":[1.01097,0.996343,0.967687],"hair":[0.944626,0.94907,0.952741],"face":[0.985546,0.96484,0.949482]},
  "run-transition-1": {"shirt":[1.034877,1.057777,1.081078],"pants":[0.989305,0.977364,0.950582],"hair":[0.865249,0.87336,0.880695],"face":[0.957554,0.935308,0.919121]},
  "run10-0": {"shirt":[0.974193,0.986112,1.009467],"pants":[1.009944,0.985353,0.939021],"hair":[0.904272,0.912107,0.919469],"face":[1.054171,1.0176,0.950264]},
  "run10-1": {"shirt":[1.070273,1.089101,1.133253],"pants":[1.046499,1.009727,0.952223],"hair":[0.890698,0.897345,0.903134],"face":[1.048719,1.013094,0.947519]},
  "run10-2": {"shirt":[1.06122,1.078581,1.113067],"pants":[1.037848,1.00796,0.954278],"hair":[0.90591,0.914613,0.918791],"face":[1.061448,1.023507,0.959778]},
  "run10-3": {"shirt":[1.069259,1.087848,1.113587],"pants":[1.104771,1.068315,1.004873],"hair":[0.891704,0.900751,0.903396],"face":[1.031986,1.014103,0.96219]},
  "run10-4": {"shirt":[1.066423,1.089845,1.130155],"pants":[1.060576,1.026353,0.972289],"hair":[0.898724,0.902929,0.910345],"face":[1.039896,1.004243,0.940456]},
  "run10-5": {"shirt":[1.072569,1.093237,1.13676],"pants":[1.058844,1.024982,0.969637],"hair":[0.890173,0.891655,0.896358],"face":[1.012794,0.969243,0.905814]},
  "run10-6": {"shirt":[1.085982,1.105931,1.149384],"pants":[1.048508,1.017207,0.967491],"hair":[0.900807,0.900262,0.900185],"face":[1.06108,1.026359,0.963418]},
  "run10-7": {"shirt":[1.05813,1.075871,1.113557],"pants":[1.053486,1.02266,0.971847],"hair":[0.895379,0.900879,0.907607],"face":[1.050352,1.01089,0.947822]},
  "run10-8": {"shirt":[1.02669,1.050256,1.094965],"pants":[1.042344,1.012273,0.956779],"hair":[0.889017,0.891646,0.892935],"face":[1.042923,1.010348,0.950137]},
  "run10-9": {"shirt":[0.939242,0.959177,0.993349],"pants":[1.054515,1.019763,0.964008],"hair":[0.892096,0.887936,0.889356],"face":[1.053724,1.010387,0.940239]},
  "run10-10": {"shirt":[0.991496,1.005924,1.041531],"pants":[1.027911,0.999295,0.949147],"hair":[0.889573,0.896301,0.900699],"face":[1.065522,1.024361,0.958859]},
  "run10-11": {"shirt":[0.996023,1.012861,1.04932],"pants":[1.035224,1.006773,0.958701],"hair":[0.90173,0.906442,0.912476],"face":[1.071122,1.035527,0.971668]}
};
const PROTECTED = {
  "run-transition-0": {"arms":[[162,229,193,309,15],[220,246,247,286,12]],"boots":[[134,475,236,522]],"gear":[181,230,215,279]},
  "run-transition-1": {"arms":[[119,224,115,299,15],[202,249,247,249,13]],"boots":[[60,452,139,521],[153,473,251,522]],"gear":[153,246,188,293]},
  "run10-0": {"arms":[[231.0,228.0,294.6,176.4,15.6],[135.0,210.0,159.0,255.6,14.4]],"boots":[[13,421,87,502],[265,467,356,524]],"gear":[176,240,219,303]},
  "run10-1": {"arms":[[185.4,225.6,262.2,223.2,18.0],[166.2,234.0,172.2,262.8,13.2]],"boots":[[85,364,135,451],[157,479,248,523]],"gear":[178,246,221,309]},
  "run10-2": {"arms":[[183.0,228.0,245.4,279.6,16.8],[244.2,250.8,276.6,254.4,14.4]],"boots":[[110,350,165,433],[155,479,248,522]],"gear":[177,249,220,312]},
  "run10-3": {"arms":[[162,219,170,307,18],[243,251,303,220,18]],"boots":[[75,454,147,521],[151,387,198,456]],"gear":[177,242,217,304]},
  "run10-4": {"arms":[[118.2,205.2,121.8,274.8,16.8],[251.4,230.4,293.4,195.6,15.6]],"boots":[[13,424,76,486],[297,446,368,498]],"gear":[177,239,220,302]},
  "run10-5": {"arms":[[137.4,226.8,155.4,284.4,18.0],[253.8,223.2,291.0,200.4,15.6]],"boots":[[68,374,127,466],[259,469,340,520]],"gear":[174,235,217,298]},
  "run10-6": {"arms":[[161.4,231.6,199.8,279.6,16.8],[256.2,223.2,291.0,212.4,15.6]],"boots":[[73,389,131,463],[196,478,286,523]],"gear":[182,235,225,298]},
  "run10-7": {"arms":[[167.4,223.2,237.0,259.2,16.8],[258.6,246.0,276.6,252.0,13.2]],"boots":[[117,361,171,454],[157,478,250,523]],"gear":[182,248,225,311]},
  "run10-8": {"arms":[[167.4,228.0,268.2,242.4,16.8],[148.2,218.4,161.4,270.0,13.2]],"boots":[[118,364,175,452],[110,482,205,526]],"gear":[177,249,220,312]},
  "run10-9": {"arms":[[210.6,223.2,287.4,181.2,16.8],[159.0,199.2,166.2,267.6,14.4]],"boots":[[166,398,219,468],[52,461,137,526]],"gear":[181,247,224,310]},
  "run10-10": {"arms":[[225.0,228.0,295.8,186.0,15.6],[135.0,208.8,154.2,254.4,14.4]],"boots":[[26,389,87,482],[290,449,362,498]],"gear":[182,241,225,304]},
  "run10-11": {"arms":[[201.0,228.0,292.2,196.8,16.8],[156.6,228.0,162.6,264.0,13.2]],"boots":[[93,378,154,466],[199,480,293,524]],"gear":[176,247,219,310]}
};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const ramp=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function capsule(x,y,[ax,ay,bx,by,r],feather) {
 const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);
 return 1-ramp(r,r+feather,Math.hypot(x-ax-t*dx,y-ay-t*dy));
}
function rectangle(x,y,[l,t,r,b],feather) {
 return 1-ramp(0,feather,Math.hypot(Math.max(l-x,0,x-r),Math.max(t-y,0,y-b)));
}
const HAIRLINE=[[-.135,-.025],[.135,-.025],[.135,.030],[.075,.030],
 [.065,.052],[.035,.070],[.017,.082],[.012,.105],[-.006,.125],
 [-.020,.151],[-.054,.166],[-.112,.166],[-.135,.125]];
function hairline(x,y){
 let inside=false,distance=Infinity;
 for(let i=0,j=HAIRLINE.length-1;i<HAIRLINE.length;j=i++){
  const [ax,ay]=HAIRLINE[j],[bx,by]=HAIRLINE[i],dx=bx-ax,dy=by-ay;
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
  const t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy),0,1);
  distance=Math.min(distance,Math.hypot(x-ax-t*dx,y-ay-t*dy));
 }
 return inside?ramp(.0015,.006,distance):0;
}

/** Grade a normalized 420×560 run cell once, before display or mirroring.
 * The 495px physical reference is fixed across the cycle, including flight.
 * deviceHidden grades a restored hip as cloth. Alpha is never written.
 */
export function gradeRun(imageData,width,{cap,floor,root,id,deviceHidden=false}) {
 const gains=RUN_GAIN[id],regions=PROTECTED[id],data=imageData?.data;
 const imageHeight=data?.length/(width*4),H=495;
 if(!gains||!regions||!data||!Number.isInteger(width)||width<=0||!Number.isInteger(imageHeight)
  ||![cap,floor,root].every(Number.isFinite)||H<=0)return;
 const sx=width/420,sy=imageHeight/560,feather=Math.max(1.5,H*.006);
 const arms=regions.arms.map(([a,b,c,d,r])=>[a*sx,b*sy,c*sx,d*sy,r*Math.max(sx,sy)]);
 const rects=[...regions.boots,...(regions.gear&&!deviceHidden?[regions.gear]:[])]
  .map(([a,b,c,d])=>[a*sx,b*sy,c*sx,d*sy]);
 const mirror=false;
 for(let y=Math.max(0,cap);y<Math.min(imageHeight,floor);y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4;if(!data[i+3])continue;
  const v=(y-cap)/H,u=(x-root)/H*(mirror?-1:1),r=data[i],g=data[i+1],b=data[i+2];
  const luma=.2126*r+.7152*g+.0722*b,max=Math.max(r,g,b),chroma=max-Math.min(r,g,b),sat=chroma/Math.max(1,max);
  let shirt=0,pants=0,hair=0,face=0;
  if(v<.16&&Math.abs(u)<.15){
   hair=hairline(u,v)*(1-ramp(.125,.145,v));
   hair*=ramp(1,1.25,Math.hypot((u+.010)/.029,(v-.087)/.030));
   hair*=(1-ramp(18,28,r-g))*(1-ramp(30,44,r-b))*(1-ramp(40,58,chroma))*(1-ramp(150,180,luma));
   face=ramp(.043,.052,v)*(1-ramp(.130,.155,v))*(1-ramp(.125,.145,Math.abs(u)))
    *ramp(17,24,r-g)*ramp(30,40,r-b)*ramp(7,13,g-b)*ramp(48,68,luma)*(1-ramp(240,252,luma));
  }
  if(v>.145){
   shirt=ramp(.145,.19,v)*(1-ramp(.385,.425,v))
    *(1-ramp(10,28,r-b))*(1-ramp(10,22,r-g))*(1-ramp(22,38,chroma))*ramp(18,38,luma);
   pants=ramp(.425,.47,v)*(1-ramp(.94,.98,v))*ramp(4,12,r-g)*ramp(5,14,g-b)
    *ramp(10,20,chroma)*ramp(35,58,luma)*(1-ramp(.56,.68,sat));
   let protection=0;
   for(const shape of arms)protection=Math.max(protection,capsule(x,y,shape,feather));
   for(const shape of rects)protection=Math.max(protection,rectangle(x,y,shape,feather));
   shirt*=1-protection;pants*=1-protection;
  }
  if(shirt+pants+hair+face<.00001)continue;
  for(let c=0;c<3;c++){
   const factor=1+shirt*(gains.shirt[c]-1)+pants*(gains.pants[c]-1)
    +hair*(gains.hair[c]-1)+face*(gains.face[c]-1);
   data[i+c]=Math.round(data[i+c]*factor);
  }
 }
}
