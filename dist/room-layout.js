/**
 * Measured on the unchanged 1644 × 957 interior painting.
 * Coordinates in ROOM_LAYOUT are fractions of that painting, not canvas pixels.
 * The lower route passes in front of the laboratory; the staircase follows a
 * line 60% of the way across its painted treads, behind the foreground rails.
 */
const REFERENCE_WIDTH = 1644;
const REFERENCE_HEIGHT = 957;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const point = (x, y, step, zone) => Object.freeze({
  x: x / REFERENCE_WIDTH, y: y / REFERENCE_HEIGHT, step, zone,
});
const segment = (a, b) => Object.freeze([
  Object.freeze([a[0] / REFERENCE_WIDTH, a[1] / REFERENCE_HEIGHT]),
  Object.freeze([b[0] / REFERENCE_WIDTH, b[1] / REFERENCE_HEIGHT]),
]);

export const ROOM_LAYOUT = Object.freeze({
  referenceWidth: REFERENCE_WIDTH,
  referenceHeight: REFERENCE_HEIGHT,
  min: 90 / REFERENCE_WIDTH,
  max: 1554 / REFERENCE_WIDTH,
  groundY: 800 / REFERENCE_HEIGHT,
  landingY: 687 / REFERENCE_HEIGHT,
  stairStart: 916 / REFERENCE_WIDTH,
  stairEnd: 1065.4 / REFERENCE_WIDTH,
  // The first rise includes the small depth change from the walking floor.
  routeNodes: Object.freeze([
    point(90, 800, -1, 'lower'),
    point(916, 800, -1, 'lower'),
    point(945.6, 771.2, 0, 'stairs'),
    point(976.2, 750, 1, 'stairs'),
    point(1006.4, 730, 2, 'stairs'),
    point(1035.4, 709.2, 3, 'stairs'),
    point(1065.4, 687, 4, 'upper'),
    point(1554, 687, 4, 'upper'),
  ]),
  // Painted nosings: useful for locating an actual sole/shadow, rather than
  // confusing the continuous root route with the discrete physical supports.
  stairSteps: Object.freeze([
    segment([819, 764], [1030, 776]),
    segment([849, 744], [1061, 754]),
    segment([878, 724], [1092, 734]),
    segment([907, 705], [1121, 712]),
    segment([906, 682], [1644, 690]),
  ]),
});

function dimensionsOf(dimensions = {}) {
  return {
    width: Number.isFinite(dimensions.width) && dimensions.width > 0 ? dimensions.width : REFERENCE_WIDTH,
    height: Number.isFinite(dimensions.height) && dimensions.height > 0 ? dimensions.height : REFERENCE_HEIGHT,
  };
}

/** World-space route nodes; stair nodes are sole-contact anchors. */
export function getRoomRoute(dimensions) {
  const { width, height } = dimensionsOf(dimensions);
  return ROOM_LAYOUT.routeNodes.map(node => ({
    ...node, x: node.x * width, y: node.y * height,
  }));
}

/** Lower join plus the five rising supports, without the long flat sections. */
export function getRoomStairs(dimensions) {
  return getRoomRoute(dimensions).slice(1, 7);
}

export function getRoomBounds(dimensions) {
  const { width } = dimensionsOf(dimensions);
  return { min: ROOM_LAYOUT.min * width, max: ROOM_LAYOUT.max * width };
}

/**
 * `floor`/`y`: continuous root height along the route (no per-pixel jumps).
 * `supportY`: nearest authored tread contact; use the returned from/to nodes
 * and progress for a foot that is moving between supports. A stair controller
 * can therefore preserve its planted foot while moving the character root.
 * This function never changes the walk pose, cadence or source illustration.
 */
export function getRoomGround(x, dimensions) {
  const { width, height } = dimensionsOf(dimensions);
  const { min, max } = getRoomBounds({ width, height });
  const position = clamp(Number.isFinite(x) ? x : min, min, max);
  const nodes = getRoomRoute({ width, height });
  let index = 0;
  while (index < nodes.length - 2 && position > nodes[index + 1].x) index++;
  const from = nodes[index], to = nodes[index + 1];
  const progress = clamp((position - from.x) / (to.x - from.x), 0, 1);
  const floor = from.y + (to.y - from.y) * progress;
  const support = progress < .5 ? from : to;
  const zone = position <= ROOM_LAYOUT.stairStart * width ? 'lower'
    : position >= ROOM_LAYOUT.stairEnd * width ? 'upper' : 'stairs';
  return {
    x: position, y: floor, floor, supportY: support.y,
    supportX: support.x, step: support.step, zone,
    slope: (to.y - from.y) / (to.x - from.x),
    from, to, progress, min, max,
  };
}

