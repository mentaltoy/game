import assert from 'node:assert/strict';
import { createMotion, updateMotion, getMotionPose } from '../dist/sprite-motion.js';

const make = options => createMotion({ x: 500, min: 100, max: 900, height: 267, floor: 800, ...options });
const run = (state, input, seconds, hz = 120, inspect = () => {}) => {
  for (let i = 0; i < Math.round(seconds * hz); i++) {
    updateMotion(state, input, 1 / hz); inspect(state);
  }
  return state;
};
const valid = state => {
  const p = getMotionPose(state);
  for (const key of ['x', 'floor', 'height', 'speed', 'velocity', 'walkPhase', 'walkWeight']) assert(Number.isFinite(p[key]), key);
  assert(p.x >= state.min && p.x <= state.max);
  assert(p.walkWeight >= 0 && p.walkWeight <= 1);
  assert(p.walkPhase >= 0 && p.walkPhase < 1);
  if (p.turn) {
    assert(p.turn.progress >= 0 && p.turn.progress <= 1);
    assert.equal(state.velocity, 0);
    assert.equal(state.walkWeight, 0);
  }
};
let count = 0;
const test = (name, task) => { task(); count++; console.log(`PASS ${name}`); };

test('idle retains the complete painted neutral pose without synthetic bob', () => {
  const state = make(), initial = getMotionPose(state);
  run(state, 0, 2, 60, valid);
  assert.deepEqual(getMotionPose(state), initial);
});

test('cycle advances in exact proportion to ground distance without contact pauses', () => {
  const state = make(); let traveled = 0, previousX = state.x, previousPhase = state.walkPhase;
  run(state, 1, 2, 120, s => {
    valid(s);
    const distance = s.x - previousX;
    const phaseDistance = ((s.walkPhase - previousPhase + 1) % 1) * s.stride;
    assert(Math.abs(distance - phaseDistance) < 1e-9);
    if (s.velocity === s.maxSpeed) assert(distance > 0);
    traveled += distance; previousX = s.x; previousPhase = s.walkPhase;
  });
  assert(traveled > 300); assert.equal(state.walkWeight, 1);
  assert.equal(state.velocity, state.maxSpeed);
});

test('acceleration is responsive and release settles continuously from any cycle phase', () => {
  for (let phase = 0; phase < 16; phase++) {
    const state = make(); run(state, 1, .2 + phase * .045);
    let oldWeight = state.walkWeight, oldVelocity = state.velocity, oldX = state.x;
    run(state, 0, .3, 120, s => {
      valid(s); assert(s.walkWeight <= oldWeight + 1e-12);
      assert(s.velocity <= oldVelocity); assert(s.x >= oldX);
      assert(Math.abs(s.walkWeight - oldWeight) < .09, 'blend jumps');
      oldWeight = s.walkWeight; oldVelocity = s.velocity; oldX = s.x;
    });
    assert(state.settled); assert.equal(state.walkWeight, 0); assert.equal(state.velocity, 0);
  }
});

test('turn uses a full continuous angle at a fixed root and changes facing only at an endpoint', () => {
  const state = make(); run(state, 1, .65);
  let sawTurn = false, turnRoot, lastProgress = 0, previousFacing = state.facing;
  run(state, -1, 1, 240, s => {
    valid(s);
    if (s.turn) {
      if (!sawTurn) { turnRoot = s.x; sawTurn = true; }
      assert.equal(s.x, turnRoot);
      assert(s.turn.progress >= lastProgress);
      assert(s.turn.progress - lastProgress <= .014);
      assert.equal(s.facing, previousFacing);
      lastProgress = s.turn.progress;
    } else if (s.facing !== previousFacing) {
      assert(lastProgress > .99); previousFacing = s.facing;
    }
  });
  assert(sawTurn); assert.equal(state.facing, -1); assert(state.x < turnRoot);
});

test('changing the requested direction inside a turn retraces the same rotation', () => {
  for (const elapsed of [.06, .12, .19, .25]) {
    const state = make();
    while (!state.turn) updateMotion(state, -1, 1 / 240);
    run(state, -1, elapsed, 240);
    let last = state.turn.progress, reversed = false;
    run(state, 1, .8, 240, s => {
      valid(s);
      if (s.turn) {
        assert.equal(s.turn.source, 1); assert.equal(s.turn.target, -1);
        assert(Math.abs(s.turn.progress - last) < .015);
        reversed ||= s.turn.progress < last;
        last = s.turn.progress;
      }
    });
    assert(reversed); assert.equal(state.facing, 1); assert(state.velocity > 0);
  }
});

test('release during a turn completes one coherent rotation and returns to idle', () => {
  for (const t of [.03, .12, .2, .28]) {
    const state = make();
    while (!state.turn) updateMotion(state, -1, 1 / 240);
    run(state, -1, t, 240); const x = state.x;
    run(state, 0, .6, 240, valid);
    assert(state.settled); assert.equal(state.facing, -1); assert.equal(state.x, x);
  }
});

test('both bounds stop phase advance and settle without looping in place', () => {
  for (const direction of [-1, 1]) {
    const state = make(); run(state, direction, 5, 60, valid);
    assert.equal(state.x, direction > 0 ? state.max : state.min);
    assert(state.settled); const phase = state.walkPhase;
    run(state, direction, .5); assert.equal(state.walkPhase, phase);
    run(state, -direction, 1); assert(state.x > state.min && state.x < state.max);
  }
});

test('rapid alternating and cancelled input never creates a pose or position discontinuity', () => {
  for (const hz of [30, 60, 120]) {
    const state = make(); let previous = getMotionPose(state);
    for (let i = 0; i < hz * 5; i++) {
      updateMotion(state, [1, 0, -1, 1, -1, 0][i % 6], 1 / hz); valid(state);
      const p = getMotionPose(state);
      assert(Math.abs(p.x - previous.x) <= state.maxSpeed / hz + 1e-9);
      assert(Math.abs(p.walkWeight - previous.walkWeight) < .4);
      previous = p;
    }
    run(state, 0, 1, hz, valid); assert(state.settled);
  }
});

test('30, 60 and 120Hz have equivalent root and phase trajectories', () => {
  const snapshots = [30, 60, 120].map(hz => {
    const state = make();
    for (const [input, time] of [[1, .7], [0, .2], [-1, 1.1], [1, .8], [0, .4]]) run(state, input, time, hz, valid);
    return getMotionPose(state);
  });
  for (const key of ['x', 'velocity', 'walkPhase', 'walkWeight']) {
    assert(Math.abs(snapshots[0][key] - snapshots[1][key]) < 1e-8, key);
    assert(Math.abs(snapshots[1][key] - snapshots[2][key]) < 1e-8, key);
  }
  assert.equal(snapshots[0].facing, snapshots[2].facing);
});

test('invalid dimensions fail and interrupted RAF deltas remain finite', () => {
  assert.throws(() => make({ height: 0 })); assert.throws(() => make({ stride: -1 }));
  assert.throws(() => make({ min: 1000 })); assert.throws(() => make({ x: Infinity }));
  const state = make();
  for (const dt of [NaN, Infinity, -1, 3, 0]) { updateMotion(state, 1, dt); valid(state); }
  updateMotion(state, NaN, .05); valid(state);
});

console.log(`${count} painted-motion checks passed.`);
