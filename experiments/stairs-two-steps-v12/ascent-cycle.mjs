// Experimental measured-art geometry. No production module imports this file.
// The first raised contact through the landing contact is supported. Entry,
// gathering and reversal are deliberately separate authored transitions.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const harmonic=(a,b)=>a*b>0?2*a*b/(a+b):0;
const mod=(v,n)=>(v%n+n)%n;
const point=(origin,p,scale)=>({x:origin.x+p.x*scale,y:origin.y+p.y*scale});

export function createAscentGeometry({nodes,frames,height=266,referenceHeight=500}) {
  if(!Array.isArray(nodes)||nodes.length<3||!Array.isArray(frames)||frames.length!==16
    ||!Number.isFinite(height)||height<=0||!Number.isFinite(referenceHeight)||referenceHeight<=0) {
    throw new Error('The ascent proof needs 16 measured whole-frame poses and at least three supports.');
  }
  for(const [i,f] of frames.entries()) {
    if(![f.crown?.x,f.crown?.y,f.feet?.R?.x,f.feet?.R?.y,f.feet?.L?.x,f.feet?.L?.y].every(Number.isFinite)) {
      throw new Error(`Missing measured crown/sole coordinates for ascent frame ${i}.`);
    }
  }
  const scale=height/referenceHeight, first=1,last=nodes.length-1;
  const nearFor=index=>(index-first)%2===0?'R':'L';
  function contactKey(index) {
    const support=nearFor(index),frame=frames[support==='R'?0:8],rear=support==='R'?'L':'R';
    const origin={x:0,y:0};
    for(const axis of ['x','y']) origin[axis]=((nodes[index][axis]-frame.feet[support][axis]*scale)+(nodes[index-1][axis]-frame.feet[rear][axis]*scale))/2;
    return {at:index,head:point(origin,frame.crown,scale),kind:'contact',support,index};
  }
  function passingKey(index) {
    const support=nearFor(index),frame=frames[support==='R'?4:12],sole=frame.feet[support];
    const origin={x:nodes[index].x-sole.x*scale,y:nodes[index].y-sole.y*scale};
    return {at:index+.5,head:point(origin,frame.crown,scale),kind:'passing',support,index};
  }
  const keys=[];
  for(let i=first;i<=last;i++) {keys.push(contactKey(i));if(i<last)keys.push(passingKey(i));}
  const tangents=keys.map((_,i)=>({x:0,y:0}));
  for(const axis of ['x','y']) {
    const slopes=keys.slice(1).map((k,i)=>(k.head[axis]-keys[i].head[axis])/.5);
    for(let i=0;i<keys.length;i++) tangents[i][axis]=i===0?slopes[0]:i===keys.length-1?slopes.at(-1):harmonic(slopes[i-1],slopes[i]);
  }
  function sample(progress) {
    const p=clamp(progress,first,last),i=Math.min(keys.length-2,Math.floor((p-first)*2)),u=(p-keys[i].at)*2;
    const head={},derivative={};
    for(const axis of ['x','y']) {
      const a=keys[i].head[axis],b=keys[i+1].head[axis],m0=tangents[i][axis]*.5,m1=tangents[i+1][axis]*.5;
      head[axis]=(2*u**3-3*u*u+1)*a+(u**3-2*u*u+u)*m0+(-2*u**3+3*u*u)*b+(u**3-u*u)*m1;
      derivative[axis]=2*((6*u*u-6*u)*a+(3*u*u-4*u+1)*m0+(-6*u*u+6*u)*b+(3*u*u-2*u)*m1);
    }
    return {head,derivative,progress:p};
  }
  function candidate(sampleIndex,progress) {
    const frameIndex=mod(sampleIndex,16),frame=frames[frameIndex],at=first+sampleIndex/8;
    const supportIndex=Math.min(last,first+Math.floor(sampleIndex/8)),support=nearFor(supportIndex);
    const {head,derivative}=sample(progress),origin={x:head.x-frame.crown.x*scale,y:head.y-frame.crown.y*scale};
    const contactBoth=sampleIndex%8===0;
    const feet={};
    for(const side of ['R','L']) {
      const actual=point(origin,frame.feet[side],scale),nodeIndex=side===support?supportIndex:contactBoth?supportIndex-1:null;
      const target=nodeIndex===null?null:nodes[nodeIndex];
      feet[side]={...actual,nodeIndex,target,error:target?{x:actual.x-target.x,y:actual.y-target.y}:null};
    }
    const errors=Object.values(feet).filter(f=>f.error).map(f=>f.error);
    return {frameIndex,frame,at,progress,origin,head,derivative,scale,feet,support,supportIndex,
      score:Math.max(...errors.map(e=>Math.max(Math.abs(e.x),Math.abs(e.y))))};
  }
  function placement(progress,{selection='contact'}={}) {
    const p=clamp(progress,first,last),continuous=(p-first)*8;
    if(selection==='nearest') return candidate(Math.round(continuous),p);
    const lo=candidate(Math.floor(continuous+1e-10),p),hi=candidate(Math.ceil(continuous-1e-10),p);
    // Adjacent authored phases only. The crown stays on the same continuous
    // curve across the change, while the measured stance error determines when
    // that change is least visible. No morph, foot warp or body freeze occurs.
    if(Math.abs(lo.score-hi.score)<1e-8) return Math.abs(lo.at-p)<=Math.abs(hi.at-p)?lo:hi;
    return lo.score<hi.score?lo:hi;
  }
  return {first,last,height,referenceHeight,scale,frames,nodes,keys,sample,placement};
}

