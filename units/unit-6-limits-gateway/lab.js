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
  const checkBtn = document.getElementById("check-btn");
  const newTargetBtn = document.getElementById("new-target-btn");

  let correct = 0;
  let current = SENSORS[0];

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
    scene.setRange([a - Math.max(w * 6, 0.5), a + Math.max(w * 6, 0.5)], [current.limit - 4, current.limit + 4]);
    scene.clear();
    scene.plotFunction(current.fn, { color: "#e8912d", lineWidth: 2.5 });
    scene.plotPoint(a, current.limit, { open: true, color: "#d9636b", radius: 6, label: "ERROR here" });

    const leftVal = current.fn(a - w);
    const rightVal = current.fn(a + w);
    scene.plotPoint(a - w, leftVal, { color: "#35c4b8", radius: 4, label: "left" });
    scene.plotPoint(a + w, rightVal, { color: "#35c4b8", radius: 4, label: "right" });

    readout.textContent = `f(${(a - w).toFixed(4)}) ≈ ${leftVal.toFixed(4)}    f(${(a + w).toFixed(4)}) ≈ ${rightVal.toFixed(4)}    |    sensor: ${current.label}`;
  }

  function checkGuess() {
    const guess = parseFloat(guessSlider.value);
    if (Math.abs(guess - current.limit) < 0.15) {
      correct += 1;
      const rec = Trajectory.addXP(UNIT_ID, 25);
      status.textContent = `Correct — the limit is ${current.limit}. (${correct}/3 for the badge) +25 XP — total ${rec.xp} XP.`;
      status.className = "lab__status lab__status--ok";
      if (correct >= 3) {
        Trajectory.awardBadge(UNIT_ID);
        status.textContent += " Badge earned: Sensor Repaired ★";
      }
      setTimeout(() => { newSensor(); render(); }, 1500);
    } else {
      status.textContent = "Not yet — zoom in further and watch where both sides converge.";
      status.className = "lab__status lab__status--warn";
    }
  }

  select.addEventListener("change", () => { current = SENSORS[parseInt(select.value, 10)]; render(); });
  zoomSlider.addEventListener("input", render);
  guessSlider.addEventListener("input", render);
  checkBtn.addEventListener("click", checkGuess);
  newTargetBtn.addEventListener("click", () => { Trajectory.addXP(UNIT_ID, 10); newSensor(); render(); });

  select.innerHTML = SENSORS.map((s, i) => `<option value="${i}">${s.label}</option>`).join("");
  newSensor();
  render();
})();
