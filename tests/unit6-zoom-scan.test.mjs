import { test } from "node:test";
import assert from "node:assert/strict";
import { loadUnit, click, waitFor } from "./dom-harness.mjs";

function xpFor(window) {
  const data = JSON.parse(window.localStorage.getItem("trajectory:progress") || "{}");
  return data["unit-6-limits-gateway"]?.xp || 0;
}

// This animation is driven by dispatching real 'input' events on the zoom
// slider every frame (see runZoomScan()), which does noticeably more
// synchronous work per frame than units 3/4's animations. Its 3000ms
// duration is *virtual* animation time — how long the underlying
// setImmediate queue actually takes to flush in real time varies with
// system load, so these tests poll for the real completion signal
// (zoomScanBtn re-enabling) rather than guessing a fixed real-time delay.

test("unit 6: 'Run zoom scan' locks controls, animates, and lands the slider at max", async () => {
  const { document } = await loadUnit("unit-6-limits-gateway");
  const btn = document.getElementById("zoom-scan-btn");
  const zoomSlider = document.getElementById("slider-zoom");

  assert.equal(btn.disabled, false);
  click(btn);
  assert.equal(btn.disabled, true, "controls should lock during the scan");
  assert.equal(zoomSlider.disabled, true);
  assert.equal(document.getElementById("sensor-select").disabled, true);
  assert.equal(document.getElementById("check-btn").disabled, true);
  assert.match(document.getElementById("status").textContent, /Scanning/);

  await waitFor(() => !btn.disabled, { timeoutMs: 5000 });
  assert.equal(parseFloat(zoomSlider.value), parseFloat(zoomSlider.max), "the scan should land exactly at max zoom");
});

test("unit 6: the scan drives the *same* zoom-to-max XP path a manual drag would, not a separate one", async () => {
  const { document, window } = await loadUnit("unit-6-limits-gateway");
  const btn = document.getElementById("zoom-scan-btn");
  click(btn);
  await waitFor(() => !btn.disabled, { timeoutMs: 5000 });
  assert.equal(xpFor(window), 10, "scan should pay the same 10 XP the manual zoom-to-max drag pays");
  assert.match(document.getElementById("status").textContent, /Zoomed to max resolution/);
});

test("unit 6: the readout at the end of a scan shows both samples tightly converged on the limit", async () => {
  const { document } = await loadUnit("unit-6-limits-gateway");
  // newSensor() picks a random sensor on load, so read which one rather
  // than assuming index 0.
  const LIMITS = [4, 2, 12, 1];
  const limit = LIMITS[parseInt(document.getElementById("sensor-select").value, 10)];

  const btn = document.getElementById("zoom-scan-btn");
  click(btn);
  await waitFor(() => !btn.disabled, { timeoutMs: 5000 });
  const m = document.getElementById("readout").textContent.match(/≈ (-?\d+\.\d+)\s+f\(.*?≈ (-?\d+\.\d+)/);
  assert.ok(m);
  const [, leftVal, rightVal] = m.map(Number);
  assert.ok(Math.abs(leftVal - limit) < 0.01, `left sample ${leftVal} should be near ${limit}`);
  assert.ok(Math.abs(rightVal - limit) < 0.01, `right sample ${rightVal} should be near ${limit}`);
});

test("unit 6: scanning again after zoom-max XP was already earned doesn't pay it twice", async () => {
  const { document, window } = await loadUnit("unit-6-limits-gateway");
  const btn = document.getElementById("zoom-scan-btn");
  click(btn);
  await waitFor(() => !btn.disabled, { timeoutMs: 5000 });
  assert.equal(xpFor(window), 10);

  click(btn);
  await waitFor(() => !btn.disabled, { timeoutMs: 5000 });
  assert.equal(xpFor(window), 10, "a second scan should not pay the zoom-to-max XP again");
});

test("unit 6: clicking 'Run zoom scan' twice in a row is a no-op while already running", async () => {
  const { document } = await loadUnit("unit-6-limits-gateway");
  const btn = document.getElementById("zoom-scan-btn");
  click(btn);
  const statusAfterFirstClick = document.getElementById("status").textContent;
  click(btn); // should be ignored — a second scan loop must not start
  assert.equal(document.getElementById("status").textContent, statusAfterFirstClick);
  await waitFor(() => !btn.disabled, { timeoutMs: 5000 });
});
