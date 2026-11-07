// Shared authoring dimensions. All values scale with the character, never
// independently to fit an arbitrary painted stair. Entry/exit are separate.
export const STAIR_STANDARD = Object.freeze({
  referenceHeight: 266,
  tread: 30,
  rise: 21,
  stepSeconds: .45,
});

export function createStandardStairNodes({anchor,steps=2,height=266}) {
  if (!anchor || ![anchor.x,anchor.y,height].every(Number.isFinite)
      || height<=0 || !Number.isInteger(steps) || steps<1) {
    throw new Error('A standard staircase needs an anchor, a positive height and whole steps.');
  }
  const scale=height/STAIR_STANDARD.referenceHeight;
  // Node 0 is the trailing foot; node 1 is the first weight-bearing foot.
  return Array.from({length:steps+2},(_,i)=>Object.freeze({
    x:anchor.x+(i-1)*STAIR_STANDARD.tread*scale,
    y:anchor.y-(i-1)*STAIR_STANDARD.rise*scale,
  }));
}
