import { createMotion, updateMotion, getMotionPose } from './sprite-motion.js?v=4';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const approach = (value, target, distance) => value + clamp(target - value, -distance, distance);
const wrap = phase => ((phase % 1) + 1) % 1;
const STEP = 1 / 240;
const MODE_SPEED_TIME = .24;
const RUN_STOP_TIME = .24;
const MODE_POSE_TIME = .12;
const smoother = t => t * t * t * (t * (t * 6 - 15) + 10);

/**
 * Composes running with the approved flat-ground controller. When running is
 * never requested, the original controller's output is unchanged. It remains
 * the sole owner of turning, bounds, facing, the walk cycle and its blending.
 */
export function createGroundLocomotion({
  x, min, max, height, floor, speed = 160,
  runSpeed = speed * 2, runStride = height * 1.10, facing = 1,
}) {
  if (![runSpeed, runStride].every(Number.isFinite) || runSpeed < speed || runStride <= 0) {
    throw new Error('Invalid running speed or stride.');
  }
  const ground = createMotion({ x, min, max, height, floor, speed });
  ground.facing = facing < 0 ? -1 : 1;
  return {
    ground, walkSpeed: speed, runSpeed, runStride,
    locomotion: 'walk', runPhase: 0, driveSpeed: speed,
    pendingLocomotion: 'walk', runTransition: null,
  };
}

function changeMode(state, mode, phase) {
  if (state.locomotion === mode) return;
  const from = state.locomotion;
  const moving = Math.abs(state.ground.velocity) > 0 && !state.ground.turn && !state.ground.settled;
  state.runTransition = moving
    ? { from, to: mode, elapsed: 0, progress: 0, level: from === 'run' ? 1 : 0 } : null;
  state.locomotion = mode;
  if (mode === 'run') state.runPhase = wrap(phase);
  else state.ground.walkPhase = wrap(phase);
}

function substep(state, wanted, dt, running, runAllowed) {
  const ground = state.ground;
  if (state.runTransition) {
    const transition = state.runTransition;
    transition.elapsed = Math.min(MODE_POSE_TIME, transition.elapsed + dt);
    transition.progress = transition.elapsed / MODE_POSE_TIME;
    transition.level = transition.to === 'run' ? smoother(transition.progress) : 1 - smoother(transition.progress);
    if (transition.elapsed === MODE_POSE_TIME) state.runTransition = null;
  }
  const blocked = wanted < 0 ? ground.x <= ground.min : wanted > 0 && ground.x >= ground.max;
  const continuing = wanted !== 0 && wanted === ground.facing && !ground.turn && !blocked;
  const requested = continuing && running && runAllowed ? 'run' : 'walk';
  state.pendingLocomotion = requested;

  // A hidden zero-weight pose can begin either gait from the same contact.
  if (ground.settled && continuing) changeMode(state, requested, 0);
  const phase = state.locomotion === 'run' ? state.runPhase : ground.walkPhase;
  const atContact = Math.abs(phase * 2 - Math.round(phase * 2)) < 1e-8;
  if (continuing && atContact) changeMode(state, requested, phase);

  const previousMode = state.locomotion;
  const previousPhase = previousMode === 'run' ? state.runPhase : ground.walkPhase;
  const previousX = ground.x;
  const stride = previousMode === 'run' ? state.runStride : ground.stride;
  // On a stair approach, begin slowing immediately while the running pose
  // finishes its current support. This avoids reserving half a room for a
  // worst-case contact delay followed by a separate deceleration.
  const speedTarget = previousMode === 'run' && continuing && runAllowed ? state.runSpeed : state.walkSpeed;
  const speedChange = Math.max(state.runSpeed - state.walkSpeed, state.walkSpeed) / MODE_SPEED_TIME;
  state.driveSpeed = approach(state.driveSpeed, speedTarget, speedChange * dt);

  // A run brakes over .24s instead of using the walk's short .14s stop.
  // The approved turn still waits for zero velocity and zero walk weight.
  const runningStop = previousMode === 'run' && !continuing;
  ground.maxSpeed = runningStop ? state.runSpeed * .14 / RUN_STOP_TIME : state.driveSpeed;
  updateMotion(ground, wanted, dt);
  const travel = Math.abs(ground.x - previousX);
  if (previousMode === 'run') state.runPhase = wrap(previousPhase + travel / state.runStride);

  if (ground.turn || ground.settled) {
    // Idle and the complete approved turn have one treatment in both modes.
    changeMode(state, 'walk', ground.walkPhase);
    state.runPhase = 0;
    state.driveSpeed = state.walkSpeed;
    state.runTransition = null;
    ground.maxSpeed = state.walkSpeed;
    return;
  }

  // A held modifier changes the drawing only when a real cycle contact is
  // crossed. Preserve the small remainder travelled after that contact; never
  // teleport the root, reset velocity, or dissolve between two silhouettes.
  if (continuing && requested !== previousMode && travel > 0) {
    const unwrapped = previousPhase + travel / stride;
    const contact = Math.floor((unwrapped + 1e-10) * 2) / 2;
    if (contact > previousPhase + 1e-9) {
      const remainder = Math.max(0, unwrapped - contact) * stride;
      const nextStride = requested === 'run' ? state.runStride : ground.stride;
      changeMode(state, requested, contact + remainder / nextStride);
    }
  }
}

export function updateGroundLocomotion(state, input, dt, { running = false, runAllowed = true } = {}) {
  const wanted = Math.sign(Number.isFinite(input) ? input : 0);
  let remaining = clamp(Number.isFinite(dt) ? dt : 0, 0, .1);
  while (remaining > 1e-9) {
    const step = Math.min(STEP, remaining);
    substep(state, wanted, step, !!running, !!runAllowed);
    remaining -= step;
  }
  return state;
}

export function getGroundLocomotionPose(state) {
  const pose = getMotionPose(state.ground);
  // The longer run deceleration may outlast the walk's blend. Keep the moving
  // run pose visible until its momentum has gone; this is not opacity.
  const runWeight = state.locomotion === 'run'
    ? Math.max(pose.walkWeight, clamp(pose.speed / state.walkSpeed, 0, 1)) : 0;
  const runTransition = state.runTransition ? {
    from: state.runTransition.from, to: state.runTransition.to,
    progress: state.runTransition.progress, level: state.runTransition.level,
  } : null;
  return { ...pose, locomotion: state.locomotion, runPhase: state.runPhase, runWeight,
    runLevel: runTransition?.level ?? runWeight, runTransition };
}

/** Short approach zone used only at a stair join, not the outer room edges. */
export function getRunApproachDistance(state) {
  return state.ground.height * .60;
}
