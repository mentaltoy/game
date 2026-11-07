// Stair traversal is separate from the approved flat-ground controller.
// A released command completes the current safe support, never an airborne
// freeze or a snap onto the nearest stair. Each support is an actual tread.
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const approach = (value, target, amount) => value + clamp(target-value, -amount, amount);
const smoother = t => t*t*t*(t*(t*6-15)+10);
const mix = (a,b,t) => a+(b-a)*t;
const GATHER_TIME = .14;
const TURN_RATE = 1/.34, TURN_ACCEL = TURN_RATE/.05;

export function createStairMotion({ nodes, height, facing = 1, index, stepDuration = .34,
  supportLockedAscent = false, ascentStepDuration = .45, ascentGatherDuration = .32 }) {
  if (!Array.isArray(nodes) || nodes.length < 2 || !Number.isFinite(height) || height <= 0
    || !Number.isFinite(stepDuration) || stepDuration <= 0
    || !Number.isFinite(ascentStepDuration) || ascentStepDuration <= 0
    || !Number.isFinite(ascentGatherDuration) || ascentGatherDuration <= 0
    || !nodes.every((node,i) => Number.isFinite(node?.x) && Number.isFinite(node?.y)
      && (!i || node.x > nodes[i-1].x && node.y <= nodes[i-1].y))) {
    throw new Error('Stair supports must run from lower left to upper right.');
  }
  facing = facing < 0 ? -1 : 1;
  index ??= facing === 1 ? 0 : nodes.length-1;
  if (!Number.isInteger(index) || index < 0 || index >= nodes.length) throw new Error('Invalid stair entry support.');
  const points = nodes.map(node => ({ ...node })), point = points[index];
  return {
    nodes: points, height, facing, index, x: point.x, floor: point.y,
    supportLockedAscent: !!supportLockedAscent, ascentGatherDuration,
    baseRate: 1/stepDuration, ascentRate: 1/ascentStepDuration,
    maxRate: supportLockedAscent && facing===1 ? 1/ascentStepDuration : 1/stepDuration,
    rate: 0, stepCount: 0, supportFoot: 1,
    feet: [0,1].map(() => ({ x: point.x, y: point.y, nodeIndex:index, planted:true })),
    step: null, lastStep: null, gather: null, turn: null, mode:'idle', exitDirection:0
  };
}

