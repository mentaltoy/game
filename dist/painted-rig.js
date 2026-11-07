// Articulated rendering of the approved painted artwork. All patches keep the
// original atlas pixels; only their placement and joint transforms change.
const SOURCE_HEIGHT = 448;
// The next atlas cell has a flat, fully planted boot. Its unmodified pixels
// provide a stable sole for both feet; unlike the contact-frame boots this
// shape does not already contain a painted heel/toe roll.
const BOOT = { heel: [566, 480], toe: [646, 480], ankle: [588.068965517, 449.655172414] };

const SOURCE = {
  body: { hip: [188, 250], shoulder: [187, 129] },
  nearLeg: { hip: [203, 263], knee: [254, 337], ankle: [315, 430], heel: [303, 475], toe: [367, 442] },
  farLeg: { hip: [180, 263], knee: [121, 346], ankle: [79, 432], heel: [50, 455], toe: [126, 476] },
  nearArm: { shoulder: [187, 129], elbow: [237, 200], wrist: [296, 233] },
  farArm: { shoulder: [151, 139], elbow: [125, 213], wrist: [102, 267] }
};

// Boundaries follow individual limbs, not rectangular sprite cells. The
// trousers and shirt retain small overlaps hidden by the waist and elbows.
const MASKS = {
  torso: [[164, 17], [273, 17], [273, 107], [222, 117], [220, 150],
    [223, 179], [231, 196], [224, 213], [227, 239], [216, 264],
    [188, 278], [164, 259], [168, 230], [167, 207], [164, 184],
    [166, 156], [172, 128], [180, 104], [164, 89]],
  farUpperArm: [[144, 132], [162, 134], [155, 165], [143, 197],
    [132, 218], [117, 211], [122, 183], [130, 156]],
  farForearm: [[117, 198], [143, 208], [131, 238], [122, 259],
    [123, 274], [112, 289], [95, 293], [84, 282], [89, 267],
    [97, 258], [105, 231]],
  nearUpperArm: [[176, 111], [203, 110], [220, 132], [229, 160],
    [244, 183], [246, 201], [232, 215], [210, 209], [190, 181],
    [173, 154], [168, 128]],
  nearForearm: [[229, 188], [247, 191], [262, 208], [288, 220],
    [309, 223], [323, 234], [325, 244], [315, 253], [303, 251],
    [290, 242], [270, 233], [244, 221], [226, 208]],
  farThigh: [[169, 247], [200, 252], [201, 276], [182, 303],
    [159, 330], [143, 358], [121, 370], [102, 347], [120, 314],
    [142, 285], [154, 262]],
  farShin: [[112, 329], [145, 343], [136, 369], [120, 393],
    [108, 416], [100, 438], [78, 450], [60, 432], [70, 407],
    [84, 380], [92, 357]],
  nearThigh: [[191, 243], [220, 247], [236, 276], [255, 302],
    [278, 334], [278, 351], [253, 362], [232, 338], [213, 308],
    [197, 292], [180, 268]],
  nearShin: [[242, 321], [274, 331], [287, 354], [302, 381],
    [322, 411], [335, 428], [316, 449], [292, 434], [279, 408],
    [262, 383], [247, 357], [232, 342]],
  farBoot: [[571, 428], [608, 429], [612, 449], [632, 458],
    [648, 460], [652, 469], [647, 482], [563, 482], [558, 467], [562, 444]],
  nearBoot: [[571, 428], [608, 429], [612, 449], [632, 458],
    [648, 460], [652, 469], [647, 482], [563, 482], [558, 467], [562, 444]]
};

