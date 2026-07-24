(function () {
  const UNIT_ID = "unit-6-limits-gateway";
  const canvas = document.getElementById("lab-canvas");
  const scene = GraphEngine.mount(canvas, { xRange: [-2, 6], yRange: [-2, 10] });

  const SENSORS = [
    { label: "(x² − 4) / (x − 2)", a: 2, limit: 4, fn: (x) => (x * x - 4) / (x - 2) },
    { label: "(x² − 1) / (x − 1)", a: 1, limit: 2, fn: (x) => (x * x - 1) / (x - 1) },
    { label: "(x³ − 8) / (x − 2)", a: 2, limit: 12, fn: (x) => (x ** 3 - 8) / (x - 2) },
    { label: "sin(x) / x", a: 0, limit: 1, fn: (x) => Math.sin(x) / x },
  ];

  const select = document.getElementById("sensor-select");
  const zoomSlider = document.getElementById("slider-zoom");
  const guessSlider = document.getElementById("slider-guess");
  const zoomOut = document.getElementById("out-zoom");
  const guessOut = document.getElementById("out-guess");
  const readout = document.getElementById("readout");
  const status = document.getElementById("status");
  const brief = document.getElementById("target-brief");
  const xpBadge = document.getElementById("xp-badge");
  const checkBtn = document.getElementById("check-btn");
  const newTargetBtn = document.getElementById("new-target-btn");
  const zoomScanBtn = document.getElementById("zoom-scan-btn");

  let correct = 0;
  let current = SENSORS[0];
  let zoomMaxAwarded = false; // brief: "Zoom to max on one function" — 10 XP, once
  const ZOOM_MAX = parseFloat(zoomSlider.max);

  function refreshXpBadge() {
    if (!xpBadge) return;
    const rec = Trajectory.get(UNIT_ID);
    xpBadge.textContent = Trajectory.badgeText(UNIT_ID);
    xpBadge.classList.toggle("xp-badge--earned", rec.badgeEarned);
  }

  function newSensor() {
    current = SENSORS[Math.floor(Math.random() * SENSORS.length)];
    select.value = String(SENSORS.indexOf(current));
    brief.textContent = `Diagnostic order: the sensor reports ERROR at x = ${current.a}. Zoom in from both sides and estimate the limit.`;
    status.textContent = "";
    status.className = "lab__status";
  }

  function render() {
    const zoom = parseFloat(zoomSlider.value);
    const guess = parseFloat(guessSlider.value);
    const w = Math.pow(10, -zoom); // window half-width shrinks as zoom increases
    zoomOut.textContent = "±" + w.toFixed(4);
    guessOut.textContent = guess.toFixed(2);

    const a = current.a;
    const xMin = a - Math.max(w * 6, 0.5), xMax = a + Math.max(w * 6, 0.5);
    scene.setRange([xMin, xMax], [current.limit - 4, current.limit + 4]);
    scene.clear();
    scene.plotFunction(current.fn, { color: "#e8912d", lineWidth: 2.5 });
    scene.plotPoint(a, current.limit, { open: true, color: "#d9636b", radius: 6, label: "ERROR here" });

    const leftVal = current.fn(a - w);
    const rightVal = current.fn(a + w);
    scene.plotPoint(a - w, leftVal, { color: "#35c4b8", radius: 4, label: "left" });
    scene.plotPoint(a + w, rightVal, { color: "#35c4b8", radius: 4, label: "right" });

    // The slider is a *guess at a y-value*, not tied to any single x, so
    // it's drawn as a dashed guide line across the whole visible window
    // rather than a point — sliding it should visibly show whether that
    // horizontal line sits where the curve (and the left/right samples)
    // are actually converging.
    scene.plotLine(xMin, guess, xMax, guess, { color: "#35c4b8", lineWidth: 2, dashed: true });
    scene.plotPoint(xMax, guess, { radius: 0, color: "#35c4b8", label: "your estimate" });

    readout.textContent = `f(${(a - w).toFixed(4)}) ≈ ${leftVal.toFixed(4)}    f(${(a + w).toFixed(4)}) ≈ ${rightVal.toFixed(4)}    |    sensor: ${current.label}`;
  }

  function checkGuess() {
    const guess = parseFloat(guessSlider.value);
    if (Math.abs(guess - current.limit) < 0.15) {
      correct += 1;
      const rec = Trajectory.addXP(UNIT_ID, 25);
      status.textContent = `Correct — the limit is ${current.limit}. (${correct}/3 for the badge) +25 XP — total ${rec.xp} XP.`;
      status.className = "lab__status lab__status--ok";
      refreshXpBadge();
      if (correct >= 3) {
        Trajectory.awardBadge(UNIT_ID);
        const bonus = Trajectory.addXP(UNIT_ID, 15);
        status.textContent += ` +15 bonus XP — total ${bonus.xp} XP. Badge earned: Sensor Repaired ★`;
        refreshXpBadge();
      }
      setTimeout(() => { newSensor(); render(); }, 1500);
    } else {
      status.textContent = "Not yet — zoom in further and watch where both sides converge.";
      status.className = "lab__status lab__status--warn";
    }
  }

  let scanRunning = false;

  function setControlsDisabled(disabled) {
    select.disabled = disabled;
    zoomSlider.disabled = disabled;
    guessSlider.disabled = disabled;
    checkBtn.disabled = disabled;
    newTargetBtn.disabled = disabled;
    zoomScanBtn.disabled = disabled;
  }

  // render() already draws whatever the zoom window currently is — it
  // reads zoomSlider.value directly and shrinks scene range accordingly —
  // so animating the zoom is just automated dragging: set the slider and
  // dispatch a real 'input' event each frame. That reuses the existing
  // listener (render() + the zoom-to-max XP check) exactly as a manual
  // drag would, frame by frame, rather than needing any separate drawing
  // or XP logic for the animated path.
  function runZoomScan() {
    if (scanRunning) return;
    scanRunning = true;
    setControlsDisabled(true);
    status.textContent = "Scanning toward the discontinuity…";
    status.className = "lab__status";

    const durationMs = 3000;
    let startTime = null;

    function frame(ts) {
      if (startTime === null) startTime = ts;
      const t = Math.min(1, (ts - startTime) / durationMs);
      zoomSlider.value = String(t * ZOOM_MAX);
      zoomSlider.dispatchEvent(new Event("input", { bubbles: true }));
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        scanRunning = false;
        setControlsDisabled(false);
      }
    }
    requestAnimationFrame(frame);
  }

  select.addEventListener("change", () => { current = SENSORS[parseInt(select.value, 10)]; render(); });
  zoomSlider.addEventListener("input", () => {
    render();
    const zoom = parseFloat(zoomSlider.value);
    if (!zoomMaxAwarded && zoom >= ZOOM_MAX - 0.001) {
      zoomMaxAwarded = true;
      const rec = Trajectory.addXP(UNIT_ID, 10);
      status.textContent = `Zoomed to max resolution. +10 XP — total ${rec.xp} XP.`;
      status.className = "lab__status lab__status--ok";
      refreshXpBadge();
    }
  });
  guessSlider.addEventListener("input", render);
  checkBtn.addEventListener("click", checkGuess);
  newTargetBtn.addEventListener("click", () => { newSensor(); render(); });
  zoomScanBtn.addEventListener("click", runZoomScan);

  select.innerHTML = SENSORS.map((s, i) => `<option value="${i}">${s.label}</option>`).join("");
  newSensor();
  render();
  refreshXpBadge();
})();
