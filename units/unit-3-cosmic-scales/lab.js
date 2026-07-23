(function () {
  const UNIT_ID = "unit-3-cosmic-scales";
  const canvas = document.getElementById("lab-canvas");
  let scene = GraphEngine.mount(canvas, { xRange: [0, 30], yRange: [0, 5000] });

  const sliders = {
    n0: document.getElementById("slider-n0"),
    r: document.getElementById("slider-r"),
    guess: document.getElementById("slider-guess"),
  };
  const outputs = {
    n0: document.getElementById("out-n0"),
    r: document.getElementById("out-r"),
    guess: document.getElementById("out-guess"),
  };
  const toggle = document.getElementById("toggle-log");
  const readout = document.getElementById("readout");
  const status = document.getElementById("status");
  const brief = document.getElementById("target-brief");
  const checkBtn = document.getElementById("check-btn");
  const newTargetBtn = document.getElementById("new-target-btn");

  let correct = 0;
  let threshold = 5000;
  const T_MAX = 30;

  function N(t, n0, r) { return n0 * Math.pow(1 + r, t); }

  function newThreshold() {
    threshold = [2000, 5000, 10000, 20000][Math.floor(Math.random() * 4)];
    brief.textContent = `Tracking order: estimate the day cases first exceed ${threshold.toLocaleString()}. Drag the day slider, then submit.`;
    status.textContent = "";
    status.className = "lab__status";
  }

  function render() {
    const n0 = parseFloat(sliders.n0.value);
    const r = parseFloat(sliders.r.value);
    const guess = parseFloat(sliders.guess.value);
    outputs.n0.textContent = n0;
    outputs.r.textContent = (r * 100).toFixed(0) + "%";
    outputs.guess.textContent = guess.toFixed(0);

    const isLog = toggle.checked;
    const maxVal = N(T_MAX, n0, r);
    const yMax = isLog ? Math.max(1, Math.log10(maxVal || 1)) * 1.15 : Math.max(threshold * 1.3, maxVal * 1.15);
    scene.setRange([0, T_MAX], [0, isLog ? Math.max(4, yMax) : yMax]);

    scene.clear();
    const fn = isLog
      ? (t) => { const v = N(t, n0, r); return v > 0 ? Math.log10(v) : NaN; }
      : (t) => N(t, n0, r);
    scene.plotFunction(fn, { color: "#e8912d", lineWidth: 2.5 });

    const thresholdY = isLog ? Math.log10(threshold) : threshold;
    scene.plotVector(0, thresholdY, T_MAX, thresholdY, { color: "rgba(217,99,107,0.5)", lineWidth: 1.5 });
    scene.plotPoint(guess, isLog ? Math.log10(Math.max(1, N(guess, n0, r))) : N(guess, n0, r), { color: "#35c4b8", radius: 6, label: "your estimate" });

    readout.textContent = `N(t) = ${n0} · (1 + ${r.toFixed(2)})ᵗ    |    view: ${isLog ? "log₁₀(N)" : "linear"}    |    N(${guess.toFixed(0)}) ≈ ${Math.round(N(guess, n0, r)).toLocaleString()}`;
  }

  function checkEstimate() {
    const n0 = parseFloat(sliders.n0.value);
    const r = parseFloat(sliders.r.value);
    const guess = parseFloat(sliders.guess.value);
    // true crossing day, solved algebraically: t = log((threshold/n0)) / log(1+r)
    const trueDay = Math.log(threshold / n0) / Math.log(1 + r);

    if (Math.abs(guess - trueDay) <= 1) {
      correct += 1;
      const rec = Trajectory.addXP(UNIT_ID, 25);
      status.textContent = `Correct — threshold crossed at day ${trueDay.toFixed(1)}. (${correct}/3 for the badge) +25 XP — total ${rec.xp} XP.`;
      status.className = "lab__status lab__status--ok";
      if (correct >= 3) {
        Trajectory.awardBadge(UNIT_ID);
        const bonus = Trajectory.addXP(UNIT_ID, 15);
        status.textContent += ` +15 bonus XP — total ${bonus.xp} XP. Badge earned: Outbreak Contained ★`;
      }
      setTimeout(() => { newThreshold(); render(); }, 1600);
    } else {
      status.textContent = `Off target — true crossing is day ${trueDay.toFixed(1)}. Try log(threshold/N₀) ÷ log(1+r).`;
      status.className = "lab__status lab__status--warn";
    }
  }

  Object.values(sliders).forEach((s) => s.addEventListener("input", render));
  let logToggleAwarded = false;
  toggle.addEventListener("change", () => {
    render();
    if (!logToggleAwarded) {
      logToggleAwarded = true;
      const rec = Trajectory.addXP(UNIT_ID, 10);
      status.textContent = `Log view toggled. +10 XP — total ${rec.xp} XP.`;
      status.className = "lab__status lab__status--ok";
    }
  });
  checkBtn.addEventListener("click", checkEstimate);
  newTargetBtn.addEventListener("click", () => { newThreshold(); render(); });

  newThreshold();
  render();
})();
