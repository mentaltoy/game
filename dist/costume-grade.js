// Display-only white balance for the two painted costume materials.
// Input must be the original, ungraded ImageData. Never stack this over V5.
// Per-channel multiplication preserves brushwork; alpha and geometry are untouched.
export const COSTUME_REFERENCE = {"shirt":[100.6886168416642,96.42329377403135,99.88758102878833],"pants":[140.9524644275798,115.02304954019253,87.37271444505309]};
export const COSTUME_GAIN = {
  "approved-0": {
    "shirt": [
      1.07158,
      1.06244,
      1.05214
    ],
    "pants": [
      1.01837,
      1.01398,
      0.99968
    ]
  },
  "approved-1": {
    "shirt": [
      1.05565,
      1.04924,
      1.04206
    ],
    "pants": [
      1.00853,
      1.0111,
      1.01104
    ]
  },
  "approved-2": {
    "shirt": [
      1.01235,
      1.01019,
      1.0052
    ],
    "pants": [
      0.96736,
      0.97419,
      0.97984
    ]
  },
  "approved-4": {
    "shirt": [
      0.98795,
      0.98745,
      0.98866
    ],
    "pants": [
      0.99328,
      0.99411,
      0.99701
    ]
  },
  "approved-5": {
    "shirt": [
      0.97699,
      0.97862,
      0.9838
    ],
    "pants": [
      1.00682,
      1.00436,
      1.00139
    ]
  },
  "approved-6": {
    "shirt": [
      0.98795,
      0.99001,
      0.99485
    ],
    "pants": [
      0.99086,
      0.99568,
      1.00032
    ]
  },
  "bridge-0": {
    "shirt": [
      1.01343,
      1.01352,
      1.01543
    ],
    "pants": [
      0.96154,
      0.94941,
      0.91874
    ]
  },
  "bridge-1": {
    "shirt": [
      0.95844,
      0.95828,
      0.96574
    ],
    "pants": [
      0.94866,
      0.9364,
      0.90737
    ]
  },
  "bridge-2": {
    "shirt": [
      0.91675,
      0.92218,
      0.93534
    ],
    "pants": [
      0.94553,
      0.932,
      0.90381
    ]
  },
  "bridge-3": {
    "shirt": [
      0.90125,
      0.90708,
      0.92139
    ],
    "pants": [
      0.95695,
      0.94231,
      0.90951
    ]
  },
  "bridge-4": {
    "shirt": [
      0.91967,
      0.92417,
      0.93336
    ],
    "pants": [
      0.93242,
      0.92149,
      0.89547
    ]
  },
  "bridge-5": {
    "shirt": [
      0.9028,
      0.90891,
      0.92327
    ],
    "pants": [
      0.93566,
      0.92477,
      0.90043
    ]
  },
  "bridge-6": {
    "shirt": [
      0.92841,
      0.94585,
      0.97087
    ],
    "pants": [
      0.93071,
      0.93285,
      0.88107
    ]
  },
  "supplement-0": {
    "shirt": [
      0.9414,
      0.96841,
      0.9817
    ],
    "pants": [
      0.93147,
      0.91448,
      0.85686
    ]
  },
  "supplement-1": {
    "shirt": [
      1.00943,
      1.0301,
      1.03171
    ],
    "pants": [
      0.97837,
      0.96778,
      0.91864
    ]
  },
  "turn-0": {
    "shirt": [
      0.98551,
      0.98902,
      0.9943
    ],
    "pants": [
      0.93701,
      0.92954,
      0.9044
    ]
  },
  "turn-1": {
    "shirt": [
      0.98928,
      0.9894,
      0.99428
    ],
    "pants": [
      0.95041,
      0.94244,
      0.91426
    ]
  },
  "turn-2": {
    "shirt": [
      0.94053,
      0.94291,
      0.94985
    ],
    "pants": [
      0.97037,
      0.9596,
      0.92366
    ]
  },
  "turn-3": {
    "shirt": [
      0.92134,
      0.92608,
      0.93841
    ],
    "pants": [
      0.98142,
      0.96571,
      0.9241
    ]
  },
  "turn-4": {
    "shirt": [
      0.93624,
      0.94507,
      0.95861
    ],
    "pants": [
      0.97927,
      0.96268,
      0.92511
    ]
  },
  "turn-5": {
    "shirt": [
      1.00022,
      1.00237,
      1.009
    ],
    "pants": [
      0.96005,
      0.94756,
      0.91684
    ]
  },
  "turn-6": {
    "shirt": [
      0.97516,
      0.97863,
      0.98605
    ],
    "pants": [
      0.93151,
      0.92324,
      0.89792
    ]
  },
  "settle-3": {
    "shirt": [
      0.99894,
      1.01461,
      1.00904
    ],
    "pants": [
      0.95825,
      0.95999,
      0.93554
    ]
  }
};

