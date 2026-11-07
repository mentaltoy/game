import assert from 'node:assert/strict';
import { createGait, advanceGait, getGaitPose } from '../dist/gait.js';

const make = () => createGait({ x: 500, min: 200, max: 900, height: 267, floor: 800 });
const simulate = (state, input, seconds, hz = 60, inspect) => {
  const frames = Math.round(seconds * hz);
  for (let i = 0; i < frames; i++) { advanceGait(state, input, 1 / hz); inspect?.(state); }
  return state;
};
const world = (pose, point) => [pose.x + point[0] * pose.facing * pose.height, pose.floor + point[1] * pose.height];
const checkPose = state => {
  const pose = getGaitPose(state);
  for (const leg of [pose.nearLeg, pose.farLeg]) {
    for (const name of ['hip','knee','ankle','heel','toe']) assert(leg[name].every(Number.isFinite));
    const heel = world(pose, leg.heel), toe = world(pose, leg.toe);
    assert(heel[1] <= state.floor + 1e-7, `Heel penetrates ${heel[1] - state.floor}`);
    assert(toe[1] <= state.floor + 1e-7, `Toe penetrates ${toe[1] - state.floor}`);
    if (leg.contact) {
      const contact = leg.contact === 'toe' ? toe : heel;
      assert(Math.abs(contact[0] - leg.anchorX) < 1e-7, 'Contact slips off its world anchor');
      assert(Math.abs(contact[1] - state.floor) < 1e-7, 'Contact floats above floor');
    }
    const thigh = Math.hypot(leg.knee[0] - leg.hip[0], leg.knee[1] - leg.hip[1], leg.kneeDepth);
    const shin = Math.hypot(leg.ankle[0] - leg.knee[0], leg.ankle[1] - leg.knee[1], leg.kneeDepth);
    assert(Math.abs(thigh - .235) < 1e-6, `Thigh stretches ${thigh}`);
    assert(Math.abs(shin - .235) < 1e-6, `Shin stretches ${shin}`);
  }
};
let count = 0;
const test = (name, fn) => { fn(); count++; console.log(`PASS ${name}`); };