function makePatch(atlas, polygon) {
  const contours = typeof polygon[0][0] === 'number' ? [polygon] : polygon;
  const points = contours.flat();
  const minX = Math.floor(Math.min(...points.map(p => p[0])));
  const minY = Math.floor(Math.min(...points.map(p => p[1])));
  const maxX = Math.ceil(Math.max(...points.map(p => p[0])));
  const maxY = Math.ceil(Math.max(...points.map(p => p[1])));
  const image = document.createElement('canvas');
  image.width = maxX - minX + 2;
  image.height = maxY - minY + 2;
  const paint = image.getContext('2d');
  paint.translate(-minX + 1, -minY + 1);
  paint.beginPath();
  for (const contour of contours) {
    contour.forEach(([x, y], index) => index ? paint.lineTo(x, y) : paint.moveTo(x, y));
    paint.closePath();
  }
  paint.clip();
  paint.drawImage(atlas, 0, 0);
  return { image, x: minX - 1, y: minY - 1 };
}

function boneMatrix(fromA, fromB, toA, toB, preserveVolume = false) {
  const sx = fromB[0] - fromA[0], sy = fromB[1] - fromA[1];
  const sourceLength = Math.hypot(sx, sy);
  const dx = toB[0] - toA[0], dy = toB[1] - toA[1];
  const targetLength = Math.max(.00001, Math.hypot(dx, dy));
  const su = [sx / sourceLength, sy / sourceLength];
  const tu = [dx / targetLength, dy / targetLength];
  const along = targetLength / sourceLength;
  // Extending a trouser segment without its width made the original rig look
  // slender. Preserve its painted aspect ratio when it needs to get longer;
  // short segments keep their original cloth width instead of pinching it.
  const across = preserveVolume ? Math.max(1 / SOURCE_HEIGHT, along) : 1 / SOURCE_HEIGHT;
  const a = tu[0] * along * su[0] + tu[1] * across * su[1];
  const b = tu[1] * along * su[0] - tu[0] * across * su[1];
  const c = tu[0] * along * su[1] - tu[1] * across * su[0];
  const d = tu[1] * along * su[1] + tu[0] * across * su[0];
  return [a, b, c, d, toA[0] - a * fromA[0] - c * fromA[1], toA[1] - b * fromA[0] - d * fromA[1]];
}

function drawBone(ctx, patch, sourceA, sourceB, targetA, targetB) {
  ctx.save();
  ctx.transform(...boneMatrix(sourceA, sourceB, targetA, targetB));
  ctx.drawImage(patch.image, patch.x, patch.y);
  ctx.restore();
}

function makeLegMesh(atlas, side) {
  const loosen = contour => {
    const center = contour.reduce((sum, point) => [sum[0] + point[0] / contour.length, sum[1] + point[1] / contour.length], [0, 0]);
    return contour.map(point => {
      const dx = point[0] - center[0], dy = point[1] - center[1], length = Math.hypot(dx, dy) || 1;
      return [point[0] + dx / length * 3.5, point[1] + dy / length * 3.5];
    });
  };
  const patch = makePatch(atlas, [loosen(MASKS[`${side}Thigh`]), loosen(MASKS[`${side}Shin`])]);
  const pixels = patch.image.getContext('2d').getImageData(0, 0, patch.image.width, patch.image.height).data;
  const columns = Math.ceil(patch.image.width / 17);
  const rows = Math.ceil(patch.image.height / 17);
  const vertices = [];
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    vertices.push([patch.x + col * patch.image.width / columns, patch.y + row * patch.image.height / rows]);
  }
  const triangles = [];
  for (let row = 0; row < rows; row++) for (let col = 0; col < columns; col++) {
    const x0 = Math.floor(col * patch.image.width / columns), x1 = Math.ceil((col + 1) * patch.image.width / columns);
    const y0 = Math.floor(row * patch.image.height / rows), y1 = Math.ceil((row + 1) * patch.image.height / rows);
    let visible = false;
    for (let y = y0; y < y1 && !visible; y++) for (let x = x0; x < x1; x++) {
      if (pixels[(y * patch.image.width + x) * 4 + 3] > 4) { visible = true; break; }
    }
    if (!visible) continue;
    const a = row * (columns + 1) + col, b = a + 1, c = a + columns + 1, d = c + 1;
    triangles.push([a, b, c], [b, d, c]);
  }
  const source = SOURCE[`${side}Leg`];
  const thighVector = [source.knee[0] - source.hip[0], source.knee[1] - source.hip[1]];
  const shinVector = [source.ankle[0] - source.knee[0], source.ankle[1] - source.knee[1]];
  const thighLength = Math.hypot(...thighVector), shinLength = Math.hypot(...shinVector);
  const tangent = [thighVector[0] / thighLength + shinVector[0] / shinLength,
    thighVector[1] / thighLength + shinVector[1] / shinLength];
  const tangentLength = Math.hypot(...tangent);
  tangent[0] /= tangentLength; tangent[1] /= tangentLength;
  const weights = vertices.map(vertex => {
    const distance = (vertex[0] - source.knee[0]) * tangent[0] + (vertex[1] - source.knee[1]) * tangent[1];
    const t = Math.max(0, Math.min(1, (distance + 42) / 84));
    return t * t * (3 - 2 * t);
  });
  const centers = vertices.map(vertex => {
    const distance = (vertex[0] - source.knee[0]) * tangent[0] + (vertex[1] - source.knee[1]) * tangent[1];
    return [source.knee[0] + tangent[0] * distance, source.knee[1] + tangent[1] * distance];
  });
  return { patch, vertices, triangles, weights, centers };
}

