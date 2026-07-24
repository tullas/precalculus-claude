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
  const xpBadge = document.getElementById("xp-badge");
  const checkBtn = document.getElementById("check-btn");
  const newTargetBtn = document.getElementById("new-target-btn");
  const runBtn = document.getElementById("run-btn");

  let correct = 0;
  let threshold = 5000;
  const T_MAX = 30;

  function refreshXpBadge() {
    if (!xpBadge) return;
    const rec = Trajectory.get(UNIT_ID);
    xpBadge.textContent = Trajectory.badgeText(UNIT_ID);
    xpBadge.classList.toggle("xp-badge--earned", rec.badgeEarned);
  }

  function N(t, n0, r) { return n0 * Math.pow(1 + r, t); }

  // Shared by render() and runOutbreak(): draws the curve, threshold line,
  // and guess marker. `dot` (if given) overlays a traveling marker for the
  // animated run, and `guessReached` enlarges the guess point once the
  // animation has passed it, so a passive playback still tracks both the
  // student's estimate and the true crossing visually.
  function drawScene(n0, r, guess, isLog, opts = {}) {
    const maxVal = N(T_MAX, n0, r);
    const yMax = isLog ? Math.max(1, Math.log10(maxVal || 1)) * 1.15 : Math.max(threshold * 1.3, maxVal * 1.15);
    scene.setRange([0, T_MAX], [0, isLog ? Math.max(4, yMax) : yMax]);

    scene.clear();
    const fn = isLog
      ? (t) => { const v = N(t, n0, r); return v > 0 ? Math.log10(v) : NaN; }
      : (t) => N(t, n0, r);
    scene.plotFunction(fn, { color: "#e8912d", lineWidth: 2.5 });

    const thresholdY = isLog ? Math.log10(threshold) : threshold;
    const crossed = !!opts.thresholdCrossed;
    scene.plotVector(0, thresholdY, T_MAX, thresholdY, {
      color: crossed ? "rgba(217,99,107,0.9)" : "rgba(217,99,107,0.5)",
      lineWidth: crossed ? 2.5 : 1.5,
    });

    scene.plotPoint(guess, isLog ? Math.log10(Math.max(1, N(guess, n0, r))) : N(guess, n0, r), {
      color: "#35c4b8",
      radius: opts.guessReached ? 8 : 6,
      label: "your estimate",
    });

    if (opts.dot) {
      scene.plotPoint(opts.dot.t, isLog ? Math.log10(Math.max(1, opts.dot.v)) : opts.dot.v, { color: "#f3eee1", radius: 6 });
    }
  }

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
    drawScene(n0, r, guess, isLog);

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
      refreshXpBadge();
      if (correct >= 3) {
        Trajectory.awardBadge(UNIT_ID);
        const bonus = Trajectory.addXP(UNIT_ID, 15);
        status.textContent += ` +15 bonus XP — total ${bonus.xp} XP. Badge earned: Outbreak Contained ★`;
        refreshXpBadge();
      }
      setTimeout(() => { newThreshold(); render(); }, 1600);
    } else {
      status.textContent = `Off target — true crossing is day ${trueDay.toFixed(1)}. Try log(threshold/N₀) ÷ log(1+r).`;
      status.className = "lab__status lab__status--warn";
    }
  }

  let simRunning = false;

  function setControlsDisabled(disabled) {
    Object.values(sliders).forEach((s) => { s.disabled = disabled; });
    toggle.disabled = disabled;
    checkBtn.disabled = disabled;
    newTargetBtn.disabled = disabled;
    runBtn.disabled = disabled;
  }

  // A visual playback of the same math checkEstimate() already scores
  // instantly — a marker rides the growth curve from day 0 to day 30,
  // the threshold line highlights once the marker crosses it, and the
  // guess marker grows once the marker passes that day too. Scoring
  // itself is left entirely to checkEstimate() at the end, so this adds
  // no new XP logic to reason about or retest.
  function runOutbreak() {
    if (simRunning) return;
    simRunning = true;
    setControlsDisabled(true);
    status.textContent = "Simulating outbreak…";
    status.className = "lab__status";

    const n0 = parseFloat(sliders.n0.value);
    const r = parseFloat(sliders.r.value);
    const guess = parseFloat(sliders.guess.value);
    const isLog = toggle.checked;
    const trueDay = Math.log(threshold / n0) / Math.log(1 + r);

    const durationMs = 3200;
    let startTime = null;

    function frame(ts) {
      if (startTime === null) startTime = ts;
      const t = Math.min(1, (ts - startTime) / durationMs);
      const day = t * T_MAX;
      const v = N(day, n0, r);
      drawScene(n0, r, guess, isLog, {
        dot: { t: day, v },
        thresholdCrossed: day >= trueDay,
        guessReached: day >= guess,
      });
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        simRunning = false;
        setControlsDisabled(false);
        checkEstimate();
      }
    }
    requestAnimationFrame(frame);
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
      refreshXpBadge();
    }
  });
  checkBtn.addEventListener("click", checkEstimate);
  newTargetBtn.addEventListener("click", () => { newThreshold(); render(); });
  runBtn.addEventListener("click", runOutbreak);

  newThreshold();
  render();
  refreshXpBadge();
})();
