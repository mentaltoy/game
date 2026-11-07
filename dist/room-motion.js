import { createGroundLocomotion, updateGroundLocomotion, getGroundLocomotionPose,
  getRunApproachDistance } from './run-motion.js?v=9';
import { createStairMotion, updateStairMotion, getStairPose } from './stair-motion.js?v=9';
import { getRoomBounds, getRoomStairs } from './room-layout.js?v=8';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const SIMULATION_STEP = 1 / 240;

function makeGround(state, surface, x, facing) {
  const lower = surface === 'lower';
  const entry = lower ? state.nodes[0] : state.nodes.at(-1);
  const ground = createGroundLocomotion({
    x,
    min: lower ? state.bounds.min : entry.x,
    max: lower ? entry.x : state.bounds.max,
    floor: entry.y,
    height: state.height,
    speed: state.speed,
    runSpeed: state.runSpeed,
    runStride: state.runStride,
    facing,
  });
  state.surface = surface;
  state.ground = ground;
  state.stairs = null;
}

function makeStairs(state, index, facing) {
  state.stairs = createStairMotion({
    nodes: state.nodes, height: state.height, index, facing,
  });
  state.ground = null;
  state.surface = 'stairs';
}

/** Coordinates are in the same world space as room-layout and the painting. */
export function createRoomMotion({ world, x, height = world?.characterHeight, speed = 160,
  runSpeed = speed * 2, runStride = height * 1.10 }) {
  if (!world || ![world.width, world.height, x, height, speed, runSpeed, runStride].every(Number.isFinite)
    || world.width <= 0 || world.height <= 0 || height <= 0 || speed <= 0 || runSpeed < speed || runStride <= 0) {
    throw new Error('Invalid room motion dimensions.');
  }
  const dimensions = { width: world.width, height: world.height };
  const state = {
    world: dimensions, height, speed, runSpeed, runStride,
    bounds: getRoomBounds(dimensions), nodes: getRoomStairs(dimensions),
    surface: 'lower', ground: null, stairs: null,
  };
  const position = clamp(x, state.bounds.min, state.bounds.max);
  if (position <= state.nodes[0].x) makeGround(state, 'lower', position, 1);
  else if (position >= state.nodes.at(-1).x) makeGround(state, 'upper', position, 1);
  else {
    // A deliberate spawn inside the stairs starts at the closest safe support.
    // Runtime handoffs never use this branch or snap to a different position.
    let index = 0;
    for (let i = 1; i < state.nodes.length; i++) {
      if (Math.abs(state.nodes[i].x - position) < Math.abs(state.nodes[index].x - position)) index = i;
    }
    makeStairs(state, index, 1);
  }
  return state;
}

function substep(state, input, dt, running) {
  if (state.surface === 'stairs') {
    updateStairMotion(state.stairs, input, dt);
    const pose = getStairPose(state.stairs);
    if (pose.settled && pose.exitDirection) {
      const surface = pose.exitDirection > 0 ? 'upper' : 'lower';
      makeGround(state, surface, pose.x, pose.facing);
    }
    // The new ground instance advances on the next simulation tick, after the
    // complete step and gather. Its initial pose is at the exact same support.
    return;
  }

  const previous = getGroundLocomotionPose(state.ground);
  const towards = input || Math.sign(previous.velocity) || previous.facing;
  const towardsStairs = state.surface === 'lower' ? towards > 0 : towards < 0;
  const boundary = state.surface === 'lower' ? state.nodes[0].x : state.nodes.at(-1).x;
  const runAllowed = !towardsStairs || Math.abs(boundary - previous.x) > getRunApproachDistance(state.ground);
  updateGroundLocomotion(state.ground, input, dt, { running, runAllowed });
  const pose = getGroundLocomotionPose(state.ground);
  if (!pose.settled || !input) return;
  const lower = state.surface === 'lower';
  const index = lower ? 0 : state.nodes.length - 1;
  const direction = lower ? 1 : -1;
  if (input === direction && pose.facing === direction && pose.x === state.nodes[index].x) {
    makeStairs(state, index, pose.facing);
  }
}

/**
 * Uses the controllers' existing fixed step size at the connecting boundary,
 * so a 30/60/120 Hz display does not add an extra frame of handoff delay.
 * Neither underlying controller nor the approved flat-ground gait is changed.
 */
export function updateRoomMotion(state, input, dt, { running = false } = {}) {
  const wanted = Math.sign(Number.isFinite(input) ? input : 0);
  let remaining = clamp(Number.isFinite(dt) ? dt : 0, 0, .1);
  while (remaining > 1e-9) {
    const step = Math.min(SIMULATION_STEP, remaining);
    substep(state, wanted, step, !!running);
    remaining -= step;
  }
  return state;
}

export function getRoomPose(state) {
  const pose = state.surface === 'stairs'
    ? { ...getStairPose(state.stairs), locomotion: 'walk', runPhase: 0, runWeight: 0, runLevel: 0, runTransition: null }
    : getGroundLocomotionPose(state.ground);
  return { ...pose, surface: state.surface };
}
