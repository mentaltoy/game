import test from 'node:test';
import assert from 'node:assert/strict';
import { createRoomMotion, updateRoomMotion, getRoomPose } from '../dist/room-motion.js';
import { createMotion, updateMotion, getMotionPose } from '../dist/sprite-motion.js';
import { getRoomBounds, getRoomStairs } from '../dist/room-layout.js';

const world = { width: 1644, height: 957, characterHeight: 266 };
const nodes = getRoomStairs(world), bounds = getRoomBounds(world);
const make = (x = bounds.min) => createRoomMotion({ world, x, height: 266 });
function run(state, input, seconds, fps = 120) {
  for (let i = 0; i < Math.round(seconds * fps); i++) updateRoomMotion(state, input, 1 / fps);
  return getRoomPose(state);
}
function until(state, input, predicate, limit = 20) {
  for (let i = 0; i < limit * 240; i++) {
    updateRoomMotion(state, input, 1 / 240);
    const pose = getRoomPose(state);
    if (predicate(pose)) return pose;
  }
  assert.fail('Expected room state was never reached.');
}
function verifyPlanted(pose) {
  if (pose.surface !== 'stairs') return;
  assert.ok(pose.feet.some(foot => foot.planted));
  for (const foot of pose.feet) if (foot.planted) {
    assert.equal(foot.x, nodes[foot.nodeIndex].x);
    assert.equal(foot.y, nodes[foot.nodeIndex].y);
  }
}

test('crosses the whole room, all five treads and both joins in a round trip', () => {
  const state = make();
  const transitions = [];
  let previous = getRoomPose(state);
  for (const input of [1, -1]) for (let i = 0; i < 20 * 240; i++) {
    updateRoomMotion(state, input, 1 / 240);
    const pose = getRoomPose(state);
    assert.ok(pose.x >= bounds.min && pose.x <= bounds.max);
    assert.equal(pose.height, 266);
    assert.ok(Math.abs(pose.x - previous.x) <= 160 / 240 + 1e-7);
    assert.ok(Math.abs(pose.floor - previous.floor) < .5, 'No vertical jump at a join.');
    verifyPlanted(pose);
    if (pose.surface !== previous.surface) {
      transitions.push(`${previous.surface}:${pose.surface}`);
      assert.equal(pose.x, previous.x);
      assert.equal(pose.floor, previous.floor);
      assert.equal(pose.facing, previous.facing);
      assert.equal(pose.settled, true);
      assert.equal(pose.walkWeight, 0);
    }
    previous = pose;
  }
  assert.deepEqual(transitions, ['lower:stairs', 'stairs:upper', 'upper:stairs', 'stairs:lower']);
  assert.equal(previous.x, bounds.min);
  assert.equal(previous.floor, nodes[0].y);
  assert.equal(previous.facing, -1);
  assert.equal(previous.settled, true);
});

test('the lower and upper flat sections keep the approved controller behaviour', () => {
  for (const surface of ['lower', 'upper']) {
    const lower = surface === 'lower';
    const x = lower ? 500 : 1300;
    const state = make(x);
    const original = createMotion({
      x, min: lower ? bounds.min : nodes.at(-1).x,
      max: lower ? nodes[0].x : bounds.max,
      height: 266, floor: lower ? nodes[0].y : nodes.at(-1).y,
    });
    for (const [input, duration] of [[1, .7], [0, .4], [-1, .9], [1, .1], [0, .4]]) {
      for (let i = 0; i < Math.round(duration * 120); i++) {
        updateRoomMotion(state, input, 1 / 120); updateMotion(original, input, 1 / 120);
        const { surface: actualSurface, locomotion, runPhase, runWeight, runLevel, runTransition, ...actual } = getRoomPose(state);
        assert.equal(actualSurface, surface);
        assert.equal(locomotion, 'walk'); assert.equal(runPhase, 0); assert.equal(runWeight, 0);
        assert.equal(runLevel, 0); assert.equal(runTransition, null);
        assert.deepEqual(actual, getMotionPose(original));
      }
    }
  }
});

