// Material-only display correction. Original PNGs stay untouched. Gains are
// measured in sRGB against neighbouring approved poses, not a flat repaint.
export const SHIRT_GAIN = {
  'bridge-0': .95714, 'bridge-1': .93373, 'bridge-2': .92389,
  'bridge-3': .91427, 'bridge-4': .93854, 'bridge-5': .92169,
  'bridge-6': .94383, 'supplement-0': .96311, 'supplement-1': .99950,
  'turn-1': 1.00132, 'turn-2': .95144, 'turn-3': .93614,
  'turn-4': .95814, 'turn-5': 1.02230
};

function ramp(low, high, value) {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}

export function gradeShirt(imageData, width, cap, floor, gain = 1) {
  if (gain === 1) return;
  const pixels = imageData.data, height = floor - cap;
  const top = Math.floor(cap + height * .145);
  const bottom = Math.ceil(cap + height * .465);
  for (let y = top; y < bottom; y++) {
    const fraction = (y - cap) / height;
    const vertical = ramp(.145, .19, fraction) * (1 - ramp(.405, .465, fraction));
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (!pixels[i + 3]) continue;
      const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
      const chroma = Math.max(r, g, b) - Math.min(r, g, b);
      // Blue-grey cloth is separate from the warm skin and khaki trousers.
      // Soft colour and height gates preserve brushwork at collar and cuffs.
      const cloth = (1 - ramp(10, 28, r - b)) * (1 - ramp(10, 22, r - g))
        * (1 - ramp(22, 38, chroma)) * ramp(18, 38, .2126 * r + .7152 * g + .0722 * b);
      const factor = 1 + vertical * cloth * (gain - 1);
      pixels[i] = Math.round(r * factor);
      pixels[i + 1] = Math.round(g * factor);
      pixels[i + 2] = Math.round(b * factor);
      // Alpha, silhouette and every pixel below the waist are unchanged.
    }
  }
}