// Source-cell coordinates: conservative skin, equipment and boot exclusions.
const PROTECTED = {
  "approved-0": {"arms":[[125,214,110,299,19],[216,215,277,276,18]],"boots":[[47,455,145,524],[237,449,341,523]],"basis":[362,543],"gear":[171,207,210,261]},
  "approved-1": {"arms":[[133,215,142,296,19],[214,217,259,282,17]],"boots":[[46,419,123,510],[176,465,270,523]],"basis":[362,543],"gear":[171,207,210,261]},
  "approved-2": {"arms":[[164,216,182,294,20],[213,217,244,292,16]],"boots":[[77,410,145,505],[156,465,246,524]],"basis":[362,543],"gear":[171,207,210,261]},
  "approved-4": {"arms":[[182,200,269,257,20],[124,215,98,291,19]],"boots":[[35,460,139,525],[240,449,341,524]],"basis":[362,543],"gear":[171,207,210,261]},
  "approved-5": {"arms":[[184,202,273,261,20],[128,217,109,292,19]],"boots":[[46,418,124,513],[172,465,269,525]],"basis":[362,543],"gear":[171,207,210,261]},
  "approved-6": {"arms":[[175,214,247,290,19],[139,217,155,296,18]],"boots":[[75,407,147,505],[156,465,244,525]],"basis":[362,543],"gear":[171,207,210,261]},
  "bridge-0": {"arms":[[124,213,107,300,20],[217,212,279,274,19]],"boots":[[24,423,111,522],[203,463,309,526]],"basis":[362,543],"gear":[171,207,210,261]},
  "bridge-1": {"arms":[[156,214,171,294,19],[213,214,239,283,17]],"boots":[[85,405,147,505],[157,463,250,524]],"basis":[362,543],"gear":[171,207,210,261]},
  "bridge-2": {"arms":[[188,205,262,267,21],[126,215,100,282,19]],"boots":[[68,455,168,525],[184,417,280,493]],"basis":[362,543],"gear":[171,207,210,261]},
  "bridge-3": {"arms":[[187,205,271,258,20],[126,215,99,283,19]],"boots":[[33,458,139,525],[239,447,342,524]],"basis":[362,543],"gear":[171,207,210,261]},
  "bridge-4": {"arms":[[186,205,270,258,20],[126,216,98,288,19]],"boots":[[20,429,110,524],[207,463,316,526]],"basis":[362,543],"gear":[171,207,210,261]},
  "bridge-5": {"arms":[[181,213,254,269,20],[131,216,108,290,19]],"boots":[[73,414,142,515],[155,463,253,526]],"basis":[362,543],"gear":[171,207,210,261]},
  "bridge-6": {"arms":[[157,215,182,294,20],[211,235,226,282,16]],"boots":[[77,408,147,507],[152,465,243,528]],"basis":[362,543],"gear":[171,207,210,261]},
  "supplement-0": {"basis":[543,724],"arms":[[238,293,319,375,25]],"boots":[[133,641,273,722],[218,596,347,687]],"gear":[230,293,271,357]},
  "supplement-1": {"basis":[543,724],"arms":[[181,291,169,410,27],[294,287,368,365,23]],"boots":[[121,640,263,722],[295,602,431,683]],"gear":[233,292,276,359]},
  "turn-0": {"arms":[[163,213,189,298,21],[205,215,212,298,13]],"boots":[[125,456,247,528]],"gear":[177,209,210,261],"basis":[362,543]},
  "turn-1": {"arms":[[143,215,158,298,20],[211,215,225,297,16]],"boots":[[117,456,251,528]],"gear":[156,212,187,264],"basis":[362,543]},
  "turn-2": {"arms":[[129,216,143,299,20],[216,215,232,298,17]],"boots":[[114,456,252,528]],"gear":[144,212,176,265],"basis":[362,543]},
  "turn-3": {"arms":[[126,214,131,299,22],[231,214,227,299,22]],"boots":[[111,456,253,528]],"gear":[144,212,177,265],"basis":[362,543]},
  "turn-4": {"arms":[[133,217,122,299,18],[234,214,226,299,22]],"boots":[[109,456,256,530]],"gear":[210,212,241,265],"basis":[362,543]},
  "turn-5": {"arms":[[146,217,138,300,17],[225,215,211,299,22]],"boots":[[109,456,255,530]],"gear":[204,211,236,265],"basis":[362,543]},
  "turn-6": {"arms":[[151,216,143,300,14],[208,215,181,300,22]],"boots":[[107,456,247,529]],"gear":[155,211,187,265],"basis":[362,543]},
  "settle-3": {"basis":[543,724],"arms":[[240,293,274,410,27],[316,304,320,410,17]],"boots":[[162,641,347,724]],"gear":[260,291,305,364]}
};

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
function ramp(low, high, value) {
  const t = clamp((value - low) / (high - low), 0, 1);
  return t * t * (3 - 2 * t);
}
function capsuleProtection(x, y, shape, feather) {
  const [ax, ay, bx, by, radius] = shape;
  const dx = bx - ax, dy = by - ay;
  const t = clamp(((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1), 0, 1);
  const distance = Math.hypot(x - ax - t * dx, y - ay - t * dy);
  return 1 - ramp(radius, radius + feather, distance);
}
function rectangleProtection(x, y, shape, feather) {
  const [left, top, right, bottom] = shape;
  const dx = Math.max(left - x, 0, x - right), dy = Math.max(top - y, 0, y - bottom);
  return 1 - ramp(0, feather, Math.hypot(dx, dy));
}

/** Grade original painted costume pixels once, when loading an atlas cell.
 * frame is { cap, floor, root, id, deviceHidden? }; id matches COSTUME_GAIN.
 * deviceHidden removes only the equipment exclusion for a restored far-side patch.
 * The authored left-profile turn-6 also has no visible device to protect.
 * Unknown poses are intentionally unchanged until calibrated and inspected.
 * Masks favor skin/boot protection over correcting an ambiguous cuff edge.
 */
export function gradeCostume(imageData, width, { cap, floor, root, id, deviceHidden = false }) {
  const gains = COSTUME_GAIN[id], protectedRegions = PROTECTED[id];
  if (!gains || !protectedRegions) return;
  const pixels = imageData?.data, imageHeight = pixels?.length / (width * 4), height = floor - cap;
  if (!pixels || !Number.isInteger(width) || width <= 0 || !Number.isInteger(imageHeight)
    || ![cap, floor, root].every(Number.isFinite) || height <= 0) return;
  const [basisWidth, basisHeight] = protectedRegions.basis;
  const sx = width / basisWidth, sy = imageHeight / basisHeight;
  const arms = protectedRegions.arms.map(([ax,ay,bx,by,r]) => [ax*sx,ay*sy,bx*sx,by*sy,r*Math.max(sx,sy)]);
  const rectangles = [...protectedRegions.boots, ...((deviceHidden || id === 'turn-6') ? [] : [protectedRegions.gear])]
    .map(([left,top,right,bottom]) => [left*sx,top*sy,right*sx,bottom*sy]);
  const feather = Math.max(1.5, height * .007);
  const top = Math.max(0, Math.floor(cap + height * .145));
  const bottom = Math.min(imageHeight, Math.ceil(cap + height * .945));
  for (let y = top; y < bottom; y++) {
    const fraction = (y - cap) / height;
    const shirtVertical = ramp(.145, .19, fraction) * (1 - ramp(.385, .425, fraction));
    const pantsVertical = ramp(.435, .48, fraction) * (1 - ramp(.90, .945, fraction));
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      if (!pixels[i+3] || Math.abs(x-root) > height*.54) continue;
      const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
      const maximum = Math.max(r,g,b), chroma = maximum-Math.min(r,g,b);
      const luminance = .2126*r+.7152*g+.0722*b;
      const saturation = chroma / Math.max(1,maximum);
      const shirtColor = (1-ramp(10,28,r-b)) * (1-ramp(10,22,r-g))
        * (1-ramp(22,38,chroma)) * ramp(18,38,luminance);
      const pantsColor = ramp(4,12,r-g) * ramp(5,14,g-b) * ramp(10,20,chroma)
        * ramp(35,58,luminance) * (1-ramp(.56,.68,saturation));
      let shirt = shirtVertical*shirtColor, pants = pantsVertical*pantsColor;
      if (shirt < .00001 && pants < .00001) continue;
      let protection = 0;
      for (const shape of arms) protection = Math.max(protection,capsuleProtection(x,y,shape,feather));
      for (const shape of rectangles) protection = Math.max(protection,rectangleProtection(x,y,shape,feather));
      shirt *= 1-protection; pants *= 1-protection;
      for (let channel=0;channel<3;channel++) {
        const factor = 1 + shirt*(gains.shirt[channel]-1) + pants*(gains.pants[channel]-1);
        pixels[i+channel] = Math.round(pixels[i+channel]*factor);
      }
      // Deliberately never write alpha, positions, silhouette or pixel count.
    }
  }
}