/** The actual painted line supporting a given tread, in world coordinates. */
export function getRoomTread(index, dimensions) {
  const { width, height } = dimensionsOf(dimensions);
  const endpoints = ROOM_LAYOUT.stairSteps[clamp(Number.isFinite(index) ? Math.round(index) : 0, 0, 4)];
  return endpoints.map(([x, y]) => ({ x: x * width, y: y * height }));
}

// These paths are mattes only. All visible colour and brushwork comes from
// interior.png; no leaf or rail is painted procedurally over the illustration.
function tracePlants(ctx) {
  ctx.beginPath();
  // Tall curled leaf. Its tip is well above the character's feet.
  ctx.moveTo(45, 732);
  ctx.bezierCurveTo(48, 719, 66, 715, 79, 719);
  ctx.bezierCurveTo(89, 720, 95, 724, 100, 735);
  ctx.bezierCurveTo(106, 749, 109, 765, 115, 783);
  ctx.bezierCurveTo(120, 798, 113, 823, 108, 847);
  ctx.bezierCurveTo(105, 874, 103, 916, 113, 957);
  ctx.lineTo(58, 957);
  ctx.bezierCurveTo(58, 907, 62, 860, 68, 824);
  ctx.bezierCurveTo(74, 791, 82, 759, 79, 739);
  ctx.bezierCurveTo(78, 724, 61, 718, 45, 732);
  ctx.closePath();
  // Left leaf entering the image.
  ctx.moveTo(0, 756);
  ctx.bezierCurveTo(28, 758, 38, 786, 44, 806);
  ctx.bezierCurveTo(51, 831, 61, 857, 77, 882);
  ctx.lineTo(81, 934);
  ctx.bezierCurveTo(54, 885, 37, 846, 23, 813);
  ctx.bezierCurveTo(13, 788, 5, 778, 0, 777);
  ctx.closePath();
  // Broad low leaf on the left edge.
  ctx.moveTo(0, 806);
  ctx.bezierCurveTo(32, 818, 63, 846, 91, 887);
  ctx.lineTo(99, 957); ctx.lineTo(0, 957); ctx.closePath();
  // Spear pointing to the back-right.
  ctx.moveTo(81, 939);
  ctx.bezierCurveTo(97, 872, 117, 832, 153, 806);
  ctx.bezierCurveTo(168, 795, 180, 784, 189, 776);
  ctx.bezierCurveTo(174, 797, 159, 816, 148, 839);
  ctx.bezierCurveTo(135, 867, 120, 893, 104, 945);
  ctx.closePath();
  // Wide arching leaf. The hollow underneath remains transparent.
  ctx.moveTo(85, 934);
  ctx.bezierCurveTo(110, 877, 161, 837, 206, 816);
  ctx.bezierCurveTo(222, 808, 242, 807, 256, 813);
  ctx.bezierCurveTo(283, 826, 292, 859, 301, 901);
  ctx.bezierCurveTo(278, 870, 253, 849, 228, 842);
  ctx.bezierCurveTo(200, 846, 163, 864, 137, 885);
  ctx.bezierCurveTo(113, 905, 101, 920, 91, 943);
  ctx.closePath();
  // The adjoining hanging leaf behind the arch.
  ctx.moveTo(215, 830);
  ctx.bezierCurveTo(245, 810, 276, 815, 300, 830);
  ctx.bezierCurveTo(326, 847, 344, 874, 349, 914);
  ctx.bezierCurveTo(332, 880, 314, 860, 284, 850);
  ctx.bezierCurveTo(265, 844, 239, 844, 215, 841);
  ctx.closePath();
  // Low foreground foliage, including the leaves below the floor edge.
  ctx.moveTo(92, 957);
  ctx.bezierCurveTo(112, 910, 160, 869, 194, 862);
  ctx.bezierCurveTo(222, 855, 248, 873, 269, 893);
  ctx.bezierCurveTo(240, 884, 203, 884, 170, 904);
  ctx.bezierCurveTo(209, 884, 253, 893, 286, 909);
  ctx.bezierCurveTo(313, 922, 329, 937, 338, 957);
  ctx.closePath();
  ctx.moveTo(328, 957);
  ctx.bezierCurveTo(349, 926, 384, 893, 416, 890);
  ctx.bezierCurveTo(440, 886, 458, 892, 477, 909);
  ctx.bezierCurveTo(455, 901, 441, 904, 421, 916);
  ctx.bezierCurveTo(459, 901, 492, 908, 516, 924);
  ctx.bezierCurveTo(547, 925, 578, 939, 600, 957);
  ctx.closePath();
  ctx.fill();
}

