(function () {
  const UNIT_ID = "unit-2-rollercoaster-engineering";
  const canvas = document.getElementById("lab-canvas");
  const scene = GraphEngine.mount(canvas, { xRange: [-10, 10], yRange: [-12, 12] });

  const sliders = {
    r1: document.getElementById("slider-r1"),
    r2: document.getElementById("slider-r2"),
    r3: document.getElementById("slider-r3"),
    a: document.getElementById("slider-a"),
  };
  const outputs = {
    r1: document.getElementById("out-r1"),
    r2: document.getElementById("out-r2"),
    r3: document.getElementById("out-r3"),
    a: document.getElementById("out-a"),
  };
  const readout = document.getElementById("readout");
  const status = document.getElementById("status");
  const brief = document.getElementById("target-brief");
  const checkBtn = document.getElementById("check-btn");
  const newTargetBtn = document.getElementById("new-target-btn");

  let certifications = 0;
  let requirement = null;

  function params() {
    return {
      r1: parseFloat(sliders.r1.value),
      r2: parseFloat(sliders.r2.value),
      r3: parseFloat(sliders.r3.value),
      a: parseFloat(sliders.a.value),
    };
  }

  function trackFn(p) {
    return (x) => p.a * (x - p.r1) * (x - p.r2) * (x - p.r3);
  }

  function newRequirement() {
    const direction = Math.random() < 0.5 ? "up" : "down";
    const requireDoubleRoot = Math.random() < 0.5;
    requirement = { direction, requireDoubleRoot };
    brief.textContent = `Inspection order: the right end of the track must launch ${direction.toUpperCase()}` +
      (requireDoubleRoot ? ", and the profile must include one double root (a ground-kiss, not a crossing)." : ".");
    status.textContent = "Adjust the roots and leading coefficient, then certify.";
    status.className = "lab__status";
  }

  function render() {
    const p = params();
    outputs.r1.textContent = p.r1.toFixed(1);
    outputs.r2.textContent = p.r2.toFixed(1);
    outputs.r3.textContent = p.r3.toFixed(1);
    outputs.a.textContent = p.a.toFixed(2);

    scene.clear();
    scene.plotFunction(trackFn(p), { color: "#e8912d", lineWidth: 2.5 });
    scene.plotPoint(p.r1, 0, { color: "#35c4b8", radius: 5 });
    scene.plotPoint(p.r2, 0, { color: "#35c4b8", radius: 5 });
    scene.plotPoint(p.r3, 0, { color: "#35c4b8", radius: 5 });

    const rightEnd = p.a > 0 ? "UP →" : "DOWN →";
    const leftEnd = p.a > 0 ? "← DOWN" : "← UP"; // odd degree: opposite ends
    readout.textContent = `f(x) = ${p.a.toFixed(2)}(x − ${p.r1.toFixed(1)})(x − ${p.r2.toFixed(1)})(x − ${p.r3.toFixed(1)})   |   end behavior: ${leftEnd}  …  ${rightEnd}`;
  }

  function hasDoubleRoot(p) {
    const pairs = [[p.r1, p.r2], [p.r1, p.r3], [p.r2, p.r3]];
    return pairs.some(([x, y]) => Math.abs(x - y) < 0.3);
  }

  function certify() {
    if (!requirement) return;
    const p = params();
    const directionOk = requirement.direction === "up" ? p.a > 0 : p.a < 0;
    const doubleRootOk = !requirement.requireDoubleRoot || hasDoubleRoot(p);

    if (directionOk && doubleRootOk) {
      certifications += 1;
      let xp = 20 + (requirement.requireDoubleRoot ? 15 : 0);
      const rec = Trajectory.addXP(UNIT_ID, xp);
      status.textContent = `Track certified (${certifications}/3 for the badge). +${xp} XP — total ${rec.xp} XP.`;
      status.className = "lab__status lab__status--ok";
      if (certifications >= 3) {
        Trajectory.awardBadge(UNIT_ID);
        status.textContent += " Badge earned: Track Certified ★";
      }
      setTimeout(newRequirement, 1400);
    } else {
      const reasons = [];
      if (!directionOk) reasons.push(`right end must launch ${requirement.direction.toUpperCase()} — check the sign of a`);
      if (!doubleRootOk) reasons.push("profile needs a double root — bring two root sliders to the same value");
      status.textContent = "Inspection failed: " + reasons.join("; ") + ".";
      status.className = "lab__status lab__status--warn";
    }
  }

  Object.values(sliders).forEach((s) => s.addEventListener("input", render));
  checkBtn.addEventListener("click", certify);
  newTargetBtn.addEventListener("click", () => { Trajectory.addXP(UNIT_ID, 5); newRequirement(); render(); });

  newRequirement();
  render();
})();
