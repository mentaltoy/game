const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const mix = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const approach = (a, b, amount) => a + clamp(b - a, -amount, amount);
const FOOT = { heel: [-.04, .055], toe: [.105, .055] };
const THIGH = .235, SHIN = .235;
const SWING_DURATION = .34, HEEL_STRIKE = -.10;
const TURN_DURATION = .38;
const rotate = (p, angle) => [p[0] * Math.cos(angle) - p[1] * Math.sin(angle), p[0] * Math.sin(angle) + p[1] * Math.cos(angle)];

export function createGait({ x, min, max, height, floor }) {
  if (!(height > 0) || min > max) throw new Error('Invalid gait dimensions.');
  x = clamp(x, min, max);
  const foot = (name, offset) => ({ name, baseX: x + offset * height, facing: 1, age: 1, roll: 0, swing: null });
  return { x, min, max, height, floor, facing: 1, velocity: 0, speed: 140,
    feet: [foot('near', .022), foot('far', -.022)], mode: 'idle',
    doubleSupport: 0, stepCount: 0, bodyWeight: 0, stepProgress: 0,
    walkPhase: 0, turn: null, walking: false, settled: true, time: 0 };
}

function footGeometry(state, foot) {
  const h = state.height;
  let direction = foot.facing;
  let angle, ankleX, ankleY, contact = null, anchorX = null;
  if (foot.swing) {
    const swing = foot.swing;
    const p = clamp(swing.elapsed / swing.duration, 0, 1);
    const t = ease(p);
    // The boot relaxes after toe-off, passes almost level, then presents the
    // heel just before contact. Moving the whole boot on a sine arc previously
    // exaggerated the toe height and made recovery resemble a marching step.
    angle = swing.turn ? mix(swing.fromAngle, 0, t)
      : p < .35 ? mix(swing.fromAngle, 0, ease(p / .35))
      : p > .7 ? HEEL_STRIKE * ease((p - .7) / .3) : 0;
    if (swing.turn) direction = mix(swing.fromFacing, swing.toFacing, t);
    const landingHeel = rotate(FOOT.heel, HEEL_STRIKE);
    const targetAnkleX = swing.turn ? swing.targetX : swing.targetX + direction * (-.04 - landingHeel[0]) * h;
    ankleX = mix(swing.fromX, targetAnkleX, t);
    const heel = rotate(FOOT.heel, angle), toe = rotate(FOOT.toe, angle);
    // Define clearance at the sole, not at the ankle. Both position and
    // vertical velocity meet the support phase continuously at each end.
    ankleY = state.floor - (Math.max(heel[1], toe[1]) + Math.sin(Math.PI * p) ** 2 * swing.lift) * h;
  } else {
    angle = foot.roll;
    if (angle < -1e-6) {
      contact = 'heel';
      const heel = rotate(FOOT.heel, angle);
      anchorX = foot.baseX - direction * .04 * h;
      ankleX = anchorX - direction * heel[0] * h;
      ankleY = state.floor - heel[1] * h;
    } else if (angle > 1e-6) {
      contact = 'toe';
      const toe = rotate(FOOT.toe, angle);
      anchorX = foot.baseX + direction * .105 * h;
      ankleX = anchorX - direction * toe[0] * h;
      ankleY = state.floor - toe[1] * h;
    } else {
      angle = 0; contact = 'flat';
      anchorX = foot.baseX - direction * .04 * h;
      ankleX = foot.baseX; ankleY = state.floor - .055 * h;
    }
  }
  const heel = rotate(FOOT.heel, angle), toe = rotate(FOOT.toe, angle);
  return { ankle: [ankleX, ankleY],
    heel: [ankleX + direction * heel[0] * h, ankleY + heel[1] * h],
    toe: [ankleX + direction * toe[0] * h, ankleY + toe[1] * h],
    footAngle: angle, contact, anchorX, yaw: direction };
}

