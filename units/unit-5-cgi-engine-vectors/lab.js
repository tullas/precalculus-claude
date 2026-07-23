(function () {
  const UNIT_ID = "unit-5-cgi-engine-vectors";
  const canvas = document.getElementById("lab-canvas");
  const scene = GraphEngine.mount(canvas, { xRange: [-6, 6], yRange: [-6, 6] });

  const SPRITE = [[1.5, 0], [-1, 1.2], [-0.5, -1.4]]; // base triangle "sprite"

  const sliders = {
    theta: document.getElementById("slider-theta"),
    sx: document.getElementById("slider-sx"),
    sy: document.getElementById("slider-sy"),
  };
  const outputs = {
    theta: document.getElementById("out-theta"),
    sx: document.getElementById("out-sx"),
    sy: document.getElementById("out-sy"),
  };
  const readout = document.getElementById("readout");
  const status = document.getElementById("status");
  const brief = document.getElementById("target-brief");
  const checkBtn = document.getElementById("check-btn");
  const newTargetBtn = document.getElementById("new-target-btn");

  let matches = 0;
  let target = null;

  function matrixOf(p) {
    const c = Math.cos(p.theta), s = Math.sin(p.theta);
    return [
      [p.sx * c, -s],
      [s, p.sy * c],
    ];
  }

  function applyMatrix(m, pt) {
    return [m[0][0] * pt[0] + m[0][1] * pt[1], m[1][0] * pt[0] + m[1][1] * pt[1]];
  }

  function currentParams() {
    return {
      theta: parseFloat(sliders.theta.value),
      sx: parseFloat(sliders.sx.value),
      sy: parseFloat(sliders.sy.value),
    };
  }

  function drawSprite(m, color, lineWidth) {
    const pts = SPRITE.map((p) => applyMatrix(m, p));
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      scene.plotVector(a[0], a[1], b[0], b[1], { color, lineWidth });
    }
    pts.forEach((p) => scene.plotPoint(p[0], p[1], { color, radius: 4 }));
    return pts;
  }

  function randomTarget() {
    return {
      theta: (Math.floor(Math.random() * 8) * Math.PI) / 4,
      sx: [0.6, 1, 1.5, 2][Math.floor(Math.random() * 4)],
      sy: [0.6, 1, 1.5, 2][Math.floor(Math.random() * 4)],
    };
  }

  function newTarget() {
    target = randomTarget();
    render();
    status.textContent = "";
    status.className = "lab__status";
    brief.textContent = "Render order: apply a transform matrix so your sprite (amber) matches the target ghost sprite (teal).";
  }

  function render() {
    const p = currentParams();
    outputs.theta.textContent = (p.theta / Math.PI).toFixed(2) + "π";
    outputs.sx.textContent = p.sx.toFixed(2);
    outputs.sy.textContent = p.sy.toFixed(2);

    scene.clear();
    if (target) drawSprite(matrixOf(target), "rgba(53,196,184,0.6)", 3.5);
    const pts = drawSprite(matrixOf(p), "#e8912d", 2.5);

    const u = [pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]];
    const v = [pts[2][0] - pts[0][0], pts[2][1] - pts[0][1]];
    const dot = (u[0] * v[0] + u[1] * v[1]).toFixed(2);

    const m = matrixOf(p);
    readout.textContent = `M = [ ${m[0][0].toFixed(2)}  ${m[0][1].toFixed(2)} ; ${m[1][0].toFixed(2)}  ${m[1][1].toFixed(2)} ]   |   edge dot product ≈ ${dot}`;
  }

  function checkMatch() {
    if (!target) return;
    const p = currentParams();
    const angleDiff = Math.min(Math.abs(p.theta - target.theta), Math.abs(p.theta - target.theta - 2 * Math.PI), Math.abs(p.theta - target.theta + 2 * Math.PI));
    const close = angleDiff < 0.2 && Math.abs(p.sx - target.sx) < 0.15 && Math.abs(p.sy - target.sy) < 0.15;
    if (close) {
      matches += 1;
      const rec = Trajectory.addXP(UNIT_ID, 25);
      status.textContent = `Sprite matched (${matches}/3 for the badge). +25 XP — total ${rec.xp} XP.`;
      status.className = "lab__status lab__status--ok";
      if (matches >= 3) {
        Trajectory.awardBadge(UNIT_ID);
        status.textContent += " Badge earned: Engine Online ★";
      }
      setTimeout(newTarget, 1400);
    } else {
      status.textContent = "Not aligned yet — compare rotation and both scale factors against the ghost sprite.";
      status.className = "lab__status lab__status--warn";
    }
  }

  Object.values(sliders).forEach((s) => s.addEventListener("input", render));
  checkBtn.addEventListener("click", checkMatch);
  newTargetBtn.addEventListener("click", () => { Trajectory.addXP(UNIT_ID, 10); newTarget(); });

  newTarget();
})();
