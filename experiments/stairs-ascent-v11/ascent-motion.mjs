// Isolated ascent preview; never silently substitutes a flat idle/turn on stairs.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const approach=(v,to,amount)=>v+clamp(to-v,-amount,amount);

export function createAscentMotion({nodes,height=266,index=1,stepDuration=.4}) {
  if(!Array.isArray(nodes)||nodes.length<3||!Number.isInteger(index)||index<1||index>=nodes.length
    ||!Number.isFinite(height)||height<=0||!Number.isFinite(stepDuration)||stepDuration<=0)throw new Error('Invalid raised-contact ascent entry.');
  return {nodes,height,progress:index,rate:0,maxRate:1/stepDuration,mode:'contact-hold',requestedDirection:0,requiresTransition:null};
}
export function updateAscentMotion(state,input,dt) {
  let remaining=clamp(Number.isFinite(dt)?dt:0,0,.1);
  const wanted=Math.sign(Number.isFinite(input)?input:0),last=state.nodes.length-1;
  state.requestedDirection=wanted;
  while(remaining>1e-10) {
    const step=Math.min(remaining,1/240);remaining-=step;
    const atContact=Math.abs(state.progress-Math.round(state.progress))<1e-8;
    if(atContact&&state.rate===0&&(wanted!==1||state.progress===last)) {
      state.mode='contact-hold';
      state.requiresTransition=wanted<0?'stair-reversal':wanted>0&&state.progress===last?'landing-gather':null;
      continue;
    }
    state.requiresTransition=null;state.mode='stepping';
    const target=wanted===1?last:Math.min(last,Math.ceil(state.progress-1e-8));
    const acceleration=state.maxRate/.12,distance=Math.max(0,target-state.progress);
    const desired=Math.min(state.maxRate,Math.sqrt(2*acceleration*distance));
    const before=state.rate;state.rate=approach(state.rate,desired,acceleration*step);
    state.progress=Math.min(target,state.progress+(before+state.rate)*.5*step);
    if(state.progress>=target-1e-9) {state.progress=target;state.rate=0;state.mode='contact-hold';}
  }
  return state;
}
export function getAscentPose(state) {
  const atContact=state.mode==='contact-hold',index=Math.floor(state.progress),phase=state.progress-index;
  const next=Math.min(state.nodes.length-1,index+1),a=state.nodes[index],b=state.nodes[next];
  const speed=(b.x-a.x)*state.rate;
  return {ascentProgress:state.progress,mode:state.mode,facing:1,height:state.height,
    x:a.x+(b.x-a.x)*phase,floor:a.y+(b.y-a.y)*phase,velocity:speed,speed,
    stepFrom:index,stepTo:atContact?index:next,stepPhase:phase,
    cyclePhase:((state.progress-1)/2)%1,walkPhase:((state.progress-1)/2)%1,
    walking:!atContact,walkWeight:atContact?0:1,settled:atContact,turn:null,
    requiresTransition:state.requiresTransition,requestedDirection:state.requestedDirection,
    exitDirection:0};
}
