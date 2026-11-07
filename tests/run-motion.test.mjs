import test from 'node:test';
import assert from 'node:assert/strict';
import { createGroundLocomotion, updateGroundLocomotion, getGroundLocomotionPose } from '../dist/run-motion.js';
import { createRoomMotion, updateRoomMotion, getRoomPose } from '../dist/room-motion.js';
import { getRoomStairs, getRoomBounds } from '../dist/room-layout.js';

const height = 266;
const make = options => createGroundLocomotion({ x: 0, min: -10000, max: 10000, height, floor: 800, ...options });
const phaseDistance = (a, b) => Math.min(Math.abs(a - b), 1 - Math.abs(a - b));
function run(state, input, seconds, running = true, fps = 120) {
  for (let i = 0; i < Math.round(seconds * fps); i++) updateGroundLocomotion(state, input, 1 / fps, { running });
  return getGroundLocomotionPose(state);
}
function until(state, input, running, predicate, seconds = 5) {
  for (let i = 0; i < seconds * 240; i++) {
    updateGroundLocomotion(state, input, 1 / 240, { running });
    const pose = getGroundLocomotionPose(state);
    if (predicate(pose)) return pose;
  }
  assert.fail('Expected locomotion state was not reached.');
}

test('running accelerates to its own speed and its cycle follows actual distance', () => {
  const state = make(); let previous = getGroundLocomotionPose(state);
  for (let i = 0; i < 300; i++) {
    updateGroundLocomotion(state, 1, 1 / 240, { running: true });
    const pose = getGroundLocomotionPose(state);
    assert.equal(pose.locomotion, 'run');
    assert.ok(pose.speed >= previous.speed && pose.speed <= 320);
    assert.ok(pose.speed - previous.speed < 12, 'No instantaneous velocity change.');
    const expected = (previous.runPhase + (pose.x - previous.x) / state.runStride) % 1;
    assert.ok(phaseDistance(pose.runPhase, expected) < 1e-9);
    assert.equal(pose.floor, 800); assert.equal(pose.height, height);
    previous = pose;
  }
  assert.equal(previous.speed, 320); assert.equal(previous.runWeight, 1);
  assert.ok(previous.x > 160, 'It must actually run, not merely animate a faster walk.');
});

test('walk/run modifier changes wait for contacts and preserve momentum and root position', () => {
  const state = make();
  until(state, 1, false, pose => pose.walkPhase > .2 && pose.walkPhase < .3);
  const initial = getGroundLocomotionPose(state);
  updateGroundLocomotion(state, 1, 1 / 240, { running: true });
  assert.equal(getGroundLocomotionPose(state).locomotion, 'walk');
  let previous = getGroundLocomotionPose(state);
  const runningPose = until(state, 1, true, pose => {
    assert.ok(Math.abs(pose.x - previous.x) <= 320 / 240 + 1e-8);
    assert.ok(Math.abs(pose.velocity - previous.velocity) < 12);
    previous = pose;
    return pose.locomotion === 'run';
  });
  assert.ok(runningPose.x > initial.x);
  assert.ok(phaseDistance(runningPose.runPhase, .5) < .01);
  assert.equal(runningPose.speed, 160);
  until(state, 1, true, pose => pose.runPhase > .7 && pose.runPhase < .8 && pose.speed === 320);
  previous = getGroundLocomotionPose(state);
  const walkingPose = until(state, 1, false, pose => {
    assert.ok(Math.abs(pose.x - previous.x) <= 320 / 240 + 1e-8);
    assert.ok(Math.abs(pose.velocity - previous.velocity) < 12);
    previous = pose;
    return pose.locomotion === 'walk';
  });
  assert.ok(phaseDistance(walkingPose.walkPhase, 0) < .01);
  assert.equal(walkingPose.speed, 320, 'Momentum is not reset at the contact.');
  assert.equal(run(state, 1, .5, false).speed, 160);
});

test('a modifier request cancelled before the next contact does not change the gait', () => {
  const state = make();
  until(state, 1, false, pose => pose.walkPhase > .2);
  run(state, 1, .05, true);
  const pose = run(state, 1, .3, false);
  assert.equal(pose.locomotion, 'walk'); assert.equal(pose.speed, 160);
});

test('moving gait changes expose a short whole-pose bridge in both directions without pausing', () => {
  const state = make();
  until(state, 1, false, pose => pose.walkPhase > .2);
  for (const running of [true, false]) {
    const changed = until(state, 1, running, pose => !!pose.runTransition);
    assert.equal(changed.runTransition.from, running ? 'walk' : 'run');
    assert.equal(changed.runTransition.to, running ? 'run' : 'walk');
    assert.equal(changed.runTransition.progress, 0);
    assert.equal(changed.runLevel, running ? 0 : 1);
    let previous = changed, elapsed = 0;
    while (getGroundLocomotionPose(state).runTransition) {
      updateGroundLocomotion(state, 1, 1 / 240, { running }); elapsed += 1 / 240;
      const pose = getGroundLocomotionPose(state);
      assert.ok(pose.x > previous.x, 'Bridge drawings do not pause translation.');
      assert.ok(running ? pose.runLevel >= previous.runLevel : pose.runLevel <= previous.runLevel);
      assert.equal(pose.floor, 800); assert.equal(pose.height, 266);
      previous = pose;
    }
    assert.ok(elapsed >= .12 && elapsed < .13);
    assert.equal(previous.runLevel, running ? 1 : 0);
    run(state, 1, .3, running);
  }
});

