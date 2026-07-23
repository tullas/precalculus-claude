(function () {
  const UNIT_ID = "unit-4-cycles-and-waves";
  const canvas = document.getElementById("lab-canvas");
  const scene = GraphEngine.mount(canvas, { xRange: [-6, 9], yRange: [-2.2, 2.2] });

  const thetaSlider = document.getElementById("slider-theta");
  const thetaOut = document.getElementById("out-theta");
  const readout = document.getElementById("readout");
  const status = document.getElementById("status");
  const brief = document.getElementById("target-brief");
  const xpBadge = document.getElementById("xp-badge");
  const checkBtn = document.getElementById("check-btn");
  const newTargetBtn = document.getElementById("new-target-btn");

  const CX = -4, CY = 0, R = 1.4;
  let matches = 0;
  let targetTheta = 0;
  let revolutionAwarded = false; // brief: "Complete one full revolution" — 10 XP, once
  const THETA_MAX = parseFloat(thetaSlider.max);

  // Success messages in `status` are transient — they get cleared a
  // moment later when the next target loads (see newTarget()). This badge
  // is the persistent record of XP earned on this page, so a fast run of
  // correct answers can't outrun the status flash and leave the student
  // with no visible confirmation of what they earned.
  function refreshXpBadge() {
    if (!xpBadge) return;
    const rec = Trajectory.get(UNIT_ID);
    xpBadge.textContent = Trajectory.badgeText(UNIT_ID);
    xpBadge.classList.toggle("xp-badge--earned", rec.badgeEarned);
  }

  function niceAngleLabel(t) {
    const twoPi = Math.PI * 2;
    const norm = ((t % twoPi) + twoPi) % twoPi;
    return (norm / Math.PI).toFixed(2) + "π rad (" + (norm * 180 / Math.PI).toFixed(0) + "°)";
  }

  function newTarget() {
    const options = [0, Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2, (2 * Math.PI) / 3, (3 * Math.PI) / 4, Math.PI, (3 * Math.PI) / 2];
    targetTheta = options[Math.floor(Math.random() * options.length)];
    brief.textContent = `Calibration order: rotate the dish to θ = ${niceAngleLabel(targetTheta)}.`;
    status.textContent = "";
    status.className = "lab__status";
  }

  function render() {
    const theta = parseFloat(thetaSlider.value);
    thetaOut.textContent = niceAngleLabel(theta);

    scene.clear();

    // unit circle outline
    scene.plotFunction((x) => {
      const dx = (x - CX) / R;
      if (Math.abs(dx) > 1) return NaN;
      return CY + R * Math.sqrt(1 - dx * dx);
    }, { color: "rgba(154,160,190,0.5)", lineWidth: 1.5 });
    scene.plotFunction((x) => {
      const dx = (x - CX) / R;
      if (Math.abs(dx) > 1) return NaN;
      return CY - R * Math.sqrt(1 - dx * dx);
    }, { color: "rgba(154,160,190,0.5)", lineWidth: 1.5 });

    const px = CX + R * Math.cos(theta);
    const py = CY + R * Math.sin(theta);
    scene.plotVector(CX, CY, px, py, { color: "#e8912d" });
    scene.plotPoint(px, py, { color: "#e8912d", radius: 6 });

    // sine wave unrolled, x-axis = angle offset from 3
    const waveOrigin = 0;
    scene.plotFunction((x) => {
      if (x < waveOrigin || x > waveOrigin + 2 * Math.PI + 2) return NaN;
      return R * Math.sin(x - waveOrigin);
    }, { color: "#35c4b8", lineWidth: 2 });

    const wavePx = waveOrigin + theta;
    const wavePy = R * Math.sin(theta);
    scene.plotPoint(wavePx, wavePy, { color: "#e8912d", radius: 6 });

    // dashed "shadow" line connecting circle height to wave height
    scene.plotVector(px, py, wavePx, wavePy, { color: "rgba(232,145,45,0.25)", lineWidth: 1 });

    readout.textContent = `θ = ${niceAngleLabel(theta)}    |    (cos θ, sin θ) ≈ (${Math.cos(theta).toFixed(2)}, ${Math.sin(theta).toFixed(2)})`;
  }

  function checkMatch() {
    const theta = parseFloat(thetaSlider.value);
    const twoPi = Math.PI * 2;
    const diff = Math.min(
      Math.abs(theta - targetTheta),
      Math.abs(theta - targetTheta - twoPi),
      Math.abs(theta - targetTheta + twoPi)
    );
    if (diff < 0.12) {
      matches += 1;
      const rec = Trajectory.addXP(UNIT_ID, 20);
      status.textContent = `Signal locked (${matches}/3 for the badge). +20 XP — total ${rec.xp} XP.`;
      status.className = "lab__status lab__status--ok";
      refreshXpBadge();
      if (matches >= 3) {
        Trajectory.awardBadge(UNIT_ID);
        const bonus = Trajectory.addXP(UNIT_ID, 20);
        status.textContent += ` +20 bonus XP — total ${bonus.xp} XP. Badge earned: Signal Locked ★`;
        refreshXpBadge();
      }
      setTimeout(() => { newTarget(); render(); }, 1400);
    } else {
      status.textContent = "Off calibration — rotate the dish closer to the target angle.";
      status.className = "lab__status lab__status--warn";
    }
  }

  thetaSlider.addEventListener("input", () => {
    render();
    const theta = parseFloat(thetaSlider.value);
    if (!revolutionAwarded && theta >= THETA_MAX - 0.02) {
      revolutionAwarded = true;
      const rec = Trajectory.addXP(UNIT_ID, 10);
      status.textContent = `Full revolution logged. +10 XP — total ${rec.xp} XP.`;
      status.className = "lab__status lab__status--ok";
      refreshXpBadge();
    }
  });
  checkBtn.addEventListener("click", checkMatch);
  newTargetBtn.addEventListener("click", () => { newTarget(); render(); });

  newTarget();
  render();
  refreshXpBadge();
})();
