import { test } from "node:test";
import assert from "node:assert/strict";
import { loadUnit, setSlider, click } from "./dom-harness.mjs";

// Unit 3: N(t) = n0 * (1+r)^t. The "true crossing day" the app computes
// internally (log(threshold/n0) / log(1+r)) is only ever surfaced in text,
// never exposed directly — these tests treat that formula as the source of
// truth (it's the standard closed-form solution for exponential growth)
// and check the app's pass/fail judgment and displayed numbers against it.

test("unit 3: a guess within tolerance of the true crossing day is accepted", async () => {
  const { document } = await loadUnit("unit-3-cosmic-scales");
  const n0Slider = document.getElementById("slider-n0");
  const rSlider = document.getElementById("slider-r");
  const guessSlider = document.getElementById("slider-guess");
  const status = document.getElementById("status");

  const thresholdMatch = document.getElementById("target-brief").textContent.match(/exceed ([\d,]+)/);
  const threshold = Number(thresholdMatch[1].replace(/,/g, ""));
  const n0 = parseFloat(n0Slider.value);
  const r = parseFloat(rSlider.value);
  const trueDay = Math.log(threshold / n0) / Math.log(1 + r);

  setSlider(guessSlider, trueDay);
  click(document.getElementById("check-btn"));
  assert.match(status.textContent, /^Correct/);
  assert.match(status.textContent, new RegExp(`day ${trueDay.toFixed(1)}`));
});

test("unit 3: a guess well outside tolerance is rejected and reports the true day", async () => {
  const { document } = await loadUnit("unit-3-cosmic-scales");
  const n0Slider = document.getElementById("slider-n0");
  const rSlider = document.getElementById("slider-r");
  const guessSlider = document.getElementById("slider-guess");
  const status = document.getElementById("status");

  const thresholdMatch = document.getElementById("target-brief").textContent.match(/exceed ([\d,]+)/);
  const threshold = Number(thresholdMatch[1].replace(/,/g, ""));
  const n0 = parseFloat(n0Slider.value);
  const r = parseFloat(rSlider.value);
  const trueDay = Math.log(threshold / n0) / Math.log(1 + r);

  const farGuess = Math.max(parseFloat(guessSlider.min), Math.min(parseFloat(guessSlider.max), trueDay - 5));
  // only meaningful if -5 days actually clears the +-1 day tolerance
  if (Math.abs(farGuess - trueDay) > 1) {
    setSlider(guessSlider, farGuess);
    click(document.getElementById("check-btn"));
    assert.match(status.textContent, /^Off target/);
    assert.match(status.textContent, new RegExp(`day ${trueDay.toFixed(1)}`));
  }
});

test("unit 3: readout's N(guess) matches n0 * (1+r)^guess", async () => {
  const { document } = await loadUnit("unit-3-cosmic-scales");
  setSlider(document.getElementById("slider-n0"), 40);
  setSlider(document.getElementById("slider-r"), 0.2);
  setSlider(document.getElementById("slider-guess"), 10);
  const expected = Math.round(40 * Math.pow(1.2, 10));
  const readout = document.getElementById("readout").textContent;
  assert.match(readout, new RegExp(`N\\(10\\) ≈ ${expected.toLocaleString()}`));
});

// Unit 6: each sensor is an algebraically-simplifiable 0/0 form. At high
// zoom, sampling just to either side of the discontinuity should converge
// tightly on the known limit, and submitting that limit as the guess
// should be accepted.

test("unit 6: all four sensors converge to their documented limit at max zoom", async () => {
  const EXPECTED = [
    { label: "(x² − 4) / (x − 2)", limit: 4 },
    { label: "(x² − 1) / (x − 1)", limit: 2 },
    { label: "(x³ − 8) / (x − 2)", limit: 12 },
    { label: "sin(x) / x", limit: 1 },
  ];

  for (let i = 0; i < EXPECTED.length; i++) {
    const { document } = await loadUnit("unit-6-limits-gateway");
    const select = document.getElementById("sensor-select");
    select.value = String(i);
    select.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
    setSlider(document.getElementById("slider-zoom"), document.getElementById("slider-zoom").max);

    const readout = document.getElementById("readout").textContent;
    const m = readout.match(/≈ (-?\d+\.\d+)\s+f\(.*?≈ (-?\d+\.\d+)/);
    assert.ok(m, `unit 6 [${EXPECTED[i].label}]: readout should report both sample values`);
    const [, leftVal, rightVal] = m.map(Number);
    assert.ok(Math.abs(leftVal - EXPECTED[i].limit) < 0.01, `${EXPECTED[i].label}: left sample ${leftVal} should be near ${EXPECTED[i].limit}`);
    assert.ok(Math.abs(rightVal - EXPECTED[i].limit) < 0.01, `${EXPECTED[i].label}: right sample ${rightVal} should be near ${EXPECTED[i].limit}`);

    setSlider(document.getElementById("slider-guess"), EXPECTED[i].limit);
    click(document.getElementById("check-btn"));
    assert.match(document.getElementById("status").textContent, /^Correct/, `${EXPECTED[i].label}: guessing the documented limit should be accepted`);
  }
});

test("unit 6: a guess well outside tolerance is rejected", async () => {
  const { document } = await loadUnit("unit-6-limits-gateway");
  // default sensor is SENSORS[0], limit 4
  setSlider(document.getElementById("slider-guess"), 9);
  click(document.getElementById("check-btn"));
  assert.match(document.getElementById("status").textContent, /^Not yet/);
});