test('ground handoff waits until velocity, walk blend and any turn are settled', () => {
  const state = make(nodes[0].x - 6);
  const contact = until(state, 1, pose => pose.x === nodes[0].x);
  assert.equal(contact.surface, 'lower');
  assert.equal(contact.settled, false);
  assert.ok(contact.walkWeight > 0);
  const entry = until(state, 1, pose => pose.surface === 'stairs');
  assert.equal(entry.x, nodes[0].x); assert.equal(entry.floor, nodes[0].y);
  assert.equal(entry.settled, true); assert.equal(entry.walkWeight, 0);
});

test('release on a stair completes only that step and can resume from its actual tread', () => {
  const state = make(nodes[0].x);
  const moving = until(state, 1, pose => pose.surface === 'stairs' && pose.stepPhase > .3);
  const target = moving.stepTo;
  const stopped = run(state, 0, 2);
  assert.equal(stopped.surface, 'stairs'); assert.equal(stopped.settled, true);
  assert.equal(stopped.x, nodes[target].x); assert.equal(stopped.floor, nodes[target].y);
  assert.ok(stopped.feet.every(foot => foot.planted && foot.nodeIndex === target));
  const end = run(state, 1, 12);
  assert.equal(end.surface, 'upper'); assert.equal(end.x, bounds.max);
});

test('reversal on a stair gathers, turns at a fixed support and descends without a snap', () => {
  const state = make(nodes[0].x);
  until(state, 1, pose => pose.surface === 'stairs' && pose.stepTo === 3 && pose.stepPhase > .2);
  let sawGather = false, sawTurn = false, turnAt;
  for (let i = 0; i < 3 * 240; i++) {
    updateRoomMotion(state, -1, 1 / 240); const pose = getRoomPose(state);
    verifyPlanted(pose);
    if (pose.surface === 'stairs' && pose.mode === 'gathering') sawGather = true;
    if (pose.surface === 'stairs' && pose.turn) {
      sawTurn = true; turnAt ??= [pose.x, pose.floor];
      assert.deepEqual([pose.x, pose.floor], turnAt);
      assert.ok(pose.feet.every(foot => foot.planted));
    }
  }
  assert.ok(sawGather && sawTurn);
  const end = run(state, -1, 10);
  assert.equal(end.surface, 'lower'); assert.equal(end.x, bounds.min);
});

test('a released command at either flat join stays idle and does not enter the staircase', () => {
  for (const [x, surface] of [[nodes[0].x, 'lower'], [nodes.at(-1).x, 'upper']]) {
    const state = make(x), pose = run(state, 0, 2);
    assert.equal(pose.x, x); assert.equal(pose.surface, surface); assert.equal(pose.settled, true);
  }
});

test('30, 60 and 120 Hz agree during traversal and reach identical room extremes', () => {
  const results = [30, 60, 120].map(fps => {
    const state = make(); const samples = [];
    for (const [input, seconds] of [[1, 5.5], [1, 1], [1, 2], [1, 5], [-1, 5], [-1, 1], [-1, 2], [-1, 5]]) {
      samples.push(run(state, input, seconds, fps));
    }
    return samples;
  });
  for (let i = 0; i < results[0].length; i++) for (const samples of results.slice(1)) {
    assert.equal(samples[i].surface, results[0][i].surface);
    assert.ok(Math.abs(samples[i].x - results[0][i].x) < 1e-6);
    assert.ok(Math.abs(samples[i].floor - results[0][i].floor) < 1e-6);
    assert.equal(samples[i].facing, results[0][i].facing);
  }
  for (const samples of results) {
    assert.equal(samples[3].x, bounds.max);
    assert.equal(samples.at(-1).x, bounds.min);
  }
});

test('scaled rooms use scaled contacts, and invalid input/time cannot teleport the character', () => {
  const halfWorld = { width: world.width / 2, height: world.height / 2 };
  const state = createRoomMotion({ world: halfWorld, x: 45, height: 133, speed: 80 });
  assert.deepEqual(state.nodes.map(n => [n.x, n.y]), nodes.map(n => [n.x / 2, n.y / 2]));
  const before = getRoomPose(state);
  updateRoomMotion(state, NaN, NaN);
  assert.deepEqual(getRoomPose(state), before);
  updateRoomMotion(state, 1, 1000);
  assert.ok(getRoomPose(state).x - before.x < 8);
  assert.throws(() => createRoomMotion({ world, x: NaN, height: 266 }));
});
