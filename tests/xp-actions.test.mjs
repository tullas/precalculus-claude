import { test } from "node:test";
import assert from "node:assert/strict";
import { loadUnit, setSlider, click } from "./dom-harness.mjs";

function xpFor(window, unitId) {
  const data = JSON.parse(window.localStorage.getItem("trajectory:progress") || "{}");
  return data[unitId]?.xp || 0;
}

// lab.js's post-match setTimeout (1400-1600ms) generates the next round's
// random target; waiting for target-brief's *text* to change would be
// flaky since the random target can legitimately repeat the previous one.
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Regression tests for the XP-wiring fixes made after the initial test suite
// shipped: each unit's mission-brief.md names a specific "small" action worth
// XP (move a slider, toggle a view, complete a revolution, apply a
// transform) — the original wiring paid that XP on the unrelated "new
// target" button click instead, and three units silently dropped the
// "N correct in a session" bonus XP entirely (the badge still fired, the
// bonus just never got added).

test("unit 1: moving each slider once pays 10 XP per slider, not on new-target", async () => {
  const UNIT_ID = "unit-1-morphing-machines";
  const { document, window } = await loadUnit("unit-1-morphing-machines");

  click(document.getElementById("new-target-btn"));
  assert.equal(xpFor(window, UNIT_ID), 0, "new-target click should not pay XP");

  setSlider(document.getElementById("slider-a"), 2);
  assert.equal(xpFor(window, UNIT_ID), 10, "first move of slider a should pay 10 XP");
  setSlider(document.getElementById("slider-a"), 1.5);
  assert.equal(xpFor(window, UNIT_ID), 10, "second move of the same slider should not pay again");

  setSlider(document.getElementById("slider-b"), 2);
  setSlider(document.getElementById("slider-h"), 1);
  setSlider(document.getElementById("slider-k"), 1);
  assert.equal(xpFor(window, UNIT_ID), 40, "all four sliders moved once each = 40 XP");
});

test("unit 3: the +15 three-estimate bonus is actually paid (not just the badge)", async () => {
  const UNIT_ID = "unit-3-cosmic-scales";
  const { document, window } = await loadUnit("unit-3-cosmic-scales");
  const n0Slider = document.getElementById("slider-n0");
  const rSlider = document.getElementById("slider-r");
  const guessSlider = document.getElementById("slider-guess");
  const checkBtn = document.getElementById("check-btn");
  const status = document.getElementById("status");

  for (let round = 0; round < 3; round++) {
    const briefTextBefore = document.getElementById("target-brief").textContent;
    const thresholdMatch = briefTextBefore.match(/exceed ([\d,]+)/);
    const threshold = Number(thresholdMatch[1].replace(/,/g, ""));
    const n0 = parseFloat(n0Slider.value);
    const r = parseFloat(rSlider.value);
    const trueDay = Math.log(threshold / n0) / Math.log(1 + r);
    setSlider(guessSlider, Math.max(parseFloat(guessSlider.min), Math.min(parseFloat(guessSlider.max), trueDay)));
    click(checkBtn);
    assert.match(status.textContent, /Correct/, `round ${round}: expected a correct-estimate match`);
    if (round < 2) await sleep(1700); // lab.js schedules the next target via setTimeout(...,1600)
  }

  assert.match(status.textContent, /\+15 bonus XP/, "the 3rd correct estimate should mention the +15 bonus");
  assert.equal(xpFor(window, UNIT_ID), 25 * 3 + 15, "total XP should include base rewards plus the bonus");
});

test("unit 4: the +20 three-match bonus is actually paid (not just the badge)", async () => {
  const UNIT_ID = "unit-4-cycles-and-waves";
  const { document, window } = await loadUnit("unit-4-cycles-and-waves");
  const slider = document.getElementById("slider-theta");
  const checkBtn = document.getElementById("check-btn");
  const status = document.getElementById("status");

  for (let round = 0; round < 3; round++) {
    const briefTextBefore = document.getElementById("target-brief").textContent;
    const m = briefTextBefore.match(/θ = (-?\d+\.\d+)π rad/);
    const targetTheta = parseFloat(m[1]) * Math.PI;
    setSlider(slider, targetTheta);
    click(checkBtn);
    assert.match(status.textContent, /locked/i, `round ${round}: expected a signal-locked match`);
    if (round < 2) await sleep(1500); // lab.js schedules the next target via setTimeout(...,1400)
  }

  assert.match(status.textContent, /\+20 bonus XP/, "the 3rd match should mention the +20 bonus");
  assert.equal(xpFor(window, UNIT_ID), 20 * 3 + 20, "total XP should include base rewards plus the bonus");
});

