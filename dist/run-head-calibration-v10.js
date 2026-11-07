// V10 registration of the single repaired pose, measured against the six
// approved profile paintings. Apply once when a painting is loaded. Walking
// poses, timing, arms, feet, and all pixels below the collar remain unchanged.
export const HEAD_CALIBRATION = Object.freeze({'run10-3':Object.freeze({x:.9250585480093678,y:1})});

const HEAD_END = .145;
const COLLAR_END = .20;

function influence(y, bodyHeight) {
  const fraction = y / bodyHeight;
  if (fraction <= HEAD_END) return 1;
  if (fraction >= COLLAR_END) return 0;
  const t = (fraction - HEAD_END) / (COLLAR_END - HEAD_END);
  return 1 - t * t * (3 - 2 * t);
}

/**
 * Calibrate a complete painting in place without modifying its PNG source.
 * The crown and horizontal head reference stay fixed. A smooth registration
 * through the neck reaches exact identity at 20% of the character height.
 * No calibration is applied to turn views: their perspective is intentional.
 */
export function normalizeRunHead(imageData, width, { cap, floor, root, id }) {
  const calibration = HEAD_CALIBRATION[id];
  if (!calibration) return false;
  const data = imageData?.data;
  if (!data || !Number.isInteger(width) || width <= 0
    || ![cap, floor, root].every(Number.isFinite) || floor <= cap) return false;

  const height = data.length / (width * 4);
  if (!Number.isInteger(height)) return false;
  const bodyHeight = floor - cap;
  const firstRow = Math.max(0, Math.floor(cap));
  const collarY = cap + COLLAR_END * bodyHeight;
  const lastRow = Math.min(height - 1, Math.ceil(collarY));
  // Only the small head/neck band is copied; no additional complete sprite
  // buffers or animation-frame atlases are retained.
  const source = new Uint8ClampedArray(data.subarray(firstRow * width * 4, (lastRow + 1) * width * 4));

  for (let y = firstRow; y < collarY && y < height; y++) {
    const targetY = y - cap;
    // The vertical mapping is monotone. Its inverse is solved once per row,
    // rather than moving any part of the figure during animation playback.
    let low = targetY;
    let high = Math.min(COLLAR_END * bodyHeight, targetY / calibration.y);
    for (let step = 0; step < 16; step++) {
      const middle = (low + high) * .5;
      const mapped = middle * (1 + (calibration.y - 1) * influence(middle, bodyHeight));
      if (mapped < targetY) low = middle;
      else high = middle;
    }
    const localY = (low + high) * .5;
    const scaleX = 1 + (calibration.x - 1) * influence(localY, bodyHeight);
    const sourceY = cap + localY;
    const y0 = Math.floor(sourceY), y1 = y0 + 1, fy = sourceY - y0;

    for (let x = 0; x < width; x++) {
      const sourceX = root + (x - root) / scaleX;
      const x0 = Math.floor(sourceX), x1 = x0 + 1, fx = sourceX - x0;
      let alpha = 0, red = 0, green = 0, blue = 0;
      // Interpolate premultiplied colour so transparent background pixels
      // cannot introduce dark outlines around hair, ears, or the neck.
      for (let row = 0; row < 2; row++) {
        const sy = row ? y1 : y0;
        if (sy < firstRow || sy > lastRow) continue;
        const wy = row ? fy : 1 - fy;
        for (let column = 0; column < 2; column++) {
          const sx = column ? x1 : x0;
          if (sx < 0 || sx >= width) continue;
          const weight = wy * (column ? fx : 1 - fx);
          const index = ((sy - firstRow) * width + sx) * 4;
          const contribution = source[index + 3] * weight;
          alpha += contribution;
          red += source[index] * contribution;
          green += source[index + 1] * contribution;
          blue += source[index + 2] * contribution;
        }
      }
      const index = (y * width + x) * 4;
      const visible = Math.round(alpha);
      data[index] = visible ? Math.round(red / alpha) : 0;
      data[index + 1] = visible ? Math.round(green / alpha) : 0;
      data[index + 2] = visible ? Math.round(blue / alpha) : 0;
      data[index + 3] = visible;
    }
  }
  return true;
}