function traceRails(ctx) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.lineWidth = 8.5;
  // Stair rail and the horizontal rail in front of the door landing.
  ctx.beginPath();
  ctx.moveTo(1031.4, 773);
  ctx.lineTo(1031.4, 649);
  ctx.quadraticCurveTo(1031.4, 644, 1036.3, 641.5);
  ctx.lineTo(1151.5, 580.4);
  ctx.quadraticCurveTo(1154.4, 578.6, 1159.4, 578.8);
  ctx.lineTo(1320.6, 581.1);
  ctx.quadraticCurveTo(1325.0, 581.2, 1325.0, 586.4);
  ctx.lineTo(1324.8, 684);
  ctx.moveTo(1156, 582); ctx.lineTo(1156, 685.8);
  ctx.stroke();
  ctx.lineWidth = 6.2;
  ctx.beginPath();
  ctx.moveTo(1033, 705.8); ctx.lineTo(1156.2, 632.3);
  ctx.lineTo(1317.1, 632.5); ctx.stroke();
  // Right-hand foreground rail; it continues beyond the painting edge.
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(1536, 685);
  ctx.lineTo(1536.1, 586.6);
  ctx.quadraticCurveTo(1536.1, 579.4, 1541.6, 577.3);
  ctx.lineTo(1585.3, 560.7);
  ctx.lineTo(1644, 562);
  ctx.moveTo(1585, 563); ctx.lineTo(1585, 685.5);
  ctx.stroke();
  ctx.lineWidth = 7.2;
  ctx.beginPath();
  ctx.moveTo(1538, 632.6); ctx.lineTo(1585, 627.2);
  ctx.lineTo(1644, 627.4); ctx.stroke();
  // Small fixing plates, also sampled from the source.
  ctx.fillRect(1148.5, 683.4, 16, 5.9);
  ctx.fillRect(1317, 682.2, 15.7, 6.4);
  ctx.fillRect(1527.8, 683.2, 17.8, 6.5);
  ctx.fillRect(1576.9, 683.5, 17.8, 6.3);
}

const overlayCache = new WeakMap();

function createOverlay(background, box, trace) {
  const [x, y, width, height] = box;
  const surface = typeof OffscreenCanvas === 'function'
    ? new OffscreenCanvas(width, height) : document.createElement('canvas');
  surface.width = width; surface.height = height;
  const ctx = surface.getContext('2d');
  ctx.translate(-x, -y);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#fff';
  // The original foreground foliage is softly out of focus. Feather only its
  // matte, leaving source colours and the crisp metalwork untouched.
  if (trace === tracePlants) ctx.filter = 'blur(1.1px)';
  trace(ctx);
  ctx.filter = 'none';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  const sourceWidth = background.naturalWidth || background.width;
  const sourceHeight = background.naturalHeight || background.height;
  ctx.drawImage(background,
    x * sourceWidth / REFERENCE_WIDTH, y * sourceHeight / REFERENCE_HEIGHT,
    width * sourceWidth / REFERENCE_WIDTH, height * sourceHeight / REFERENCE_HEIGHT,
    0, 0, width, height);
  return { surface, box };
}

/**
 * Call after reflection, actor and shadows, with the same world transform used
 * for the background. Cached cropped mattes add about 1.2 MB at source size.
 * Original background pixels remain the only image source for the foreground.
 */
export function drawForeground(ctx, background, options = {}) {
  if (!background) return;
  const { width, height } = dimensionsOf({
    width: options.width ?? background.naturalWidth ?? background.width,
    height: options.height ?? background.naturalHeight ?? background.height,
  });
  let layers = overlayCache.get(background);
  if (!layers) {
    layers = {
      plants: createOverlay(background, [0, 712, 610, 245], tracePlants),
      rails: createOverlay(background, [1024, 552, 620, 230], traceRails),
    };
    overlayCache.set(background, layers);
  }
  const sx = width / REFERENCE_WIDTH, sy = height / REFERENCE_HEIGHT;
  for (const name of ['plants', 'rails']) {
    if (name === 'plants' && options.plants === false) continue;
    if (name === 'rails' && options.railings === false) continue;
    const { surface, box: [x, y, w, h] } = layers[name];
    ctx.drawImage(surface, x * sx, y * sy, w * sx, h * sy);
  }
}
