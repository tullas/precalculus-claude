import { test } from "node:test";
import assert from "node:assert/strict";
import { loadUnit, click, waitFor } from "./dom-harness.mjs";

function xpFor(window) {
  const data = JSON.parse(window.localStorage.getItem("trajectory:progress") || "{}");
  return data["unit-4-cycles-and-waves"]?.xp || 0;
}

// The sweep's 4000ms duration is *virtual* animation time — the RAF stub
// advances it near-instantly in real time via a queue of setImmediate
// callbacks. How long that queue actually takes to flush varies with
// system load, so these tests poll for the real completion signal
// (sweepBtn re-enabling) rather than guessing a fixed real-time delay.

test("unit 4: 'Sweep full revolution' locks controls, animates, and lands the slider at max", async () => {
  const { document } = await loadUnit("unit-4-cycles-and-waves");
  const sweepBtn = document.getElementById("sweep-btn");
  const slider = document.getElementById("slider-theta");

  assert.equal(sweepBtn.disabled, false);
  click(sweepBtn);
  assert.equal(sweepBtn.disabled, true, "controls should lock during the sweep");
  assert.equal(slider.disabled, true);
  assert.match(document.getElementById("status").textContent, /Sweeping/);

  await waitFor(() => !sweepBtn.disabled, { timeoutMs: 5000 });
  assert.equal(parseFloat(slider.value), parseFloat(slider.max), "the sweep should land exactly at the full-circle end");
});

test("unit 4: the sweep drives the *same* revolution-XP path a manual drag would, not a separate one", async () => {
  const { document, window } = await loadUnit("unit-4-cycles-and-waves");
  const sweepBtn = document.getElementById("sweep-btn");
  click(sweepBtn);
  await waitFor(() => !sweepBtn.disabled, { timeoutMs: 5000 });
  assert.equal(xpFor(window), 10, "sweep should pay the same 10 XP the manual full-revolution drag pays");
  assert.match(document.getElementById("status").textContent, /Full revolution logged/);
});

test("unit 4: sweeping again after the revolution XP was already earned doesn't pay it twice", async () => {
  const { document, window } = await loadUnit("unit-4-cycles-and-waves");
  const sweepBtn = document.getElementById("sweep-btn");
  click(sweepBtn);
  await waitFor(() => !sweepBtn.disabled, { timeoutMs: 5000 });
  assert.equal(xpFor(window), 10);

  click(sweepBtn);
  await waitFor(() => !sweepBtn.disabled, { timeoutMs: 5000 });
  assert.equal(xpFor(window), 10, "a second sweep should not pay the revolution XP again");
  assert.match(document.getElementById("status").textContent, /Sweep complete/);
});

test("unit 4: clicking 'Sweep' twice in a row is a no-op while already running", async () => {
  const { document } = await loadUnit("unit-4-cycles-and-waves");
  const sweepBtn = document.getElementById("sweep-btn");
  click(sweepBtn);
  const statusAfterFirstClick = document.getElementById("status").textContent;
  click(sweepBtn); // should be ignored — a second sweep loop must not start
  assert.equal(document.getElementById("status").textContent, statusAfterFirstClick);
  await waitFor(() => !sweepBtn.disabled, { timeoutMs: 5000 });
});