function mapPoint(matrix, point) {
  return [matrix[0] * point[0] + matrix[2] * point[1] + matrix[4],
    matrix[1] * point[0] + matrix[3] * point[1] + matrix[5]];
}

function triangleMatrix(source, target) {
  const [p, q, r] = source, [a, b, c] = target;
  const sx1 = q[0] - p[0], sy1 = q[1] - p[1], sx2 = r[0] - p[0], sy2 = r[1] - p[1];
  const tx1 = b[0] - a[0], ty1 = b[1] - a[1], tx2 = c[0] - a[0], ty2 = c[1] - a[1];
  const det = sx1 * sy2 - sx2 * sy1;
  const m0 = (tx1 * sy2 - tx2 * sy1) / det, m1 = (ty1 * sy2 - ty2 * sy1) / det;
  const m2 = (tx2 * sx1 - tx1 * sx2) / det, m3 = (ty2 * sx1 - ty1 * sx2) / det;
  return [m0, m1, m2, m3, a[0] - m0 * p[0] - m2 * p[1], a[1] - m1 * p[0] - m3 * p[1]];
}

function drawSkin(ctx, mesh, source, target) {
  const thigh = boneMatrix(source.hip, source.knee, target.hip, target.knee, true);
  const shin = boneMatrix(source.knee, source.ankle, target.knee, target.ankle, true);
  const points = mesh.vertices.map((point, index) => {
    const a = mapPoint(thigh, point), b = mapPoint(shin, point), weight = mesh.weights[index];
    const ca = mapPoint(thigh, mesh.centers[index]), cb = mapPoint(shin, mesh.centers[index]);
    const center = [ca[0] + (cb[0] - ca[0]) * weight, ca[1] + (cb[1] - ca[1]) * weight];
    const va = [a[0] - ca[0], a[1] - ca[1]], vb = [b[0] - cb[0], b[1] - cb[1]];
    const transverse = [va[0] + (vb[0] - va[0]) * weight, va[1] + (vb[1] - va[1]) * weight];
    const actual = Math.hypot(...transverse);
    const expected = Math.hypot(...va) * (1 - weight) + Math.hypot(...vb) * weight;
    // Linear skin blending otherwise loses width at a bent knee. Preserve
    // the interpolated cloth cross-section without adding a rigid knee cap.
    const volume = actual > .000001 ? Math.min(1.4, expected / actual) : 1;
    return [center[0] + transverse[0] * volume, center[1] + transverse[1] * volume];
  });
  for (const triangle of mesh.triangles) {
    const from = triangle.map(index => mesh.vertices[index]), to = triangle.map(index => points[index]);
    const center = [(to[0][0] + to[1][0] + to[2][0]) / 3, (to[0][1] + to[1][1] + to[2][1]) / 3];
    ctx.save(); ctx.beginPath();
    to.forEach((point, index) => {
      const dx = point[0] - center[0], dy = point[1] - center[1];
      const expansion = .0008 / Math.max(.00001, Math.hypot(dx, dy));
      const x = point[0] + dx * expansion, y = point[1] + dy * expansion;
      if (index) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    ctx.closePath(); ctx.clip();
    ctx.transform(...triangleMatrix(from, to));
    ctx.drawImage(mesh.patch.image, mesh.patch.x, mesh.patch.y);
    ctx.restore();
  }
}

function drawFoot(ctx, patch, source, target) {
  // Three-point mapping keeps heel, toe and ankle attached to their exact pose
  // coordinates. A planted heel/toe therefore cannot drift with body bobbing.
  const sx1 = source.toe[0] - source.heel[0], sy1 = source.toe[1] - source.heel[1];
  const sx2 = source.ankle[0] - source.heel[0], sy2 = source.ankle[1] - source.heel[1];
  const tx1 = target.toe[0] - target.heel[0], ty1 = target.toe[1] - target.heel[1];
  const tx2 = target.ankle[0] - target.heel[0], ty2 = target.ankle[1] - target.heel[1];
  const determinant = sx1 * sy2 - sx2 * sy1;
  const a = (tx1 * sy2 - tx2 * sy1) / determinant;
  const b = (ty1 * sy2 - ty2 * sy1) / determinant;
  const c = (tx2 * sx1 - tx1 * sx2) / determinant;
  const d = (ty2 * sx1 - ty1 * sx2) / determinant;
  ctx.save();
  ctx.transform(a, b, c, d, target.heel[0] - a * source.heel[0] - c * source.heel[1], target.heel[1] - b * source.heel[0] - d * source.heel[1]);
  ctx.drawImage(patch.image, patch.x, patch.y);
  ctx.restore();
}

function makeTurnAtlas(image, torsoPatch) {
  const surface = document.createElement('canvas');
  surface.width = image.width; surface.height = image.height;
  const paint = surface.getContext('2d', { willReadFrequently: true });
  paint.drawImage(image, 0, 0);
  const pixels = paint.getImageData(0, 0, image.width, image.height).data;
  const frames = [];
  for (let column = 0; column < 5; column++) {
    const left = Math.round(column * image.width / 5), right = Math.round((column + 1) * image.width / 5);
    let minX = right, maxX = left, minY = image.height, maxY = 0;
    for (let y = 0; y < image.height; y++) for (let x = left; x < right; x++) {
      if (pixels[(y * image.width + x) * 4 + 3] >= 128) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
    if (maxY <= minY) throw new Error('A full-body turn pose is missing.');
    frames.push({ x: Math.max(left, minX - 2), y: Math.max(0, minY - 2),
      width: Math.min(right - 1, maxX + 2) - Math.max(left, minX - 2) + 1,
      height: Math.min(image.height - 1, maxY + 2) - Math.max(0, minY - 2) + 1,
      baseline: maxY + 1, pivot: (minX + maxX) / 2, figureHeight: maxY - minY + 1 });
  }
  const heights = frames.map(frame => frame.figureHeight).sort((a, b) => a - b);
  const torsoPixels = torsoPatch.image.getContext('2d').getImageData(0, 0, torsoPatch.image.width, torsoPatch.image.height).data;
  let headY = Infinity, headX = SOURCE.body.shoulder[0];
  for (let y = 0; y < torsoPatch.image.height && headY === Infinity; y++) {
    let xSum = 0, count = 0;
    for (let x = 0; x < torsoPatch.image.width; x++) {
      if (torsoPixels[(y * torsoPatch.image.width + x) * 4 + 3] >= 128) { xSum += x; count++; }
    }
    if (count) { headY = y + torsoPatch.y; headX = xSum / count + torsoPatch.x; }
  }
  const neutralTorso = boneMatrix(SOURCE.body.hip, SOURCE.body.shoulder, [0, -.520], [0, -.792]);
  const figureHeight = -mapPoint(neutralTorso, [headX, headY])[1];
  return { image, frames, referenceHeight: heights[2], figureHeight };
}

function drawTurn(ctx, atlas, pose, options) {
  const progress = Math.max(0, Math.min(1, pose.turn.progress));
  const forwardIndex = Math.min(4, Math.floor(progress * 5));
  const index = pose.turn.sourceFacing === 1 ? forwardIndex : 4 - forwardIndex;
  const frame = atlas.frames[index];
  // One scale for all five complete paintings preserves the original body
  // volumes. The three-quarter and frontal frames are real painted poses.
  const scale = pose.height * atlas.figureHeight / atlas.referenceHeight;
  // The complete side-view paintings have a different alpha-box centre from
  // the rig's anatomical hip pivot. Match the profile's head and feet at both
  // ends, then ease through a centred frontal pose instead of popping sideways.
  const orientation = pose.turn.sourceFacing === 1 ? progress : 1 - progress;
  const profileOffset = Math.cos(Math.PI * orientation) * pose.height * .052;
  ctx.save();
  ctx.globalAlpha *= options.alpha ?? 1;
  ctx.translate(pose.x + profileOffset, pose.floor);
  if (options.reflection) { ctx.scale(1, -.26); ctx.filter = 'blur(2px)'; }
  ctx.drawImage(atlas.image, frame.x, frame.y, frame.width, frame.height,
    (frame.x - frame.pivot) * scale, (frame.y - frame.baseline) * scale,
    frame.width * scale, frame.height * scale);
  ctx.restore();
}

export function createPaintedRig(atlasImage, { turnImage = null } = {}) {
  const patches = Object.fromEntries(Object.entries(MASKS).map(([name, mask]) => [name, makePatch(atlasImage, mask)]));
  const legMeshes = { near: makeLegMesh(atlasImage, 'near'), far: makeLegMesh(atlasImage, 'far') };
  const turnAtlas = turnImage ? makeTurnAtlas(turnImage, patches.torso) : null;
  // Bake each continuous pose once. The normal figure and its floor reflection
  // reuse this transparent surface, avoiding a second skinning pass per frame.
  const poseCanvas = document.createElement('canvas');
  const resolution = 512;
  poseCanvas.width = resolution;
  poseCanvas.height = Math.ceil(resolution * 1.24);
  const poseContext = poseCanvas.getContext('2d');
  let cachedPose = null;

  function drawArm(ctx, side, target) {
    const source = SOURCE[`${side}Arm`];
    drawBone(ctx, patches[`${side}UpperArm`], source.shoulder, source.elbow, target.shoulder, target.elbow);
    drawBone(ctx, patches[`${side}Forearm`], source.elbow, source.wrist, target.elbow, target.wrist);
  }
  function drawLeg(ctx, side, target) {
    const source = SOURCE[`${side}Leg`];
    drawSkin(ctx, legMeshes[side], source, target);
    drawFoot(ctx, patches[`${side}Boot`], BOOT, target);
  }

  return {
    draw(ctx, pose, options = {}) {
      const { alpha = 1, reflection = false } = options;
      if (alpha <= 0) return;
      if (turnAtlas && pose.turn) {
        drawTurn(ctx, turnAtlas, pose, options);
        return;
      }
      if (cachedPose !== pose) {
        poseContext.setTransform(1, 0, 0, 1, 0, 0);
        poseContext.clearRect(0, 0, poseCanvas.width, poseCanvas.height);
        poseContext.setTransform(resolution, 0, 0, resolution, resolution * .5, resolution * 1.13);
        drawArm(poseContext, 'far', pose.farArm);
        drawLeg(poseContext, 'far', pose.farLeg);
        drawLeg(poseContext, 'near', pose.nearLeg);
        drawBone(poseContext, patches.torso, SOURCE.body.hip, SOURCE.body.shoulder, pose.body.hip, pose.body.shoulder);
        drawArm(poseContext, 'near', pose.nearArm);
        cachedPose = pose;
      }
      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(pose.x, pose.floor);
      ctx.scale(pose.height * pose.facing, pose.height * (reflection ? -.26 : 1));
      if (reflection) ctx.filter = 'blur(2px)';
      ctx.drawImage(poseCanvas, -.5, -1.13, 1, poseCanvas.height / resolution);
      ctx.restore();
    }
  };
}
