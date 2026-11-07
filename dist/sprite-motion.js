// Movement for the complete painted poses. The cycle follows distance rather
// than a separate foot solver; this keeps the photographed/drawn proportions
// intact and avoids a stop-start rhythm at every contact.
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const approach = (value, target, amount) => value + clamp(target - value, -amount, amount);
const smoother = t => t * t * t * (t * (t * 6 - 15) + 10);
const ACCEL_TIME = .12;
const DECEL_TIME = .14;
const WALK_BLEND_TIME = .18;
const TURN_RATE = 1 / .30;
const TURN_ACCEL = TURN_RATE / .045;

export function createMotion({ x, min, max, height, floor, speed = 160, stride = height * .80 }) {
  if (![x, min, max, height, floor, speed, stride].every(Number.isFinite)
    || height <= 0 || min > max || speed <= 0 || stride <= 0) {
    throw new Error('Invalid painted motion dimensions.');
  }
  return {
    x: clamp(x, min, max), min, max, height, floor, maxSpeed: speed, stride,
    facing: 1, velocity: 0, walkPhase: 0, walkWeight: 0,
    blend: { from: 0, to: 0, elapsed: WALK_BLEND_TIME },
    turn: null, settled: true, mode: 'idle'
  };
}

function blendTowards(state, target, dt) {
  if (target !== state.blend.to) {
    state.blend = { from: state.walkWeight, to: target, elapsed: 0 };
  }
  state.blend.elapsed = Math.min(WALK_BLEND_TIME, state.blend.elapsed + dt);
  const t = smoother(state.blend.elapsed / WALK_BLEND_TIME);
  state.walkWeight = state.blend.from + (state.blend.to - state.blend.from) * t;
  if (state.blend.elapsed === WALK_BLEND_TIME) state.walkWeight = target;
}

function updateTurn(state, wanted, dt) {
  const turn = state.turn;
  // A new command can retrace the same visible rotation. Its velocity brakes
  // before changing sign, instead of snapping to a second turn animation.
  if (wanted) turn.goal = wanted === turn.source ? 0 : 1;
  const distance = turn.goal - turn.progress;
  const desired = Math.sign(distance) * Math.min(TURN_RATE, Math.sqrt(2 * TURN_ACCEL * Math.abs(distance)));
  const previousVelocity = turn.velocity;
  turn.velocity = approach(turn.velocity, desired, TURN_ACCEL * dt);
  const next = turn.progress + (previousVelocity + turn.velocity) * .5 * dt;
  if ((turn.goal === 1 && next >= 1) || (turn.goal === 0 && next <= 0)) {
    state.facing = turn.goal === 1 ? turn.target : turn.source;
    state.turn = null;
    // Phase is invisible at zero walk weight, so the next first step can
    // begin from the same well-defined painted contact in either direction.
    state.walkPhase = 0;
  } else {
    turn.progress = clamp(next, 0, 1);
  }
}

function substep(state, input, dt) {
  const wanted = Math.sign(input);
  if (state.turn) {
    updateTurn(state, wanted, dt);
    state.mode = state.turn ? 'turning' : 'idle';
    state.settled = !state.turn;
    return;
  }

  const reversing = wanted !== 0 && wanted !== state.facing;
  const blocked = (wanted < 0 && state.x <= state.min) || (wanted > 0 && state.x >= state.max);
  const walking = wanted !== 0 && !reversing && !blocked;
  const targetVelocity = walking ? wanted * state.maxSpeed : 0;
  const previousVelocity = state.velocity;
  const acceleration = state.maxSpeed / (walking ? ACCEL_TIME : DECEL_TIME);
  state.velocity = approach(state.velocity, targetVelocity, acceleration * dt);
  const previousX = state.x;
  state.x = clamp(state.x + (previousVelocity + state.velocity) * .5 * dt, state.min, state.max);
  if ((state.x === state.min && state.velocity < 0) || (state.x === state.max && state.velocity > 0)) {
    state.velocity = 0;
  }
  const travel = Math.abs(state.x - previousX);
  state.walkPhase = (state.walkPhase + travel / state.stride) % 1;
  blendTowards(state, walking ? 1 : 0, dt);

  if (reversing && state.velocity === 0 && state.walkWeight === 0) {
    state.turn = { source: state.facing, target: wanted, progress: 0, velocity: 0, goal: 1 };
  }
  state.settled = state.velocity === 0 && state.walkWeight === 0 && !state.turn;
  state.mode = state.turn ? 'turning' : reversing ? 'preparing-turn'
    : walking ? 'walking' : state.settled ? 'idle' : 'stopping';
}

export function updateMotion(state, input, dt) {
  let remaining = clamp(Number.isFinite(dt) ? dt : 0, 0, .1);
  input = clamp(Number.isFinite(input) ? input : 0, -1, 1);
  // Identical simulation steps for 30/60/120 Hz screens, independent of RAF.
  while (remaining > 1e-9) {
    const step = Math.min(remaining, 1 / 240);
    substep(state, input, step);
    remaining -= step;
  }
  return state;
}

export function getMotionPose(state) {
  return {
    x: state.x, floor: state.floor, height: state.height,
    facing: state.facing, speed: Math.abs(state.velocity), velocity: state.velocity,
    walkPhase: state.walkPhase, walkWeight: state.walkWeight,
    turn: state.turn ? { progress: state.turn.progress,
      sourceFacing: state.turn.source, targetFacing: state.turn.target } : null,
    settled: state.settled, walking: !state.settled, mode: state.mode
  };
}