test('running release brakes over a longer interval without an idle slide or direction flip', () => {
  const state = make(); run(state, 1, 1);
  let previous = getGroundLocomotionPose(state), stoppedAt = null;
  for (let i = 1; i <= 120; i++) {
    updateGroundLocomotion(state, 0, 1 / 240, { running: true });
    const pose = getGroundLocomotionPose(state);
    assert.ok(pose.x >= previous.x && pose.speed <= previous.speed);
    assert.equal(pose.facing, 1); assert.equal(pose.turn, null);
    if (pose.speed > 0) { assert.equal(pose.locomotion, 'run'); assert.ok(pose.runWeight > 0); }
    if (pose.settled && stoppedAt === null) stoppedAt = i / 240;
    previous = pose;
  }
  assert.ok(stoppedAt >= .23 && stoppedAt <= .26);
  assert.equal(previous.locomotion, 'walk'); assert.equal(previous.runWeight, 0);
  const stoppedX = previous.x; run(state, 0, 1); assert.equal(getGroundLocomotionPose(state).x, stoppedX);
});

test('a running reversal brakes before the approved turn and never flips a moving sprite', () => {
  const state = make(); run(state, 1, 1);
  let sawTurn = false, turnAt, previous = getGroundLocomotionPose(state);
  for (let i = 0; i < 400; i++) {
    updateGroundLocomotion(state, -1, 1 / 240, { running: true });
    const pose = getGroundLocomotionPose(state);
    if (pose.turn) {
      sawTurn = true; turnAt ??= pose.x;
      assert.equal(pose.velocity, 0); assert.equal(pose.x, turnAt);
      assert.equal(pose.locomotion, 'walk'); assert.equal(pose.runWeight, 0);
    }
    if (pose.facing !== previous.facing) {
      assert.equal(pose.velocity, 0); assert.equal(previous.velocity, 0);
    }
    previous = pose;
  }
  assert.ok(sawTurn); assert.equal(previous.facing, -1);
  assert.equal(previous.locomotion, 'run'); assert.equal(previous.velocity, -320);
});

test('the running option does not speed up stairs and changes back to walking before entry', () => {
  const world = { width: 1644, height: 957 }, nodes = getRoomStairs(world);
  const state = createRoomMotion({ world, x: 90, height });
  let sawRun = false, sawApproachWalk = false, enteredAt = null, leftAt = null, previous;
  for (let i = 0; i < 12 * 240; i++) {
    updateRoomMotion(state, 1, 1 / 240, { running: true }); const pose = getRoomPose(state);
    if (pose.surface === 'lower' && pose.locomotion === 'run') sawRun = true;
    if (sawRun && pose.surface === 'lower' && pose.locomotion === 'walk' && pose.x < nodes[0].x) sawApproachWalk = true;
    if (pose.surface === 'stairs') {
      enteredAt ??= i / 240;
      assert.equal(pose.locomotion, 'walk'); assert.equal(pose.runWeight, 0);
      assert.ok(pose.speed < 100);
    }
    if (previous?.surface === 'stairs' && pose.surface === 'upper') {
      leftAt = i / 240;
      assert.equal(pose.x, previous.x); assert.equal(pose.floor, previous.floor);
      assert.equal(pose.settled, true);
    }
    previous = pose;
  }
  assert.ok(sawRun && sawApproachWalk); assert.ok(leftAt - enteredAt > 1.8);
  assert.equal(previous.x, getRoomBounds(world).max); assert.equal(previous.settled, true);
});

test('running is gated beside a stair but stays selected towards the outer room edge', () => {
  const world = { width: 1644, height: 957 };
  for (const [x, direction, locomotion] of [[900, 1, 'walk'], [1548, 1, 'run']]) {
    const state = createRoomMotion({ world, x, height });
    updateRoomMotion(state, direction, 1 / 240, { running: true });
    assert.equal(getRoomPose(state).locomotion, locomotion);
  }
});

test('running and modifier handoffs are identical at 30, 60 and 120 Hz', () => {
  const results = [30, 60, 120].map(fps => {
    const state = make(); const samples = [];
    for (const [input, seconds, running] of [[1, 1.4, true], [1, .8, false], [1, .9, true], [0, .4, true], [-1, 1, true], [-1, .5, false]]) {
      samples.push(run(state, input, seconds, running, fps));
    }
    return samples;
  });
  for (let i = 0; i < results[0].length; i++) for (const samples of results.slice(1)) {
    const a = samples[i], b = results[0][i];
    assert.ok(Math.abs(a.x - b.x) < 1e-6);
    assert.ok(Math.abs(a.velocity - b.velocity) < 1e-6);
    assert.ok(phaseDistance(a.runPhase, b.runPhase) < 1e-6);
    assert.equal(a.locomotion, b.locomotion); assert.equal(a.facing, b.facing);
  }
});

test('run settings are configurable without invalid dimensions or elapsed-time spikes', () => {
  const state = make({ runSpeed: 360, runStride: 330 });
  assert.equal(run(state, 1, 1).speed, 360);
  const before = getGroundLocomotionPose(state);
  updateGroundLocomotion(state, NaN, NaN, { running: true });
  assert.deepEqual(getGroundLocomotionPose(state), before);
  updateGroundLocomotion(state, 1, 1000, { running: true });
  assert.ok(getGroundLocomotionPose(state).x - before.x <= 36.00001);
  assert.throws(() => make({ runSpeed: 100 }));
  assert.throws(() => make({ runStride: 0 }));
});
