(function () {
  const UNIT_ID = "unit-1-morphing-machines";
  const canvas = document.getElementById("lab-canvas");
  const scene = GraphEngine.mount(canvas, { xRange: [-10, 10], yRange: [-10, 10] });

  // The "base machine." A distinctive piecewise-ish shape (not just a bare
  // parabola) so stretch/shift/reflect are all visually unambiguous.
  const baseFn = (x) => 0.12 * (x - 1) * (x + 2) * (x - 3) / 4;

  const sliders = {
    a: document.getElementById("slider-a"),
    b: document.getElementById("slider-b"),
    h: document.getElementById("slider-h"),
    k: document.getElementById("slider-k"),
  };
  const outputs = {
    a: document.getElementById("out-a"),
    b: document.getElementById("out-b"),
    h: document.getElementById("out-h"),
    k: document.getElementById("out-k"),
  };
  const readout = document.getElementById("readout");
  const status = document.getElementById("status");
  const xpBadge = document.getElementById("xp-badge");
  const checkBtn = document.getElementById("check-btn");
  const newTargetBtn = document.getElementById("new-target-btn");

  let matches = 0;
  let target = null;
  const slidersMoved = new Set(); // brief: "Move each slider once" — 10 XP per distinct slider, first move only

  function refreshXpBadge() {
    if (!xpBadge) return;
    const rec = Trajectory.get(UNIT_ID);
    xpBadge.textContent = Trajectory.badgeText(UNIT_ID);
    xpBadge.classList.toggle("xp-badge--earned", rec.badgeEarned);
  }

  function currentParams() {
    return {
      a: parseFloat(sliders.a.value),
      b: parseFloat(sliders.b.value),
      h: parseFloat(sliders.h.value),
      k: parseFloat(sliders.k.value),
    };
  }

  function transformed(params) {
    return (x) => params.a * baseFn(params.b * (x - params.h)) + params.k;
  }

  function randomTarget() {
    return {
      a: [1, 1, 2, -1, 0.5][Math.floor(Math.random() * 5)],
      b: [1, 1, 0.6, 1.5][Math.floor(Math.random() * 4)],
      h: Math.floor(Math.random() * 7) - 3,
      k: Math.floor(Math.random() * 7) - 3,
    };
  }

  function newTarget() {
    target = randomTarget();
    render();
    status.textContent = "New target ghost curve loaded. Match it with the four sliders.";
    status.className = "lab__status";
  }

  function render() {
    const params = currentParams();
    outputs.a.textContent = params.a.toFixed(2);
    outputs.b.textContent = params.b.toFixed(2);
    outputs.h.textContent = params.h.toFixed(2);
    outputs.k.textContent = params.k.toFixed(2);

    scene.clear();
    if (target) {
      scene.plotFunction(transformed(target), { color: "rgba(53,196,184,0.55)", lineWidth: 4 });
    }
    scene.plotFunction(transformed(params), { color: "#e8912d", lineWidth: 2.5 });

    readout.textContent = `g(x) = ${params.a.toFixed(2)} · f( ${params.b.toFixed(2)} · (x − ${params.h.toFixed(2)}) ) + ${params.k.toFixed(2)}`;
  }

  function checkMatch() {
    if (!target) return;
    const p = currentParams();
    const close = Math.abs(p.a - target.a) < 0.15 &&
                  Math.abs(p.b - target.b) < 0.15 &&
                  Math.abs(p.h - target.h) < 0.4 &&
                  Math.abs(p.k - target.k) < 0.4;
    if (close) {
      matches += 1;
      const rec = Trajectory.addXP(UNIT_ID, 25);
      status.textContent = `Match confirmed. Rig calibrated (${matches}/3 for the badge). +25 XP — total ${rec.xp} XP.`;
      status.className = "lab__status lab__status--ok";
      refreshXpBadge();
      if (matches >= 3) {
        Trajectory.awardBadge(UNIT_ID);
        const bonus = Trajectory.addXP(UNIT_ID, 15);
        status.textContent += ` +15 bonus XP — total ${bonus.xp} XP. Badge earned: Camera Calibrated ★`;
        refreshXpBadge();
      }
      setTimeout(newTarget, 1400);
    } else {
      status.textContent = "Not quite aligned yet — compare the amber curve to the teal ghost and adjust.";
      status.className = "lab__status lab__status--warn";
    }
  }

  Object.entries(sliders).forEach(([key, s]) => {
    s.addEventListener("input", () => {
      render();
      if (!slidersMoved.has(key)) {
        slidersMoved.add(key);
        const rec = Trajectory.addXP(UNIT_ID, 10);
        status.textContent = `First move on "${key}" logged. +10 XP — total ${rec.xp} XP.`;
        status.className = "lab__status lab__status--ok";
        refreshXpBadge();
      }
    });
  });
  checkBtn.addEventListener("click", checkMatch);
  newTargetBtn.addEventListener("click", newTarget);

  newTarget();
  refreshXpBadge();
})();