test("unit 3: toggling log view pays its 10 XP once, not on every toggle", async () => {
  const UNIT_ID = "unit-3-cosmic-scales";
  const { document, window } = await loadUnit("unit-3-cosmic-scales");
  const toggle = document.getElementById("toggle-log");

  toggle.checked = true;
  toggle.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
  assert.equal(xpFor(window, UNIT_ID), 10);

  toggle.checked = false;
  toggle.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
  toggle.checked = true;
  toggle.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
  assert.equal(xpFor(window, UNIT_ID), 10, "further toggles should not pay XP again");
});

test("unit 4: a full revolution of the dial pays 10 XP once, not on new-target", async () => {
  const UNIT_ID = "unit-4-cycles-and-waves";
  const { document, window } = await loadUnit("unit-4-cycles-and-waves");
  const slider = document.getElementById("slider-theta");

  click(document.getElementById("new-target-btn"));
  assert.equal(xpFor(window, UNIT_ID), 0, "new-target click should not pay XP");

  setSlider(slider, slider.max);
  assert.equal(xpFor(window, UNIT_ID), 10, "reaching the full-circle end should pay 10 XP");
  setSlider(slider, 0);
  setSlider(slider, slider.max);
  assert.equal(xpFor(window, UNIT_ID), 10, "a second revolution should not pay again");
});

test("unit 5: applying rotation + non-uniform scale pays 10 XP once, not on new-target", async () => {
  const UNIT_ID = "unit-5-cgi-engine-vectors";
  const { document, window } = await loadUnit("unit-5-cgi-engine-vectors");

  click(document.getElementById("new-target-btn"));
  assert.equal(xpFor(window, UNIT_ID), 0, "new-target click should not pay XP");

  setSlider(document.getElementById("slider-sx"), 2);
  setSlider(document.getElementById("slider-sy"), 2);
  assert.equal(xpFor(window, UNIT_ID), 0, "uniform scale with no rotation should not qualify");

  setSlider(document.getElementById("slider-theta"), Math.PI / 2);
  setSlider(document.getElementById("slider-sy"), 0.5);
  assert.equal(xpFor(window, UNIT_ID), 10, "rotation + non-uniform scale together should pay 10 XP");

  setSlider(document.getElementById("slider-sy"), 0.7);
  assert.equal(xpFor(window, UNIT_ID), 10, "should not pay again once already awarded");
});

test("unit 6: zooming to max pays 10 XP once, not on new-target", async () => {
  const UNIT_ID = "unit-6-limits-gateway";
  const { document, window } = await loadUnit("unit-6-limits-gateway");
  const zoomSlider = document.getElementById("slider-zoom");

  click(document.getElementById("new-target-btn"));
  assert.equal(xpFor(window, UNIT_ID), 0, "new-target click should not pay XP");

  setSlider(zoomSlider, zoomSlider.max);
  assert.equal(xpFor(window, UNIT_ID), 10, "reaching max zoom should pay 10 XP");
  setSlider(zoomSlider, 0);
  setSlider(zoomSlider, zoomSlider.max);
  assert.equal(xpFor(window, UNIT_ID), 10, "zooming to max again should not pay again");
});

test("unit 6: the +15 three-estimate bonus is actually paid (not just the badge)", async () => {
  const UNIT_ID = "unit-6-limits-gateway";
  const { document, window } = await loadUnit("unit-6-limits-gateway");
  const guessSlider = document.getElementById("slider-guess");
  const checkBtn = document.getElementById("check-btn");
  const status = document.getElementById("status");

  for (let round = 0; round < 3; round++) {
    const m = document.getElementById("target-brief").textContent.match(/ERROR at x = /);
    assert.ok(m, `round ${round}: expected the diagnostic brief`);
    const select = document.getElementById("sensor-select");
    const limits = [4, 2, 12, 1];
    const limit = limits[parseInt(select.value, 10)];
    setSlider(guessSlider, limit);
    click(checkBtn);
    assert.match(status.textContent, /^Correct/, `round ${round}: expected a correct estimate`);
    if (round < 2) await sleep(1700); // lab.js schedules the next sensor via setTimeout(...,1500)
  }

  assert.match(status.textContent, /\+15 bonus XP/, "the 3rd correct estimate should mention the +15 bonus");
  assert.equal(xpFor(window, UNIT_ID), 25 * 3 + 15, "total XP should include base rewards plus the bonus");
});
