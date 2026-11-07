export const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
export function createMotion(width) {
  return { x: width * .354, velocity: 0, facing: 1, phase: 0,
    min: width * .174, max: width * .474, speed: 160, stride: 160 };
}
export function advanceMotion(state, input, elapsed) {
  // Substeps keep deceleration and boundaries consistent across frame rates.
  let left = clamp(elapsed, 0, .1);
  while (left > 0) {
    const dt = Math.min(left, 1 / 120);
    const target = clamp(input, -1, 1) * state.speed;
    const rate = input === 0 ? 1250 : 950;
    const previous = state.velocity;
    state.velocity += clamp(target - previous, -rate * dt, rate * dt);
    const oldX = state.x;
    state.x = clamp(state.x + (previous + state.velocity) * .5 * dt, state.min, state.max);
    const distance = Math.abs(state.x - oldX);
    if ((state.x === state.min && state.velocity < 0) || (state.x === state.max && state.velocity > 0)) state.velocity = 0;
    if (Math.abs(state.velocity) > 5) state.facing = Math.sign(state.velocity);
    state.phase = (state.phase + distance / state.stride) % 1;
    left -= dt;
  }
  return state;
}
