(function () {
  const UNIT_ID = "unit-2-rollercoaster-engineering";
  const canvas = document.getElementById("lab-canvas");
  const scene = GraphEngine.mount(canvas, { xRange: [-10, 10], yRange: [-12, 12] });

  const modeButtons = {
    polynomial: document.getElementById("mode-poly"),
    rational: document.getElementById("mode-rational"),
  };
  const polyControls = document.getElementById("polynomial-controls");
  const rationalControls = document.getElementById("rational-controls");

  const sliders = {
    r1: document.getElementById("slider-r1"),
    r2: document.getElementById("slider-r2"),
    r3: document.getElementById("slider-r3"),
    a: document.getElementById("slider-a"),
    asy: document.getElementById("slider-asy"),
    hole: document.getElementById("slider-hole"),
    ra: document.getElementById("slider-ra"),
  };
  const outputs = {
    r1: document.getElementById("out-r1"),
    r2: document.getElementById("out-r2"),
    r3: document.getElementById("out-r3"),
    a: document.getElementById("out-a"),
    asy: document.getElementById("out-asy"),
    hole: document.getElementById("out-hole"),
    ra: document.getElementById("out-ra"),
  };
  const readout = document.getElementById("readout");
  const status = document.getElementById("status");
  const brief = document.getElementById("target-brief");
  const xpBadge = document.getElementById("xp-badge");
  const checkBtn = document.getElementById("check-btn");
  const newTargetBtn = document.getElementById("new-target-btn");
  const runBtn = document.getElementById("run-btn");
  const checklistItems = document.getElementById("checklist-items");

  function refreshXpBadge() {
    if (!xpBadge) return;
    const rec = Trajectory.get(UNIT_ID);
    xpBadge.textContent = Trajectory.badgeText(UNIT_ID);
    xpBadge.classList.toggle("xp-badge--earned", rec.badgeEarned);
  }
  // Thin wrappers so every XP/badge award anywhere in this file keeps the
  // header badge in sync without having to remember to call
  // refreshXpBadge() at each of the several call sites individually.
  function addXP(amount) { const rec = Trajectory.addXP(UNIT_ID, amount); refreshXpBadge(); return rec; }
  function awardBadge() { const rec = Trajectory.awardBadge(UNIT_ID); refreshXpBadge(); return rec; }

  const KISS_TOLERANCE = 0.3;
  const HOLE_ASYMPTOTE_MIN_GAP = 0.5;

  let mode = "polynomial"; // "polynomial" | "rational"
  let certifications = 0;
  let requirement = null;
  let flags = {};              // { [featureId]: boolean }  — student's self-reported "I see this" checklist
  let asymptoteXpAwarded = new Set(); // feature ids already paid out for the pre-flight asymptote bonus
  let sim = null;              // active simulation state, or null when idle

  // ---------- parameters & track functions ----------

  function params() {
    return {
      mode,
      r1: parseFloat(sliders.r1.value),
      r2: parseFloat(sliders.r2.value),
      r3: parseFloat(sliders.r3.value),
      a: parseFloat(sliders.a.value),
      asy: parseFloat(sliders.asy.value),
      hole: parseFloat(sliders.hole.value),
      ra: parseFloat(sliders.ra.value),
    };
  }

  function polynomialFn(p) {
    return (x) => p.a * (x - p.r1) * (x - p.r2) * (x - p.r3);
  }

  // f(x) = ra * (x - hole) / [(x - asy)(x - hole)]
  // Simplifies to ra / (x - asy) everywhere except the removable point x = hole,
  // which is undefined (0/0) — exactly the "hole" a rational track should have.
  function rationalFn(p) {
    return (x) => {
      const denom = (x - p.asy) * (x - p.hole);
      if (denom === 0) return NaN;
      return (p.ra * (x - p.hole)) / denom;
    };
  }

  function trackFn(p) {
    return p.mode === "rational" ? rationalFn(p) : polynomialFn(p);
  }

  // ---------- feature detection (what the "inspector" should be flagging) ----------

  function computeFeatures(p) {
    if (p.mode === "polynomial") {
      const roots = [p.r1, p.r2, p.r3];
      const used = new Array(roots.length).fill(false);
      const features = [];
      for (let i = 0; i < roots.length; i++) {
        if (used[i]) continue;
        const group = [i];
        used[i] = true;
        for (let j = i + 1; j < roots.length; j++) {
          if (!used[j] && Math.abs(roots[i] - roots[j]) < KISS_TOLERANCE) {
            group.push(j);
            used[j] = true;
          }
        }
        const avgX = group.reduce((s, idx) => s + roots[idx], 0) / group.length;
        const type = group.length >= 2 ? "kiss" : "crossing";
        features.push({ id: `${type}@${avgX.toFixed(1)}`, type, x: avgX, y: 0 });
      }
      features.sort((f1, f2) => f1.x - f2.x);
      return features;
    }

    // rational mode
    const features = [];
    const gapOk = Math.abs(p.hole - p.asy) >= HOLE_ASYMPTOTE_MIN_GAP;
    features.push({ id: `asymptote@${p.asy.toFixed(1)}`, type: "asymptote", x: p.asy, y: null });
    if (gapOk) {
      const holeY = p.ra / (p.hole - p.asy);
      features.push({ id: `hole@${p.hole.toFixed(1)}`, type: "hole", x: p.hole, y: holeY });
    }
    features.sort((f1, f2) => f1.x - f2.x);
    return features;
  }

  const FEATURE_LABELS = {
    crossing: "Crossing",
    kiss: "Double root (kiss)",
    asymptote: "Asymptote",
    hole: "Hole",
  };

  // ---------- checklist UI ----------

  const featureRows = new Map(); // featureId -> row element, refreshed each renderChecklist()

  function renderChecklist(features) {
    const seen = new Set(features.map((f) => f.id));
    // drop stale flags for features that no longer exist at this slider position
    Object.keys(flags).forEach((id) => { if (!seen.has(id)) delete flags[id]; });

    featureRows.clear();
    checklistItems.innerHTML = "";
    features.forEach((f) => {
      const row = document.createElement("label");
      row.className = "checklist__row";
      row.dataset.featureId = f.id;
      featureRows.set(f.id, row);

      const box = document.createElement("input");
      box.type = "checkbox";
      box.checked = !!flags[f.id];
      box.disabled = !!sim;
      box.addEventListener("change", () => onFlagToggle(f, box.checked));

      const text = document.createElement("span");
      text.textContent = `${FEATURE_LABELS[f.type]} near x = ${f.x.toFixed(1)}`;

      row.appendChild(box);
      row.appendChild(text);
      checklistItems.appendChild(row);
    });

    if (features.length === 0) {
      checklistItems.innerHTML = '<p class="checklist__empty">No features detected at this configuration.</p>';
    }
  }

  function onFlagToggle(feature, checked) {
    flags[feature.id] = checked;
    // Mission spec: flagging an asymptote before running the simulator is worth its own XP,
    // paid out once per distinct feature (toggling on/off/on again does not re-pay it).
    if (checked && feature.type === "asymptote" && !sim && !asymptoteXpAwarded.has(feature.id)) {
      asymptoteXpAwarded.add(feature.id);
      const rec = addXP(20);
      status.textContent = `Asymptote flagged before launch. +20 XP — total ${rec.xp} XP.`;
      status.className = "lab__status lab__status--ok";
    }
  }

  function clearFeatureRowClass(id) {
    const row = featureRows.get(id);
    if (row) row.classList.remove("checklist__row--ok", "checklist__row--missed");
  }

  function markFeatureRow(id, outcome) {
    const row = featureRows.get(id);
    if (!row) return;
    row.classList.remove("checklist__row--ok", "checklist__row--missed");
    row.classList.add(outcome === "ok" ? "checklist__row--ok" : "checklist__row--missed");
  }

  // ---------- static render (no simulation running) ----------

  function render() {
    const p = params();

    if (p.mode === "polynomial") {
      outputs.r1.textContent = p.r1.toFixed(1);
      outputs.r2.textContent = p.r2.toFixed(1);
      outputs.r3.textContent = p.r3.toFixed(1);
      outputs.a.textContent = p.a.toFixed(2);

      scene.clear();
      scene.plotFunction(polynomialFn(p), { color: "#e8912d", lineWidth: 2.5 });
      scene.plotPoint(p.r1, 0, { color: "#35c4b8", radius: 5 });
      scene.plotPoint(p.r2, 0, { color: "#35c4b8", radius: 5 });
      scene.plotPoint(p.r3, 0, { color: "#35c4b8", radius: 5 });

      const rightEnd = p.a > 0 ? "UP →" : "DOWN →";
      const leftEnd = p.a > 0 ? "← DOWN" : "← UP";
      readout.textContent = `f(x) = ${p.a.toFixed(2)}(x − ${p.r1.toFixed(1)})(x − ${p.r2.toFixed(1)})(x − ${p.r3.toFixed(1)})   |   end behavior: ${leftEnd}  …  ${rightEnd}`;
    } else {
      outputs.asy.textContent = p.asy.toFixed(1);
      outputs.hole.textContent = p.hole.toFixed(1);
      outputs.ra.textContent = p.ra.toFixed(2);

      scene.clear();
      scene.plotFunction(rationalFn(p), { color: "#e8912d", lineWidth: 2.5 });
      const gapOk = Math.abs(p.hole - p.asy) >= HOLE_ASYMPTOTE_MIN_GAP;
      if (gapOk) {
        const holeY = p.ra / (p.hole - p.asy);
        scene.plotPoint(p.hole, holeY, { color: "#e8912d", radius: 5, open: true });
      }
      readout.textContent = `f(x) = ${p.ra.toFixed(2)}(x − ${p.hole.toFixed(1)}) / [(x − ${p.asy.toFixed(1)})(x − ${p.hole.toFixed(1)})]` +
        (gapOk ? `   |   asymptote at x = ${p.asy.toFixed(1)}, hole at x = ${p.hole.toFixed(1)}` :
          "   |   move the hole away from the asymptote to separate the two features");
    }

    renderChecklist(computeFeatures(p));
  }

  // ---------- mode switching ----------

  function setMode(next) {
    if (mode === next) return;
    mode = next;
    flags = {};
    modeButtons.polynomial.classList.toggle("lab__mode-btn--active", mode === "polynomial");
    modeButtons.rational.classList.toggle("lab__mode-btn--active", mode === "rational");
    polyControls.style.display = mode === "polynomial" ? "" : "none";
    rationalControls.style.display = mode === "rational" ? "" : "none";
    checkBtn.style.display = mode === "polynomial" ? "" : "none";
    newTargetBtn.style.display = mode === "polynomial" ? "" : "none";
    updateBrief();
    render();
  }

  function updateBrief() {
    if (mode === "polynomial") {
      newRequirement();
    } else {
      requirement = null;
      brief.textContent = "Rational inspection: flag the asymptote and the hole, then run the simulator and see if the cart survives the ride.";
      status.textContent = "Adjust the asymptote/hole/scale, flag what you see, then run the simulator.";
      status.className = "lab__status";
    }
  }

  function newRequirement() {
    const direction = Math.random() < 0.5 ? "up" : "down";
    const requireDoubleRoot = Math.random() < 0.5;
    requirement = { direction, requireDoubleRoot };
    brief.textContent = `Inspection order: the right end of the track must launch ${direction.toUpperCase()}` +
      (requireDoubleRoot ? ", and the profile must include one double root (a ground-kiss, not a crossing)." : ".");
    status.textContent = "Adjust the roots and leading coefficient, then certify — or run the simulator to stress-test it.";
    status.className = "lab__status";
  }

  function hasDoubleRoot(p) {
    const pairs = [[p.r1, p.r2], [p.r1, p.r3], [p.r2, p.r3]];
    return pairs.some(([x, y]) => Math.abs(x - y) < KISS_TOLERANCE);
  }

  function certify() {
    if (!requirement || mode !== "polynomial") return;
    const p = params();
    const directionOk = requirement.direction === "up" ? p.a > 0 : p.a < 0;
    const doubleRootOk = !requirement.requireDoubleRoot || hasDoubleRoot(p);

    if (directionOk && doubleRootOk) {
      certifications += 1;
      let xp = 20 + (requirement.requireDoubleRoot ? 15 : 0);
      const rec = addXP(xp);
      status.textContent = `Track certified (${certifications}/3 for the badge). +${xp} XP — total ${rec.xp} XP.`;
      status.className = "lab__status lab__status--ok";
      if (certifications >= 3) {
        awardBadge();
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

  // ---------- simulator: the cart rides the track, missed features bite back ----------

  function setControlsDisabled(disabled) {
    Object.values(sliders).forEach((s) => { s.disabled = disabled; });
    modeButtons.polynomial.disabled = disabled;
    modeButtons.rational.disabled = disabled;
    checkBtn.disabled = disabled;
    newTargetBtn.disabled = disabled;
    runBtn.disabled = disabled;
    checklistItems.querySelectorAll("input[type=checkbox]").forEach((b) => { b.disabled = disabled; });
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(t) { return Math.max(0, Math.min(1, t)); }
  function easeInQuad(t) { return t * t; }

  function drawSceneBase(p) {
    scene.clear();
    scene.plotFunction(trackFn(p), { color: "#e8912d", lineWidth: 2.5 });
    if (p.mode === "polynomial") {
      scene.plotPoint(p.r1, 0, { color: "#35c4b8", radius: 5 });
      scene.plotPoint(p.r2, 0, { color: "#35c4b8", radius: 5 });
      scene.plotPoint(p.r3, 0, { color: "#35c4b8", radius: 5 });
    } else {
      const gapOk = Math.abs(p.hole - p.asy) >= HOLE_ASYMPTOTE_MIN_GAP;
      if (gapOk) {
        const holeY = p.ra / (p.hole - p.asy);
        scene.plotPoint(p.hole, holeY, { color: "#e8912d", radius: 5, open: true });
      }
    }
  }

  function runSimulation() {
    if (sim) return;
    const p = params();
    const fn = trackFn(p);
    const features = computeFeatures(p);

    // clear any stale outcome styling from a previous run
    features.forEach((f) => clearFeatureRowClass(f.id));

    sim = {
      p, fn, features,
      nextFeatureIdx: 0,
      xStart: -9, xEnd: 9,
      travelDurationMs: 4500,
      startTime: null,
      pauseAccum: 0,        // ms subtracted from elapsed travel time by "hole" pauses
      phase: "travel",      // "travel" | "vanish" | "bounce" | "flyoff" | "done"
      phaseFeature: null,
      phaseStart: 0,
      haltReason: null,
    };

    setControlsDisabled(true);
    status.textContent = "Simulator running…";
    status.className = "lab__status";
    requestAnimationFrame(stepSimulation);
  }

  function stepSimulation(ts) {
    if (!sim) return;
    if (sim.startTime === null) sim.startTime = ts;

    if (sim.phase === "travel") {
      const elapsed = (ts - sim.startTime) - sim.pauseAccum;
      const t = clamp01(elapsed / sim.travelDurationMs);
      const x = lerp(sim.xStart, sim.xEnd, t);
      let y = sim.fn(x);
      if (!Number.isFinite(y)) y = 0; // riding straight through a momentary NaN (e.g. exact asymptote sample)

      // process any features the cart has now reached, in order
      while (sim.nextFeatureIdx < sim.features.length && sim.features[sim.nextFeatureIdx].x <= x) {
        const feature = sim.features[sim.nextFeatureIdx];
        const flagged = !!flags[feature.id];
        sim.nextFeatureIdx += 1;

        if (flagged) {
          markFeatureRow(feature.id, "ok");
          continue;
        }

        // missed feature — reaction depends on type
        markFeatureRow(feature.id, "missed");
        if (feature.type === "crossing") {
          // spec: dot behavior unaffected, just note it wasn't flagged
          continue;
        }
        if (feature.type === "hole") {
          sim.phase = "vanish";
          sim.phaseFeature = feature;
          sim.phaseStart = ts;
          sim.freezeX = feature.x;
          sim.freezeY = feature.y;
          break;
        }
        if (feature.type === "kiss") {
          sim.phase = "bounce";
          sim.phaseFeature = feature;
          sim.phaseStart = ts;
          sim.freezeX = feature.x;
          sim.haltReason = `Unflagged double root at x = ${feature.x.toFixed(1)} — the cart hit the ground instead of kissing off it.`;
          break;
        }
        if (feature.type === "asymptote") {
          sim.phase = "flyoff";
          sim.phaseFeature = feature;
          sim.phaseStart = ts;
          sim.freezeX = feature.x;
          sim.flyDirection = sim.fn(feature.x - 0.05) > 0 ? 1 : -1; // launch the way the wall is already pointing
          sim.haltReason = `Unflagged asymptote at x = ${feature.x.toFixed(1)} — the cart launched straight through the guardrail.`;
          break;
        }
      }

      if (sim.phase === "travel") {
        drawSceneBase(sim.p);
        scene.plotPoint(x, y, { color: "#f3eee1", radius: 6 });
        if (t >= 1) { finishSimulation(true); return; }
        requestAnimationFrame(stepSimulation);
        return;
      }
      // fall through into the new phase on the same frame
    }

    if (sim.phase === "vanish") {
      const dur = 600;
      const el = ts - sim.phaseStart;
      drawSceneBase(sim.p);
      const visible = el < dur * 0.3 || el > dur * 0.7; // vanish for the middle stretch, reappear after
      if (visible) scene.plotPoint(sim.freezeX, sim.freezeY, { color: "#f3eee1", radius: 6 });
      if (el >= dur) {
        sim.pauseAccum += dur;
        sim.phase = "travel";
      }
      requestAnimationFrame(stepSimulation);
      return;
    }

    if (sim.phase === "bounce") {
      const dur = 700;
      const el = clamp01((ts - sim.phaseStart) / dur);
      // simple up-down bounce off the ground line (y = 0), independent of the track curve
      const bounceY = Math.abs(Math.sin(el * Math.PI * 2.2)) * 2.2 * (1 - el);
      drawSceneBase(sim.p);
      scene.plotPoint(sim.freezeX, bounceY, { color: "#d9636b", radius: 6 });
      if (el >= 1) { finishSimulation(false); return; }
      requestAnimationFrame(stepSimulation);
      return;
    }

    if (sim.phase === "flyoff") {
      const dur = 800;
      const el = clamp01((ts - sim.phaseStart) / dur);
      const y = sim.flyDirection * easeInQuad(el) * 40; // rockets well past yRange = ±12
      drawSceneBase(sim.p);
      scene.plotPoint(sim.freezeX, y, { color: "#d9636b", radius: 6 });
      if (el >= 1) { finishSimulation(false); return; }
      requestAnimationFrame(stepSimulation);
      return;
    }
  }

  function finishSimulation(success) {
    const finishedFeatures = sim.features;
    const haltReason = sim.haltReason;
    sim = null;
    setControlsDisabled(false);

    if (success) {
      const missedCrossings = finishedFeatures.filter((f) => f.type === "crossing" && !flags[f.id]).length;
      const missedHoles = finishedFeatures.filter((f) => f.type === "hole" && !flags[f.id]).length;
      const flaggedKisses = finishedFeatures.filter((f) => f.type === "kiss" && flags[f.id]).length;
      certifications += 1;
      let xp = 20 + flaggedKisses * 15;
      const rec = addXP(xp);
      let msg = `Simulation complete — the cart made it through. +${xp} XP — total ${rec.xp} XP.`;
      if (missedCrossings || missedHoles) {
        msg += ` (${missedCrossings + missedHoles} feature${missedCrossings + missedHoles === 1 ? "" : "s"} went unflagged — check the highlighted rows.)`;
      }
      status.textContent = msg;
      status.className = "lab__status lab__status--ok";
      if (certifications >= 3 && mode === "polynomial") {
        awardBadge();
        status.textContent += " Badge earned: Track Certified ★";
      }
    } else {
      status.textContent = `Simulation failed. ${haltReason} Flag it next time and re-run.`;
      status.className = "lab__status lab__status--warn";
    }
  }

  // ---------- wiring ----------

  Object.values(sliders).forEach((s) => s.addEventListener("input", render));
  checkBtn.addEventListener("click", certify);
  newTargetBtn.addEventListener("click", () => { addXP(5); newRequirement(); render(); });
  runBtn.addEventListener("click", runSimulation);
  modeButtons.polynomial.addEventListener("click", () => setMode("polynomial"));
  modeButtons.rational.addEventListener("click", () => setMode("rational"));

  updateBrief();
  render();
  refreshXpBadge();
})();
