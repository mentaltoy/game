import { createGroundLocomotion, updateGroundLocomotion, getGroundLocomotionPose } from './run-motion.js?v=9';
import { createSpriteRenderer } from './sprite-renderer.js?v=8';
import { attachScreenInput } from './screen-input.js?v=8';
import { createRoomMotion, updateRoomMotion, getRoomPose } from './room-motion.js?v=9';
import { drawForeground } from './room-layout.js?v=8';
import { createStairRenderer } from './stair-renderer.js?v=9';
import { createRunRenderer, RUN_STRIDE_HEIGHT, RUN_PERIOD } from './run-renderer-v10.js?v=10';
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d', { alpha: false });
const stage = document.querySelector('#stage');
const loading = document.querySelector('#loading');
const notice = document.querySelector('#notice');
const leftButton = document.querySelector('#move-left');
const rightButton = document.querySelector('#move-right');
const fullscreenButton = document.querySelector('#fullscreen');
const walkButton = document.querySelector('#walk-mode');
const inputs = new Map();
const walkKeys = new Set();
let walkMode = false;
const studio = document.body.dataset.studio === 'true';
let world, motion, renderer, stairRenderer, runRenderer, pose, background;
let lastTime = 0, animation = 0, initialized = false;
let view = { scale: 1, x: 0, y: 0 };

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Impossibile caricare ${path}`));
    image.src = path;
  });
}

function resize() {
  const bounds = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(bounds.width * ratio));
  canvas.height = Math.max(1, Math.round(bounds.height * ratio));
  if (!world) return;
  const scale = Math.min(canvas.width / world.width, canvas.height / world.height);
  view = { scale, x: (canvas.width - world.width * scale) / 2, y: (canvas.height - world.height * scale) / 2 };
  render();
}

function drawFootShadow(foot) {
  const radius = pose.height * .085;
  ctx.save();
  ctx.translate(foot.x, foot.y + .6);
  ctx.scale(1, .13);
  const shade = ctx.createRadialGradient(0, 0, 1, 0, 0, radius);
  shade.addColorStop(0, `rgba(15,19,16,${.24 * (foot.contact ?? 1)})`);
  shade.addColorStop(1, 'rgba(15,19,16,0)');
  ctx.fillStyle = shade;
  ctx.fillRect(-radius, -radius, radius * 2, radius * 2);
  ctx.restore();
}

function render() {
  if (!initialized) return;
  pose = studio ? getGroundLocomotionPose(motion) : getRoomPose(motion);
  const actor = pose.surface === 'stairs' ? stairRenderer : pose.locomotion === 'run' || pose.runTransition ? runRenderer : renderer;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#101615'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
  if (studio) {
    ctx.fillStyle = '#cbc9bf'; ctx.fillRect(0, 0, world.width, world.height);
    ctx.fillStyle = '#c4c3b9'; ctx.fillRect(0, world.floor, world.width, world.height - world.floor);
    ctx.strokeStyle = '#aaa99f'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, world.floor); ctx.lineTo(world.width, world.floor); ctx.stroke();
  } else ctx.drawImage(background, 0, 0, world.width, world.height);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, world.floor, world.width, world.height * .914 - world.floor); ctx.clip();
  if (!studio && pose.surface === 'lower') actor.draw(ctx, pose, { alpha: .085, reflection: true });
  ctx.restore();
  for (const footprint of actor.getFootprints(pose)) drawFootShadow(footprint);
  actor.draw(ctx, pose);
  if (!studio) drawForeground(ctx, background, world);
  canvas.dataset.position = pose.x.toFixed(2);
  canvas.dataset.motion = pose.turn ? 'turning' : pose.settled ? 'idle' : pose.locomotion === 'run' ? 'running' : 'walking';
  canvas.dataset.turnProgress = pose.turn ? pose.turn.progress.toFixed(3) : '';
  canvas.dataset.facing = pose.facing === 1 ? 'right' : 'left';
  canvas.dataset.revision = '10';
  canvas.dataset.locomotion = pose.locomotion ?? 'walk';
  canvas.dataset.requestedGait = walkMode || walkKeys.size ? 'walk' : 'run';
  canvas.dataset.surface = pose.surface ?? 'studio';
  canvas.dataset.floor = pose.floor.toFixed(2);
  canvas.dataset.face = 'face-calibrated-v8';
  canvas.dataset.hair = renderer.source.hair;
  canvas.dataset.head = renderer.source.head;
  canvas.dataset.device = actor.source.device ?? renderer.source.device;
  canvas.dataset.grade = actor.source.grading ?? renderer.source.grade;
  canvas.dataset.artwork = pose.surface === 'stairs' && pose.mode === 'stepping'
    ? 'stair-refined-v9' : pose.locomotion === 'run' || pose.runTransition ? 'run-painted-v10' : 'walk-approved-v4';
  canvas.dataset.renderer = actor.source.renderer;
  canvas.dataset.frames = actor.source.frameCount ?? renderer.source.walkFrames.length;
  canvas.dataset.phase = (pose.locomotion === 'run' ? pose.runPhase : pose.walkPhase).toFixed(4);
  canvas.dataset.walkWeight = pose.walkWeight.toFixed(4);
}

function inputDirection() {
  let sum = 0;
  for (const direction of inputs.values()) sum += direction;
  return clamp(sum, -1, 1);
}
function updateButtons() {
  const values = [...inputs.values()];
  leftButton.classList.toggle('is-active', values.includes(-1));
  rightButton.classList.toggle('is-active', values.includes(1));
}
function setInput(token, direction) {
  if (direction) inputs.set(token, direction); else inputs.delete(token);
  updateButtons();
}
function updateWalkButton() {
  const walking = walkMode || walkKeys.size > 0;
  walkButton?.setAttribute('aria-pressed', String(walking));
  if (walkButton) walkButton.title = walkMode ? 'Torna alla corsa' : 'Attiva la camminata';
  const hint = document.querySelector('#hint');
  if (hint?.firstChild) hint.firstChild.textContent = `Tieni premuto a sinistra o a destra per ${walking ? 'camminare' : 'correre'}`;
}
function clearInputs() { inputs.clear(); walkKeys.clear(); updateButtons(); updateWalkButton(); }
walkButton?.addEventListener('click', () => {
  walkMode = !walkMode;
  updateWalkButton();
  render();
});
attachScreenInput({ element: document.querySelector('#experience'), onDirection: direction => setInput('screen-hold', direction) });

function tick(time) {
  const dt = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
  lastTime = time;
  const wasSettled = pose?.settled;
  const previousFacing = pose?.facing;
  if (studio) updateGroundLocomotion(motion, inputDirection(), dt, { running: !walkMode && walkKeys.size === 0 });
  else updateRoomMotion(motion, inputDirection(), dt, { running: !walkMode && walkKeys.size === 0 });
  pose = studio ? getGroundLocomotionPose(motion) : getRoomPose(motion);
  if (!pose.settled || !wasSettled || pose.facing !== previousFacing) render();
  animation = requestAnimationFrame(tick);
}

for (const [button, direction] of [[leftButton, -1], [rightButton, 1]]) {
  button.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    setInput(`pointer-${event.pointerId}`, direction);
  });
  const release = event => setInput(`pointer-${event.pointerId}`, 0);
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  button.addEventListener('contextmenu', event => event.preventDefault());
  button.addEventListener('keydown', event => {
    if (![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault(); setInput(`button-${direction}`, direction);
  });
  button.addEventListener('keyup', event => {
    if (![' ', 'Enter'].includes(event.key)) return;
    event.preventDefault(); setInput(`button-${direction}`, 0);
  });
  button.addEventListener('blur', () => setInput(`button-${direction}`, 0));
  // Assistive technology can activate a button without a pointer sequence.
  button.addEventListener('click', event => {
    if (event.detail !== 0) return;
    const token = `assist-${direction}`;
    setInput(token, direction); setTimeout(() => setInput(token, 0), 400);
  });
}

const keyDirections = { ArrowLeft: -1, KeyA: -1, ArrowRight: 1, KeyD: 1 };
window.addEventListener('keydown', event => {
  if (['ShiftLeft', 'ShiftRight'].includes(event.code)) {
    walkKeys.add(event.code); updateWalkButton(); return;
  }
  const direction = keyDirections[event.code];
  if (!direction || event.metaKey || event.ctrlKey || event.altKey) return;
  event.preventDefault(); setInput(event.code, direction);
});
window.addEventListener('keyup', event => {
  if (walkKeys.delete(event.code)) { updateWalkButton(); return; }
  if (!keyDirections[event.code]) return;
  event.preventDefault(); setInput(event.code, 0);
});
window.addEventListener('blur', clearInputs);
document.addEventListener('visibilitychange', () => {
  clearInputs(); cancelAnimationFrame(animation); lastTime = 0;
  if (initialized && !document.hidden) animation = requestAnimationFrame(tick);
});

fullscreenButton.addEventListener('click', async () => {
  clearInputs();
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.querySelector('#experience').requestFullscreen) {
      await document.querySelector('#experience').requestFullscreen();
    } else {
      document.body.classList.toggle('is-fullscreen');
      notice.textContent = document.body.classList.contains('is-fullscreen') ? 'Ruota il telefono in orizzontale per ampliare la scena.' : '';
    }
  } catch {
    document.body.classList.toggle('is-fullscreen');
  }
  const expanded = !!document.fullscreenElement || document.body.classList.contains('is-fullscreen');
  fullscreenButton.setAttribute('aria-label', expanded ? 'Esci da schermo intero' : 'Schermo intero');
  resize();
});
document.addEventListener('fullscreenchange', () => {
  const active = !!document.fullscreenElement;
  fullscreenButton.setAttribute('aria-label', active ? 'Esci da schermo intero' : 'Schermo intero');
  resize();
});
new ResizeObserver(resize).observe(stage);
window.visualViewport?.addEventListener('resize', resize);

try {
  const images = await Promise.all(['assets/interior.png', 'assets/walk-approved-v4.png', 'assets/turn-painted-v4.png', 'assets/walk-bridges-v4.png', 'assets/walk-completion-v4.png', 'assets/walk-bridges-v5-arms.png', 'assets/walk-completion-v5-arms.png', 'assets/walk-start-v5-arms.png', 'assets/device-hidden-v6.png', 'assets/stair-up-v8.png', 'assets/stair-down-v8.png', 'assets/stair-bridges-v8.png', 'assets/run-painted-v10.png', 'assets/run-device-hidden-v10.png', 'assets/run-transitions-v9.png', 'assets/run-transitions-device-hidden-v9.png', 'assets/stair-refined-v9.png'].map(loadImage));
  background = images[0];
  renderer = createSpriteRenderer({ walkImage: images[1], turnImage: images[2], bridgeImage: images[3], extraImage: images[4], armBridgeImage: images[5], armExtraImage: images[6], armStartImage: images[7], devicePatchAtlas: images[8], extraColumns: 2, extraRows: 2, extraTimes: [.365, .865, null], extraSettleCell: 3 });
  runRenderer = createRunRenderer({ runImage: images[12], devicePatchAtlas: images[13], transitionImage: images[14], transitionDevicePatchAtlas: images[15], groundRenderer: renderer });
  world = { width: background.width, height: background.height, floor: background.height * .836, characterHeight: background.height * (studio ? .55 : .278) };
  const runStride = world.characterHeight * RUN_STRIDE_HEIGHT;
  const runSpeed = runStride / RUN_PERIOD;
  motion = studio
    ? createGroundLocomotion({ x: world.width * .5, min: world.width * .174, max: world.width * .826, height: world.characterHeight, floor: world.floor, speed: 250, runStride, runSpeed })
    : createRoomMotion({ world, x: world.width * .354, height: world.characterHeight, speed: 160, runStride, runSpeed });
  if (!studio) stairRenderer = createStairRenderer({ upImage: images[9], downImage: images[10], bridgeImage: images[11], refinementImage: images[16], groundRenderer: renderer, nodes: motion.nodes });
  pose = studio ? getGroundLocomotionPose(motion) : getRoomPose(motion);
  initialized = true;
  canvas.dataset.ready = 'true';
  loading.hidden = true;
  resize();
  animation = requestAnimationFrame(tick);
} catch (error) {
  loading.textContent = 'La scena non è stata caricata. Ricarica la pagina per riprovare.';
  leftButton.disabled = rightButton.disabled = true;
  console.error(error);
}
