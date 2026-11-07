// Each animation pose remains a complete painting. Static calibration runs
// once at load; motion never uses an articulated rig or frame dissolves.
import { gradeCostume } from './costume-grade.js?v=6';
import { gradeHair } from './hair-grade.js?v=8';
import { gradeFace } from './face-grade.js?v=8';
import { normalizeHead } from './head-calibration.js?v=6';
import { createFarSidePainting } from './device-occlusion.js?v=6';
const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
const mod = value => ((value % 1) + 1) % 1;
const RESOLUTION = 512;
const PLANE = { left: -.51, top: -1.035, width: 1.02, height: 1.05 };
const WALK_CELLS = [0, 1, 2, 4, 5, 6];
const WALK_TIMES = [0, .1903, .2289, .5, .69625, .7325];
const BRIDGE_TIMES = [.095, .215, .43, .495, .595, .715, .765, .965];

function canvas(width, height) {
  const result = document.createElement('canvas');
  result.width = width; result.height = height;
  return result;
}

function readPainting(atlas, cell, family, columns = 4, rows = 2, corrections = {}) {
  const width = Math.round(atlas.width / columns), height = Math.round(atlas.height / rows);
  const image = canvas(width, height), ctx = image.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(atlas, cell % columns * width, Math.floor(cell / columns) * height, width, height, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height), pixels = imageData.data;
  let cap = height, floor = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (pixels[(y * width + x) * 4 + 3] < 128) continue;
    cap = Math.min(cap, y); floor = Math.max(floor, y);
  }
  if (floor < cap) throw new Error(`Empty ${family} painting ${cell}.`);
  floor++;
  // A common head reference avoids centering on the changing hand/foot reach.
  const headBand = cap + (floor - cap) * .06;
  let left = width, right = -1;
  for (let y = Math.floor(headBand - 3); y <= Math.ceil(headBand + 3); y++) {
    for (let x = 0; x < width; x++) if (pixels[(y * width + x) * 4 + 3] >= 128) {
      left = Math.min(left, x); right = Math.max(right, x);
    }
  }
  const root = (left + right) * .5, scale = floor - cap;
  // Shadows use the actual painted sole. Raised shoes do not receive a dark
  // planted-foot shadow, and no synthetic boot mesh is involved.
  const contacts = [];
  let start = -1, last = -1;
  for (let x = 0; x < width; x++) {
    let solid = false;
    for (let y = Math.max(cap, floor - 7); y < floor; y++) if (pixels[(y * width + x) * 4 + 3] >= 128) { solid = true; break; }
    if (solid) { if (start < 0) start = x; last = x; }
    if (start >= 0 && (!solid && x - last > 3 || x === width - 1)) {
      if (last - start >= 5) contacts.push(((start + last) * .5 - root) / scale);
      start = -1;
    }
  }
  const frame = { image, width, height, cap, floor, root, scale, contacts, family, cell, id: `${family}-${cell}` };
  // Prepare the far-side belt before grading so the restoration receives the
  // same material calibration as the original painting. Geometry stays raw.
  const farSideImage = corrections.devicePatchAtlas && family !== 'turn'
    ? createFarSidePainting(frame, corrections.devicePatchAtlas) : null;
  for (const painting of [image, farSideImage].filter(Boolean)) {
    const context = painting.getContext('2d', { willReadFrequently: true });
    const data = context.getImageData(0, 0, width, height);
    if (corrections.normalizeCostume) gradeCostume(data, width, { ...frame, deviceHidden: painting === farSideImage });
    if (corrections.normalizeHair) gradeHair(data, width, frame);
    if (corrections.normalizeFace) gradeFace(data, width, frame);
    if (corrections.calibrateHead) normalizeHead(data, width, frame);
    context.putImageData(data, 0, 0);
  }
  return { ...frame, farSideImage };
}

function phaseDistance(a, b) {
  const delta = mod(b - a + .5) - .5;
  return delta;
}