function swingFoot(from, to, progress, lift) {
  const t=smoother(clamp(progress,0,1));
  return { x:mix(from.x,to.x,t), y:mix(from.y,to.y,t)-Math.sin(Math.PI*t)*lift,
    nodeIndex:progress >= 1 ? to.nodeIndex : null, planted:progress >= 1 };
}
function nextIsOutside(state, facing=state.facing) {
  const next=state.index+facing;
  return next < 0 || next >= state.nodes.length;
}
function startStep(state) {
  if(nextIsOutside(state)) return false;
  const next=state.index+state.facing, movingFoot=1-state.supportFoot;
  state.maxRate=state.supportLockedAscent && state.facing===1 ? state.ascentRate : state.baseRate;
  state.step={ fromIndex:state.index, toIndex:next, progress:0, movingFoot,
    footFrom:{...state.feet[movingFoot]},
    fromCollected:state.feet.every(foot=>foot.planted && foot.nodeIndex===state.index) };
  state.mode='stepping';
  return true;
}
function placeStep(state) {
  const step=state.step, from=state.nodes[step.fromIndex], to=state.nodes[step.toIndex];
  state.x=mix(from.x,to.x,step.progress);
  state.floor=mix(from.y,to.y,step.progress);
  // The leading foot is planted before weight transfers completely. The
  // other shoe remains at its previous real support throughout the swing.
  state.feet[step.movingFoot]=swingFoot(step.footFrom,{...to,nodeIndex:step.toIndex},step.progress/.72,state.height*.095);
}
function startGather(state) {
  state.rate=0;
  const movingFoot=1-state.supportFoot, foot=state.feet[movingFoot], to=state.nodes[state.index];
  if(Math.abs(foot.x-to.x)<1e-8 && Math.abs(foot.y-to.y)<1e-8) {
    state.gather=null; state.mode='idle'; return;
  }
  // Capture the timing now: an input reversal during collection must not
  // retime the authored transition or change the moving foot's trajectory.
  const duration=state.supportLockedAscent && state.facing===1 ? state.ascentGatherDuration : GATHER_TIME;
  state.gather={ elapsed:0, duration, movingFoot, from:{...foot} };
  state.mode='gathering';
}
function finishStep(state, wanted) {
  const step=state.step;
  state.lastStep={ stepFrom:step.fromIndex,stepTo:step.toIndex };
  state.index=step.toIndex; state.supportFoot=step.movingFoot;
  state.x=state.nodes[state.index].x; state.floor=state.nodes[state.index].y;
  state.feet[step.movingFoot]={ x:state.x,y:state.floor,nodeIndex:state.index,planted:true };
  state.step=null; state.stepCount++;
  if(wanted===state.facing && !nextIsOutside(state)) startStep(state);
  else if(state.supportLockedAscent && state.facing===1 && !wanted && !nextIsOutside(state)) {
    // Keep the just-landed split stance on an interior tread. A released
    // command must not replace the painted contact with a flat-ground idle.
    state.rate=0; state.mode='contact-hold';
  }
  else startGather(state);
}
function updateStep(state,wanted,dt) {
  const step=state.step;
  const stopping=wanted!==state.facing || step.toIndex+state.facing<0 || step.toIndex+state.facing>=state.nodes.length;
  const acceleration=state.maxRate/(stopping ? .11 : .09);
  const desired=stopping?Math.min(state.maxRate,Math.sqrt(2*acceleration*(1-step.progress))):state.maxRate;
  const previous=state.rate;
  state.rate=approach(state.rate,desired,acceleration*dt);
  const travel=(previous+state.rate)*.5*dt;
  step.progress=Math.min(1,step.progress+travel);
  placeStep(state);
  if(step.progress>=1-1e-9) finishStep(state,wanted);
}
function updateGather(state,dt) {
  const gather=state.gather;
  gather.elapsed=Math.min(gather.duration,gather.elapsed+dt);
  const to={...state.nodes[state.index],nodeIndex:state.index};
  state.feet[gather.movingFoot]=swingFoot(gather.from,to,gather.elapsed/gather.duration,state.height*.065);
  if(gather.elapsed>=gather.duration) { state.gather=null; state.mode='idle'; }
}
function updateTurn(state,wanted,dt) {
  const turn=state.turn;
  if(wanted) turn.goal=wanted===turn.sourceFacing?0:1;
  const distance=turn.goal-turn.progress;
  const desired=Math.sign(distance)*Math.min(TURN_RATE,Math.sqrt(2*TURN_ACCEL*Math.abs(distance)));
  const previous=turn.velocity;
  turn.velocity=approach(turn.velocity,desired,TURN_ACCEL*dt);
  const next=turn.progress+(previous+turn.velocity)*.5*dt;
  if(turn.goal===1?next>=1:next<=0) {
    state.facing=turn.goal===1?turn.targetFacing:turn.sourceFacing;
    state.turn=null; state.mode='idle';
  } else turn.progress=clamp(next,0,1);
}
function substep(state,wanted,dt) {
  state.exitDirection=0;
  if(state.turn) { updateTurn(state,wanted,dt); return; }
  if(state.gather) { updateGather(state,dt); return; }
  if(state.step) { updateStep(state,wanted,dt); return; }
  if(!wanted) return;
  if(state.mode==='contact-hold' && wanted!==state.facing) {
    // The released trailing foot is gathered before the existing turn. A
    // direct resume in the same direction instead keeps both real supports.
    startGather(state); return;
  }
  if(wanted!==state.facing) {
    state.turn={sourceFacing:state.facing,targetFacing:wanted,progress:0,velocity:0,goal:1};
    state.mode='turning'; return;
  }
  if(nextIsOutside(state,wanted)) { state.exitDirection=wanted; return; }
  startStep(state);
  updateStep(state,wanted,dt);
}

export function updateStairMotion(state,input,dt) {
  let remaining=clamp(Number.isFinite(dt)?dt:0,0,.1);
  const wanted=Math.sign(Number.isFinite(input)?input:0);
  while(remaining>1e-9) {
    const step=Math.min(remaining,1/240);
    substep(state,wanted,step); remaining-=step;
  }
  return state;
}

export function getStairPose(state) {
  const phase=state.step?.progress??0, cyclePhase=((state.stepCount%2)+phase)/2;
  const speed=state.step?state.rate*Math.abs(state.nodes[state.step.toIndex].x-state.nodes[state.step.fromIndex].x):0;
  const settled=!state.step&&!state.gather&&!state.turn;
  const ascending=state.supportLockedAscent && state.facing===1;
  const ascentProgress=ascending && state.step ? state.step.fromIndex+phase
    : ascending && state.lastStep?.stepTo>state.lastStep?.stepFrom ? state.index : null;
  return {
    x:state.x,floor:state.floor,height:state.height,facing:state.facing,
    speed,velocity:speed*state.facing,stepPhase:phase,cyclePhase,walkPhase:cyclePhase,
    walkWeight:state.step || state.mode==='contact-hold'?1:state.gather?1-smoother(state.gather.elapsed/state.gather.duration):0,
    turn:state.turn?{ progress:state.turn.progress,sourceFacing:state.turn.sourceFacing,targetFacing:state.turn.targetFacing }:null,
    feet:state.feet.map(foot=>({...foot})),supportFoot:state.supportFoot,
    stepFrom:state.step?.fromIndex??state.index,stepTo:state.step?.toIndex??state.index,
    index:state.index,supportLockedAscent:state.supportLockedAscent,ascentProgress,
    stepFromCollected:state.step?.fromCollected??false,
    gatherProgress:state.gather?state.gather.elapsed/state.gather.duration:null,
    lastStep:state.lastStep?{...state.lastStep}:null,
    settled,walking:!!state.step,mode:state.mode,exitDirection:state.exitDirection
  };
}