test('stationary pose is settled and has exact grounded contacts', () => {
  const state = make(), before = JSON.stringify(getGaitPose(state));
  simulate(state, 0, 1, 60, checkPose);
  assert(state.settled); assert.equal(state.x, 500); assert.equal(JSON.stringify(getGaitPose(state)), before);
});
test('walking alternates support and locks planted feet in world coordinates', () => {
  const state = make();
  let nearSwing = 0, farSwing = 0;
  simulate(state, 1, 2, 120, s => {
    checkPose(s);
    if (s.feet[0].swing) nearSwing++;
    if (s.feet[1].swing) farSwing++;
    assert(!(s.feet[0].swing && s.feet[1].swing), 'Both feet airborne during walk');
  });
  assert(nearSwing && farSwing); assert(state.x > 700);
});
test('support extends at midstance, recovery stays low and arms oppose', () => {
  const state = make(); let extended = 0, maxLift = 0, peakArm = 0;
  simulate(state, 1, 2, 240, s => {
    const p = getGaitPose(s);
    for (const leg of [p.nearLeg, p.farLeg]) {
      if (leg.contact && Math.abs(leg.ankle[0] - leg.hip[0]) < .04) {
        const extension = Math.hypot(leg.ankle[0] - leg.hip[0], leg.ankle[1] - leg.hip[1]) / .47;
        if (extension > .98) extended++;
      }
      if (!leg.contact) maxLift = Math.max(maxLift, -leg.heel[1], -leg.toe[1]);
    }
    const a = p.nearArm.elbow[0] - p.nearArm.shoulder[0];
    const b = p.farArm.elbow[0] - p.farArm.shoulder[0];
    assert(Math.abs(a + b) < 1e-8, 'Arm swings do not oppose');
    peakArm = Math.max(peakArm, Math.abs(Math.asin(a / .145)));
  });
  assert(extended > 10, 'Support never extends sufficiently');
  assert(maxLift < .041, `Foot recovery too high: ${maxLift}`);
  assert(peakArm > .33 && peakArm <= .421, `Arm amplitude: ${peakArm}`);
});
test('release finishes the airborne foot then settles without root skating', () => {
  for (const elapsed of [.1, .25, .4, .55, .7, .9]) {
    const state = make();
    simulate(state, 1, elapsed, 120, checkPose);
    simulate(state, 0, 1.8, 120, checkPose);
    assert(state.settled, `Failed settling after ${elapsed}s`);
    assert.equal(state.velocity, 0);
    const x = state.x; simulate(state, 0, .5, 120, checkPose); assert.equal(state.x, x);
  }
});
test('reversal turns one airborne foot and preserves the supporting contact', () => {
  const state = make(); simulate(state, 1, .75, 120, checkPose);
  const before = state.x; let facingChanged = false, previousPose = getGaitPose(state);
  simulate(state, -1, 2, 120, s => {
    checkPose(s);
    const pose = getGaitPose(s);
    if (!facingChanged && s.facing === -1) {
      facingChanged = true; assert.equal(s.velocity, 0);
      assert.equal(s.feet.filter(f => !f.swing).length, 1);
      let conserved = 0;
      for (const name of ['nearLeg','farLeg']) if (pose[name].contact && previousPose[name].contact) {
        for (const point of ['heel','toe','ankle']) {
          const old = world(previousPose, previousPose[name][point]), current = world(pose, pose[name][point]);
          assert(Math.hypot(old[0]-current[0],old[1]-current[1]) < 1e-6, `${point} jumps during body turn`);
        }
        conserved++;
      }
      assert.equal(conserved, 1);
    }
    previousPose = pose;
  });
  assert(facingChanged); assert(state.x < before);
});
test('reversal responds from twelve phases and rapid commands converge', () => {
  let worst = 0;
  for (let phase = 1; phase <= 12; phase++) {
    const state = make(); simulate(state,1,phase*.1,240,checkPose);
    let elapsed = 0;
    while (state.velocity >= -5 && elapsed < 1) {
      advanceGait(state,-1,1/240); checkPose(state); elapsed += 1/240;
    }
    assert(state.velocity < -5); worst = Math.max(worst,elapsed);
  }
  assert(worst < .85, `Reversal too slow: ${worst}`);
  const state=make();
  for(const [input,duration] of [[1,.4],[-1,.12],[1,.08],[-1,.1],[0,.05],[1,.2],[0,2]]) simulate(state,input,duration,240,checkPose);
  assert(state.settled); assert.equal(state.velocity,0); assert(!state.turn);
  console.log(`  worst reversal latency: ${worst.toFixed(4)}s`);
});
test('knees stay continuous at the body flip at 60Hz, including idle turns', () => {
  let maximum = 0;
  for(let phase=0;phase<=12;phase++) {
    const state=make();simulate(state,1,phase*.1,60,checkPose);
    let turned=false;
    for(let frame=0;frame<90;frame++) {
      const before=getGaitPose(state);
      advanceGait(state,-1,1/60);checkPose(state);
      const after=getGaitPose(state);
      if(before.facing!==after.facing) {
        for(const name of ['nearLeg','farLeg']) {
          const old=world(before,before[name].knee),current=world(after,after[name].knee);
          const displacement=Math.hypot(old[0]-current[0],old[1]-current[1]);
          maximum=Math.max(maximum,displacement);
          assert(displacement<3, `Knee jumps ${displacement}px at phase ${phase}`);
        }
        turned=true;break;
      }
    }
    assert(turned);
  }
  console.log(`  maximum turn-frame knee displacement at 60Hz: ${maximum.toFixed(4)}px`);
});
test('both scene bounds stop and settle the character', () => {
  for (const direction of [-1, 1]) {
    const state = make(); simulate(state, direction, 8, 120, checkPose);
    assert.equal(state.x, direction === 1 ? state.max : state.min); assert(state.settled); assert.equal(state.velocity, 0);
  }
});
test('30, 60 and 120Hz produce equivalent trajectories and steps', () => {
  const runs = [30,60,120].map(hz => {
    const s = make();
    for (const [input, duration] of [[1,1.3],[0,.8],[-1,1.5],[0,1.5],[1,.6],[0,1.2]]) simulate(s,input,duration,hz,checkPose);
    return s;
  });
  for (const s of runs) {
    assert(Math.abs(s.x-runs[0].x)<.08); assert.equal(s.facing,runs[0].facing); assert.equal(s.stepCount,runs[0].stepCount); assert(s.settled);
  }
  console.log('  final x:', runs.map(s=>s.x.toFixed(5)).join(', '));
});
test('painted proportions keep the original crown height', () => {
  const pose = getGaitPose(make());
  assert.equal(pose.body.hip[1], -.520);
  assert(Math.abs(pose.body.hip[1] - pose.body.shoulder[1] - .272) < 1e-10);
  for (const sourceCrownY of [17,28]) {
    const sourceHeadAboveHip = (250 - sourceCrownY) / 121;
    const oldCrown = -.561 - .250 * sourceHeadAboveHip;
    const newCrown = pose.body.hip[1] - .272 * sourceHeadAboveHip;
    assert(Math.abs(oldCrown - newCrown) * pose.height < 1, 'Character changes total height');
  }
});
test('turn metadata includes all five directions while the root is planted', () => {
  for (const hz of [30,60,120]) {
    const state = make(); let frames = [], previous = null, x;
    for (let frame = 0; frame < hz; frame++) {
      advanceGait(state, -1, 1 / hz); checkPose(state);
      const pose = getGaitPose(state);
      if (!pose.turn) continue;
      x ??= pose.x;
      assert.equal(pose.x, x, 'Root drifts during the painted turn');
      assert.equal(pose.turn.sourceFacing, 1);
      assert.equal(pose.turn.targetFacing, -1);
      if (previous !== null) assert(pose.turn.progress >= previous, 'Turn progress runs backwards');
      previous = pose.turn.progress; frames.push(pose.turn.progress);
      assert(pose.nearLeg.contact || pose.farLeg.contact, 'Turn has no planted support');
    }
    assert(frames[0] < .03 && frames.at(-1) > .98, 'Turn sequence loses an endpoint');
    for (const quarter of [0,.25,.5,.75,1]) assert(frames.some(p => Math.abs(p - quarter) < .13), `Missing painted direction ${quarter}`);
    assert(frames.length / hz >= .35 && frames.length / hz <= .42);
  }
});
test('two-step walk phase is continuous and agrees with foot landings', () => {
  const state = make(); let phase = 0, landings = 0;
  for(let i = 0; i < 240 * 2; i++) {
    const oldSwing = state.feet.map(foot => !!foot.swing);
    advanceGait(state, 1, 1 / 240);
    const pose = getGaitPose(state);
    const advance = (pose.walkPhase - phase + 1) % 1;
    assert(advance < .015, `Walk phase jumps ${advance}`);
    phase = pose.walkPhase;
    state.feet.forEach((foot, index) => {
      if (oldSwing[index] && !foot.swing) {
        assert(Math.abs(pose.walkPhase - (index === 0 ? 0 : .5)) < 1e-7);
        landings++;
      }
    });
  }
  assert(landings >= 4);
});
test('slower recovery has a low level passing foot and no contact discontinuity', () => {
  const state = make(); let previous = getGaitPose(state), tested = 0, peak = 0;
  simulate(state, 1, 2, 240, s => {
    const pose = getGaitPose(s);
    for (const [index, name] of ['nearLeg','farLeg'].entries()) {
      const leg = pose[name], old = previous[name], swing = s.feet[index].swing;
      if (swing) {
        assert.equal(swing.duration, .34);
        const p = swing.elapsed / swing.duration;
        if (p > .4 && p < .6) assert(Math.abs(leg.footAngle) < 1e-10, 'Passing boot tips instead of relaxing');
        peak = Math.max(peak, -leg.heel[1], -leg.toe[1]);
      }
      if (leg.contact && old.contact === leg.contact && Math.abs(leg.anchorX - old.anchorX) < .01) {
        const point = leg.contact === 'toe' ? 'toe' : 'heel';
        const a = world(pose, leg[point]), b = world(previous, old[point]);
        assert(Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-7);
        tested++;
      }
    }
    previous = pose;
  });
  assert(tested > 100 && peak >= .034 && peak < .041);
});
test('a brief opposite tap restores the walking landing without crouching', () => {
  for (const hz of [30,60,120]) {
    const state = createGait({ x:500, min:200, max:1900, height:267, floor:800 });
    let highest = -.520, lowest = -.520, previous = -.520;
    for (let frame = 0; frame < 2 * hz; frame++) {
      const time = frame / hz;
      advanceGait(state, time >= .2 && time < .2 + 1 / 30 ? -1 : 1, 1 / hz);
      checkPose(state);
      const y = getGaitPose(state).body.hip[1];
      highest = Math.min(highest,y); lowest = Math.max(lowest,y);
      assert(Math.abs(y - previous) * state.height < 3 * 60 / hz, 'Pelvis jerks after a brief opposite tap');
      previous = y;
    }
    assert((lowest - highest) * state.height < 10, 'Interrupted landing forces a crouch');
    assert.equal(state.facing,1); assert.equal(state.velocity,140);
  }
});
test('large, negative and nonfinite deltas do not corrupt the rig', () => {
  const state=make(); advanceGait(state,1,99); assert(state.x<515); checkPose(state);
  const before=JSON.stringify(state); advanceGait(state,1,-1); advanceGait(state,1,NaN); assert.equal(JSON.stringify(state),before);
});
console.log(`${count} gait checks passed.`);