export function createSpriteRenderer({ walkImage, turnImage, bridgeImage, extraImage, armBridgeImage, armExtraImage, armStartImage, devicePatchAtlas, normalizeCostume = true, calibrateHead = true, normalizeHair = true, normalizeFace = true, extraColumns = 2, extraRows = 2, extraTimes = [.365, .865, null], extraSettleCell = 3 }) {
  if (!walkImage || !turnImage) throw new Error('Both approved animation atlases are required.');
  const corrections = { normalizeCostume, calibrateHead, normalizeHair, normalizeFace, devicePatchAtlas };
  const walk = WALK_CELLS.map((cell, index) => ({ frame: readPainting(walkImage, cell, 'approved', 4, 2, corrections), time: WALK_TIMES[index] }));
  if (bridgeImage) {
    // Cell 7 repeats the next contact with the wrong arm lead, so it is not
    // used to close the cycle. Dedicated closing poses fill that interval.
    for (let cell = 0; cell < 7; cell++) walk.push({ frame: readPainting(cell === 6 && armBridgeImage ? armBridgeImage : bridgeImage, cell, 'bridge', 4, 2, corrections), time: BRIDGE_TIMES[cell] });
  }
  if (extraImage) {
    for (let cell = 0; cell < Math.min(extraTimes.length, extraColumns * extraRows); cell++) {
      if (!Number.isFinite(extraTimes[cell]) || cell === extraSettleCell) continue;
      const source = cell === 0 && armStartImage ? armStartImage : cell < 2 && armExtraImage ? armExtraImage : extraImage;
      walk.push({ frame: readPainting(source, cell, 'supplement', extraColumns, extraRows, corrections), time: extraTimes[cell] });
    }
  }
  const settle = extraImage && Number.isInteger(extraSettleCell) && extraSettleCell >= 0 && extraSettleCell < extraColumns * extraRows
    ? readPainting(extraImage, extraSettleCell, 'settle', extraColumns, extraRows, corrections) : null;
  walk.sort((a, b) => a.time - b.time);
  const turn = Array.from({ length: 7 }, (_, cell) => readPainting(turnImage, cell, 'turn', 4, 2, corrections));
  const surface = canvas(Math.ceil(PLANE.width * RESOLUTION), Math.ceil(PLANE.height * RESOLUTION));
  const ctx = surface.getContext('2d');
  let cacheKey = '', cacheFrame = null, cacheFacing = 1;
  let gatherAnchor = null, gatherMode = null;

  function chooseWalk(phase) {
    let closest = walk[0], distance = Infinity;
    for (const entry of walk) {
      const d = Math.abs(phaseDistance(phase, entry.time));
      if (d < distance) { closest = entry; distance = d; }
    }
    return closest.frame;
  }

  function select(pose) {
    if (pose.turn) {
      const progress = clamp(pose.turn.progress, 0, 1);
      const angle = pose.turn.sourceFacing === 1 ? progress : 1 - progress;
      return { frame: turn[Math.round(angle * 6)], facing: 1 };
    }
    const strength = clamp(pose.walkWeight ?? (pose.settled ? 0 : 1), 0, 1);
    if (strength < .06) {
      gatherAnchor = null; gatherMode = null;
      return { frame: turn[pose.facing === -1 ? 6 : 0], facing: 1 };
    }
    let phase = mod(pose.walkPhase);
    if (strength < .999) {
      const candidates = [.2289, .7325];
      const nearest = Math.abs(phaseDistance(phase, candidates[0])) < Math.abs(phaseDistance(phase, candidates[1])) ? candidates[0] : candidates[1];
      // Keep the chosen passing foot through one start/stop transition. Small
      // root movement must not switch the collection pose halfway through it.
      if (!pose.mode || gatherAnchor === null || gatherMode !== pose.mode) gatherAnchor = nearest;
      gatherMode = pose.mode;
      if (settle && strength < .30) return { frame: settle, facing: pose.facing };
      const walkingStrength = settle ? clamp((strength - .30) / .70, 0, 1) : strength;
      // Passing -> gathered feet -> idle uses authored whole paintings. The
      // same sequence runs in reverse when setting off; nothing is dissolved.
      phase = mod(phase + phaseDistance(phase, gatherAnchor) * (1 - walkingStrength));
    } else {
      gatherAnchor = null; gatherMode = null;
    }
    return { frame: chooseWalk(phase), facing: pose.facing };
  }

  function compose(pose) {
    const selected = select(pose), frame = selected.frame;
    const key = `${frame.id}:${selected.facing}`;
    if (key === cacheKey) return;
    cacheKey = key; cacheFrame = frame; cacheFacing = selected.facing;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, surface.width, surface.height);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.save();
    ctx.translate(-PLANE.left * RESOLUTION, -PLANE.top * RESOLUTION);
    ctx.scale(selected.facing * RESOLUTION / frame.scale, RESOLUTION / frame.scale);
    ctx.drawImage(selected.facing === -1 && frame.farSideImage ? frame.farSideImage : frame.image, -frame.root, -frame.floor);
    ctx.restore();
  }

  return {
    source: { walkCells: [...WALK_CELLS], walkTimes: walk.map(entry => entry.time), walkFrames: walk.map(entry => entry.frame.id), turnCells: [0, 1, 2, 3, 4, 5, 6], settleCell: settle?.cell ?? null, renderer: 'whole-painted-frames', grade: normalizeCostume ? 'costume-calibrated-v6' : 'original', head: calibrateHead ? 'head-calibrated-v6' : 'original', hair: normalizeHair ? 'hair-calibrated-v8' : 'original', device: devicePatchAtlas ? 'right-hip-v6' : 'mirrored', referenceHeight: 503 },
    getFootprints(pose) {
      compose(pose);
      return cacheFrame.contacts.map(x => ({ x: pose.x + x * pose.height * cacheFacing, y: pose.floor, clearance: 0, contact: 1 }));
    },
    draw(target, pose, { alpha = 1, reflection = false } = {}) {
      if (alpha <= 0) return;
      compose(pose); target.save(); target.globalAlpha *= alpha;
      target.translate(pose.x, pose.floor); target.scale(pose.height, pose.height * (reflection ? -.26 : 1));
      if (reflection) target.filter = 'blur(2px)';
      target.drawImage(surface, PLANE.left, PLANE.top, PLANE.width, PLANE.height); target.restore();
    }
  };
}
