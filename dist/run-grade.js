// Static display grading for the authored V9 running paintings.
// RGB only: never writes alpha, deforms a pose, smooths detail or moves a foot.
export const RUN_REFERENCE = {"shirt":[100.6886168416642,96.42329377403135,99.88758102878833],"pants":[140.9524644275798,115.02304954019253,87.37271444505309],"hair":[76.802418227565,66.05740137734861,60.73185680065873],"face":[175.6276125932201,127.75116655325178,90.26598802894162]};
export const RUN_GAIN = {
  "run-0": {"shirt":[0.986569,0.990524,0.999334],"pants":[0.979285,0.965691,0.939139],"hair":[0.832541,0.834152,0.845582],"face":[0.94363,0.933223,0.921792]},
  "run-1": {"shirt":[0.998407,1.002306,1.013509],"pants":[0.903287,0.902034,0.896329],"hair":[0.830761,0.834647,0.847484],"face":[0.957275,0.936077,0.907423]},
  "run-2": {"shirt":[0.965576,0.974791,0.983377],"pants":[0.933575,0.924121,0.909716],"hair":[0.828044,0.830747,0.841007],"face":[0.932642,0.912369,0.89507]},
  "run-3": {"shirt":[0.957315,0.972318,0.987615],"pants":[0.937591,0.9273,0.909125],"hair":[0.835775,0.831551,0.839076],"face":[0.964624,0.9381,0.906934]},
  "run-4": {"shirt":[0.943192,0.959016,0.972977],"pants":[0.900438,0.893343,0.87975],"hair":[0.823616,0.825294,0.832639],"face":[0.952062,0.918374,0.894833]},
  "run-5": {"shirt":[0.946185,0.958922,0.970861],"pants":[0.895002,0.889824,0.876333],"hair":[0.820652,0.821604,0.833505],"face":[0.943677,0.920192,0.901365]},
  "run-6": {"shirt":[0.928359,0.940031,0.954089],"pants":[0.950018,0.938408,0.915766],"hair":[0.813502,0.810508,0.81529],"face":[0.945658,0.926019,0.919405]},
  "run-7": {"shirt":[0.944009,0.95977,0.974215],"pants":[0.967436,0.951775,0.928582],"hair":[0.809568,0.810383,0.817572],"face":[0.924847,0.901096,0.874917]},
  "run-8": {"shirt":[0.953847,0.967107,0.982954],"pants":[0.900968,0.895026,0.885179],"hair":[0.820465,0.82068,0.828022],"face":[0.938842,0.921568,0.904111]},
  "run-9": {"shirt":[0.915393,0.932021,0.950344],"pants":[0.910901,0.903454,0.88994],"hair":[0.815826,0.816151,0.824112],"face":[0.9199,0.889413,0.861125]},
  "run-10": {"shirt":[0.930287,0.943173,0.96221],"pants":[0.900024,0.892472,0.880488],"hair":[0.815259,0.809367,0.814181],"face":[0.936446,0.907673,0.892429]},
  "run-11": {"shirt":[0.947874,0.961048,0.977583],"pants":[0.899306,0.891524,0.876103],"hair":[0.810337,0.808721,0.818986],"face":[0.926901,0.895226,0.869932]},
  "run-transition-0": {"shirt":[1.031211,1.052848,1.071634],"pants":[1.01097,0.996343,0.967687],"hair":[0.944626,0.94907,0.952741],"face":[0.985546,0.96484,0.949482]},
  "run-transition-1": {"shirt":[1.034877,1.057777,1.081078],"pants":[0.989305,0.977364,0.950582],"hair":[0.865249,0.87336,0.880695],"face":[0.957554,0.935308,0.919121]}
};
const PROTECTED = {
  "run-0": {"arms":[[116.2,204.6,117.4,298.2,19.2],[211.0,250.2,272.2,223.8,19.2]],"boots":[[177,469,265,521],[41,345,83,430]],"gear":[151,241,200,309]},
  "run-1": {"arms":[[132.8,231.0,190.4,293.4,21.6],[215.6,249.0,266.0,228.6,19.2]],"boots":[[96,332,153,414],[122,466,210,522]],"gear":[149,234,198,302]},
  "run-2": {"arms":[[194.4,239.4,272.4,239.4,19.2],[135.6,225.0,150.0,279.0,16.8]],"boots":[[80,468,169,524]],"gear":[150,240,199,308]},
  "run-3": {"arms":[[212.6,243.0,269.0,232.2,19.2],[127.4,209.4,121.4,291.0,18.0]],"boots":[[149,369,213,455],[37,445,107,526]],"gear":[150,240,199,308]},
  "run-4": {"arms":[[208.6,233.4,269.8,217.8,20.4],[123.4,204.6,106.6,285.0,19.2]],"boots":[[280,409,370,475],[14,364,77,449]],"gear":[152,240,201,308]},
  "run-5": {"arms":[[199.2,247.8,271.2,238.2,20.4],[121.2,226.2,116.4,292.2,19.2]],"boots":[[248,468,338,514],[61,352,121,437]],"gear":[153,240,202,308]},
  "run-6": {"arms":[[202.4,245.4,268.4,229.8,20.4],[119.6,217.8,124.4,301.8,19.2]],"boots":[[57,352,124,439],[197,468,290,524]],"gear":[151,242,200,310]},
  "run-7": {"arms":[[190.6,255.0,267.4,253.8,19.2],[130.6,233.4,143.8,280.2,18.0]],"boots":[[110,466,198,525],[98,373,161,458]],"gear":[148,242,197,310]},
  "run-8": {"arms":[[155.2,262.2,246.4,257.4,19.2],[120.4,239.4,132.4,280.2,16.8]],"boots":[[117,375,179,462],[124,465,214,523]],"gear":[144,242,193,310]},
  "run-9": {"arms":[[200.6,250.2,269.0,234.6,19.2],[127.4,214.2,117.8,297.0,19.2]],"boots":[[140,364,206,448],[36,448,107,524]],"gear":[149,242,198,310]},
  "run-10": {"arms":[[204.4,244.2,271.6,227.4,19.2],[115.6,217.8,108.4,294.6,19.2]],"boots":[[264,422,356,489],[17,359,75,443]],"gear":[150,237,199,305]},
  "run-11": {"arms":[[203.0,250.2,270.2,243.0,19.2],[122.6,219.0,117.8,293.4,19.2]],"boots":[[36,366,102,450],[231,453,324,516]],"gear":[154,242,203,310]},
  "run-transition-0": {"arms":[[162,229,193,309,15],[220,246,247,286,12]],"boots":[[134,475,236,522]],"gear":[181,230,215,279]},
  "run-transition-1": {"arms":[[119,224,115,299,15],[202,249,247,249,13]],"boots":[[60,452,139,521],[153,473,251,522]],"gear":[153,246,188,293]}
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