function startStep(state, index, targetX, settling = false) {
  const foot = state.feet[index];
  const old = footGeometry(state, foot);
  const distance = Math.abs(targetX - foot.baseX) / state.height;
  let phaseTo = index === 0 ? 1 : .5;
  if (phaseTo < state.walkPhase - 1e-6) phaseTo += 1;
  foot.swing = { elapsed: 0, duration: settling ? clamp(.15 + distance * .3, .18, .25) : SWING_DURATION,
    fromX: old.ankle[0], fromY: old.ankle[1], fromAngle: old.footAngle,
    targetX, goalX: targetX, settling, lift: settling ? .018 : .035,
    phaseFrom: state.walkPhase, phaseTo };
  state.settled = false;
}

function idleGoal(state, index, root = state.x, facing = state.facing) {
  return root + facing * (index === 0 ? .022 : -.022) * state.height;
}

function startPivot(state, index, targetX, duration) {
  startStep(state, index, targetX, true);
  const swing = state.feet[index].swing;
  swing.turn = true;
  swing.duration = duration;
  swing.lift = .024;
  swing.fromFacing = state.feet[index].facing;
  swing.toFacing = state.turn.target;
}

function substep(state, input, dt) {
  state.time += dt;
  if (state.turn) {
    state.turn.elapsed = Math.min(TURN_DURATION, state.turn.elapsed + dt);
    // The visual turn covers both feet, including the brief support overlap.
    // A renderer can show all five painted directions without a midpoint flip.
    if (state.turn.elapsed >= TURN_DURATION * .5 && !state.turn.flipped) {
      state.facing = state.turn.target;
      state.turn.flipped = true;
    }
  }
  const wanted = Math.sign(input);
  const reversing = wanted !== 0 && wanted !== state.facing;
  const canWalk = wanted !== 0 && !reversing && !state.turn;
  const targetVelocity = canWalk ? wanted * state.speed : 0;
  const oldVelocity = state.velocity;
  state.velocity = approach(state.velocity, targetVelocity, (canWalk ? 780 : 1100) * dt);
  const nextX = clamp(state.x + (oldVelocity + state.velocity) * .5 * dt, state.min, state.max);
  if (nextX === state.min && state.velocity < 0 || nextX === state.max && state.velocity > 0) state.velocity = 0;
  state.x = nextX;
  const atBoundary = wanted === 1 && state.x === state.max || wanted === -1 && state.x === state.min;
  const advancing = canWalk && !atBoundary;
  state.doubleSupport = Math.max(0, state.doubleSupport - dt);
  let active = -1;
  for (let i = 0; i < 2; i++) {
    const foot = state.feet[i];
    if (!foot.swing) {
      foot.age += dt;
      const behind = (state.x - foot.baseX) * foot.facing / state.height;
      const desiredRoll = foot.age < .075 ? HEEL_STRIKE * (1 - ease(foot.age / .075))
        : Math.abs(state.velocity) > 8 ? .16 * ease(clamp((behind - .025) / .09, 0, 1)) : 0;
      foot.roll = approach(foot.roll, desiredRoll, dt * 4);
      continue;
    }
    active = i;
    const swing = foot.swing;
    // On release, redirect the airborne foot towards the predicted stopping
    // position; its target moves continuously, never teleporting the foot.
    if (!advancing && !swing.settling) {
      const stop = clamp(state.x + state.velocity * Math.abs(state.velocity) / 2200, state.min, state.max);
      swing.goalX = idleGoal(state, i, stop);
    } else if (advancing && !swing.settling) {
      // A brief release/opposite tap may have shortened this landing. Restore
      // its walking prediction when motion resumes; retaining the stop target
      // would leave a support foot far behind and force an artificial crouch.
      const remaining = Math.max(0, swing.duration - swing.elapsed);
      swing.goalX = clamp(state.x + state.velocity * remaining + state.facing * .12 * state.height,
        state.min - .025 * state.height, state.max + .035 * state.height);
    }
    swing.targetX = approach(swing.targetX, swing.goalX, 230 * dt);
    swing.elapsed = Math.min(swing.duration, swing.elapsed + dt);
    state.stepProgress = swing.elapsed / swing.duration;
    if (!swing.turn) state.walkPhase = mix(swing.phaseFrom, swing.phaseTo, ease(state.stepProgress)) % 1;
    if (swing.elapsed >= swing.duration) {
      foot.baseX = swing.targetX;
      foot.age = swing.turn ? 1 : 0;
      foot.roll = swing.turn ? 0 : HEEL_STRIKE;
      if (swing.turn) foot.facing = swing.toFacing;
      foot.swing = null;
      state.doubleSupport = swing.turn ? .012 : .04;
      if (swing.turn && state.turn?.stage === 'first') state.turn.stage = 'second';
      else if (swing.turn) {
        state.turn = null;
        state.walkPhase = 0;
      }
      state.stepCount++;
      state.stepProgress = 1;
      active = -1;
    }
  }
  if (active < 0 && state.doubleSupport === 0) {
    if (state.turn?.stage === 'second') {
      const index = 1 - state.turn.first;
      const target = idleGoal(state, index, state.x, state.turn.target);
      startPivot(state, index, target, .1875);
    } else if (reversing && state.velocity === 0) {
      // Keep the rear foot as support and turn the forward foot in a short
      // airborne pivot. This replaces two idle steps and an extra turn delay.
      const first = state.feet[0].baseX * state.facing > state.feet[1].baseX * state.facing ? 0 : 1;
      state.turn = { stage: 'first', first, source: state.facing, target: wanted, elapsed: 0, flipped: false };
      startPivot(state, first, idleGoal(state, first, state.x, wanted), .18);
    } else if (advancing && Math.abs(state.velocity) > 12) {
      const trails = state.feet.map(foot => (state.x - foot.baseX) * state.facing / state.height);
      const next = trails[0] > trails[1] ? 0 : 1;
      if (trails[next] > .048) {
        const predicted = state.x + state.velocity * SWING_DURATION;
        const target = clamp(predicted + state.facing * .12 * state.height,
          state.min - .025 * state.height, state.max + .035 * state.height);
        startStep(state, next, target);
      }
    } else if (Math.abs(state.velocity) < 1) {
      const errors = state.feet.map((foot, i) => Math.abs(foot.baseX - idleGoal(state, i)));
      const next = errors[0] > errors[1] ? 0 : 1;
      if (errors[next] > .012 * state.height) startStep(state, next, idleGoal(state, next), true);
    }
  }
  const airborne = state.feet.some(foot => foot.swing !== null);
  const feetReady = state.feet.every((foot, i) => Math.abs(foot.baseX - idleGoal(state, i)) < .013 * state.height);
  state.bodyWeight = approach(state.bodyWeight, Math.min(1, Math.abs(state.velocity) / 85), dt * 6);
  const resting = state.bodyWeight < 1e-6 && state.feet.every(foot => Math.abs(foot.roll) < 1e-6);
  state.settled = !state.turn && !airborne && Math.abs(state.velocity) < .1 && feetReady && resting;
  state.walking = Math.abs(state.velocity) > .5 || airborne || !resting || !!state.turn;
  state.mode = reversing || state.turn ? 'turning' : state.walking ? (advancing ? 'walking' : 'settling') : 'idle';
}