export function ascentProgressFromPose(pose) {
  if(Number.isFinite(pose.ascentProgress)) return pose.ascentProgress;
  if(pose.facing!==1||pose.turn) return null;
  if(pose.mode==='stepping') return pose.stepFrom+clamp(pose.stepPhase??0,0,1);
  if(pose.mode==='contact-hold') return pose.stepFrom;
  return null;
}

export function auditAscentGeometry(geometry,{fps=120,stepDuration=.4}={}) {
  const duration=(geometry.last-geometry.first)*stepDuration, count=Math.ceil(duration*fps);
  const frames=Array.from({length:count+1},(_,i)=>geometry.placement(geometry.first+Math.min(duration,i/fps)/stepDuration));
  let previous=null,held=0,maxX=0,maxY=0,maxBodyJump=0,backwardSelections=0,lastSample=-Infinity;
  const switches=[];
  for(const f of frames) {
    for(const foot of Object.values(f.feet)) if(foot.error) {maxX=Math.max(maxX,Math.abs(foot.error.x));maxY=Math.max(maxY,Math.abs(foot.error.y));}
    const absoluteSample=(f.at-geometry.first)*8;
    if(absoluteSample<lastSample)backwardSelections++;
    lastSample=absoluteSample;
    if(previous) {
      if(Math.hypot(f.head.x-previous.head.x,f.head.y-previous.head.y)<1e-8)held++;
      if(previous.frameIndex!==f.frameIndex) {
        const at=geometry.sample(f.progress).head;
        // Compare the two complete drawings at exactly the same body location.
        const oldHead={x:at.x-previous.frame.crown.x*f.scale+previous.frame.crown.x*f.scale,y:at.y-previous.frame.crown.y*f.scale+previous.frame.crown.y*f.scale};
        maxBodyJump=Math.max(maxBodyJump,Math.hypot(oldHead.x-at.x,oldHead.y-at.y));
        switches.push({progress:f.progress,from:previous.frameIndex,to:f.frameIndex,score:f.score});
      }
    }
    previous=f;
  }
  return {status:'Geometry and measured sole audit; visual silhouette and texture continuity must be reviewed separately.',fps,stepDuration,frameCount:frames.length,heldBodyFrames:held,maxContactErrorX:maxX,maxContactErrorY:maxY,maxRegistrationJumpAtCellChange:maxBodyJump,backwardSelections,switches};
}
