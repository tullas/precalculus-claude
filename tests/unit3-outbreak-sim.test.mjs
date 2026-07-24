import { test } from "node:test";
import assert from "node:assert/strict";
import { loadUnit, setSlider, click } from "./dom-harness.mjs";

function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }

test("unit 3: 'Run outbreak simulation' disables controls, animates, then scores exactly like a manual check", async () => {
  const { document } = await loadUnit("unit-3-cosmic-scales");
  const runBtn = document.getElementById("run-btn");
  const checkBtn = document.getElementById("check-btn");
  const n0Slider = document.getElementById("slider-n0");
  const status = document.getElementById("status");

  const thresholdMatch = document.getElementById("target-brief").textContent.match(/exceed ([\d,]+)/);
  const threshold = Number(thresholdMatch[1].replace(/,/g, ""));
  const n0 = parseFloat(n0Slider.value);
  const r = parseFloat(document.getElementById("slider-r").value);
  const trueDay = Math.log(threshold / n0) / Math.log(1 + r);
  setSlider(document.getElementById("slider-guess"), trueDay);

  assert.equal(runBtn.disabled, false);
  click(runBtn);
  assert.equal(runBtn.disabled, true, "controls should lock during the animation");
  assert.equal(checkBtn.disabled, true);
  assert.match(status.textContent, /Simulating outbreak/);

  await sleep(300); // animation is 3200ms of *virtual* time, but the RAF stub
  // advances that near-instantly in real time — just need enough real ms for
  // the ~192 queued setImmediate callbacks to flush, well before checkEstimate's
  // own 1600ms post-success status-clear timeout would fire.
  assert.equal(runBtn.disabled, false, "controls should unlock once the animation finishes");
  assert.match(status.textContent, /^Correct/, "the animation should end by scoring exactly like a manual check");
});

test("unit 3: clicking 'Run outbreak simulation' twice in a row is a no-op while already running", async () => {
  const { document } = await loadUnit("unit-3-cosmic-scales");
  const runBtn = document.getElementById("run-btn");
  click(runBtn);
  const statusAfterFirstClick = document.getElementById("status").textContent;
  click(runBtn); // should be ignored — a second animation loop must not start
  assert.equal(document.getElementById("status").textContent, statusAfterFirstClick);
  await sleep(300);
  assert.equal(runBtn.disabled, false);
});

test("unit 3: an incorrect guess run through the simulator is scored as incorrect, same as a manual check", async () => {
  const { document } = await loadUnit("unit-3-cosmic-scales");
  const guessSlider = document.getElementById("slider-guess");
  setSlider(guessSlider, parseFloat(guessSlider.min)); // day 0 — essentially never the true crossing day
  click(document.getElementById("run-btn"));
  await sleep(300);
  assert.match(document.getElementById("status").textContent, /^Off target/);
});