export function advanceGait(state, input, dt) {
  let remaining = clamp(Number.isFinite(dt) ? dt : 0, 0, .1);
  input = clamp(Number.isFinite(input) ? input : 0, -1, 1);
  while (remaining > 1e-9) {
    const delta = Math.min(remaining, 1 / 240);
    substep(state, input, delta);
    remaining -= delta;
  }
  return state;
}

function kneeFor(hip, ankle, bendDirection = 1, thigh = THIGH, shin = SHIN) {
  const dx = ankle[0] - hip[0], dy = ankle[1] - hip[1];
  const distance = Math.max(1e-6, Math.hypot(dx, dy));
  const along = (thigh * thigh - shin * shin + distance * distance) / (2 * distance);
  const bend = Math.sqrt(Math.max(0, thigh * thigh - along * along));
  // The limb's physical yaw, not the body's side-view flip, selects the bend.
  // During a pivot its out-of-plane rotation projects to a shorter 2D limb.
  return {
    point: [hip[0] + dx * along / distance + dy * bend * bendDirection / distance,
      hip[1] + dy * along / distance - dx * bend * bendDirection / distance],
    depth: bend * Math.sqrt(Math.max(0, 1 - bendDirection * bendDirection))
  };
}

export function getGaitPose(state) {
  const h = state.height, facing = state.facing;
  const local = point => [(point[0] - state.x) * facing / h, (point[1] - state.floor) / h];
  const raw = state.feet.map(foot => footGeometry(state, foot));
  // At midstance the supporting leg is almost extended. The geometry below
  // lowers the pelvis only when a forward/backward foot requires it; lowering
  // the whole walking pose in advance would make every step look crouched.
  const strideBob = (.001 + Math.cos(state.stepProgress * Math.PI * 2) * .005) * state.bodyWeight;
  let hipY = -.520 + strideBob;
  // Lower the pelvis only if required to keep a planted foot reachable. Never
  // compensate by moving the contact or stretching a limb.
  raw.forEach((foot, i) => {
    const ankle = local(foot.ankle), hipX = (i === 0 ? .009 : -.009) * foot.yaw * facing;
    const dx = ankle[0] - hipX;
    const reachY = Math.sqrt(Math.max(.01, .467 * .467 - dx * dx));
    hipY = Math.max(hipY, ankle[1] - reachY);
  });
  const lean = .008 * state.bodyWeight;
  // The small torso correction keeps both the painted crown (source y=28)
  // and its mask margin at the previous height after shortening the legs.
  const hip = [0, hipY], shoulder = [lean, hipY - .272];
  const legs = raw.map((foot, i) => {
    const ankle = local(foot.ankle), footYaw = foot.yaw * facing;
    // The knee eases through the frontal part of a pivot rather than sweeping
    // abruptly across the side silhouette at the instant the torso turns.
    const limbYaw = foot.yaw ** 3 * facing;
    const legHip = [(i === 0 ? .009 : -.009) * footYaw, hipY];
    const knee = kneeFor(legHip, ankle, limbYaw);
    return { hip: legHip, knee: knee.point, kneeDepth: knee.depth, legYaw: limbYaw, ankle,
      heel: local(foot.heel), toe: local(foot.toe), footAngle: foot.footAngle,
      contact: foot.contact, anchorX: foot.anchorX, footYaw };
  });
  const armSwing = clamp((legs[0].ankle[0] - legs[1].ankle[0]) * 1.75, -.42, .42) * state.bodyWeight;
  const arms = legs.map((leg, i) => {
    // Differential leg reach drives an opposed pair, preventing both arms
    // hanging in the same direction while the recovery leg passes the stance
    // leg. Peak shoulder swing is 24 degrees with a 14-degree elbow bend.
    const angle = i === 0 ? -armSwing : armSwing;
    const start = [shoulder[0] + (i === 0 ? .006 : -.006), shoulder[1]];
    const elbow = [start[0] + Math.sin(angle) * .145, start[1] + Math.cos(angle) * .145];
    const forearm = angle + .24;
    const wrist = [elbow[0] + Math.sin(forearm) * .145, elbow[1] + Math.cos(forearm) * .145];
    return { shoulder: start, elbow, wrist };
  });
  return { x: state.x, floor: state.floor, height: h, facing, walking: state.walking,
    walkPhase: state.walkPhase,
    turn: state.turn ? { progress: ease(state.turn.elapsed / TURN_DURATION),
      sourceFacing: state.turn.source, targetFacing: state.turn.target } : null,
    settled: state.settled, body: { hip, shoulder }, nearLeg: legs[0], farLeg: legs[1],
    nearArm: arms[0], farArm: arms[1] };
}
