import { test } from "node:test";
import assert from "node:assert/strict";
import { loadUnit, setSlider } from "./dom-harness.mjs";

// Regression test for the bug fixed in commit 986c23d: matrixOf() was only
// scaling the diagonal terms, so non-uniform scale (sx != sy) silently
// sheared the sprite instead of composing R(theta) * S(sx, sy). Any theta
// that isn't a multiple of pi will expose it, since sin(theta) = 0 makes
// the old and new formulas agree by coincidence.
test("unit 5: transform matrix composes rotation and non-uniform scale correctly", async () => {
  const { document } = await loadUnit("unit-5-cgi-engine-vectors");

  const theta = Math.PI / 2; // slider is in raw radians, range [0, 2π]
  const sx = 2, sy = 0.5;
  setSlider(document.getElementById("slider-theta"), theta);
  setSlider(document.getElementById("slider-sx"), sx);
  setSlider(document.getElementById("slider-sy"), sy);

  const readout = document.getElementById("readout").textContent;
  const m = readout.match(/M = \[ (-?\d+\.\d+)\s+(-?\d+\.\d+) ; (-?\d+\.\d+)\s+(-?\d+\.\d+) \]/);
  assert.ok(m, `could not parse matrix out of readout: "${readout}"`);
  const [, m00, m01, m10, m11] = m.map(Number);

  const c = Math.cos(theta), s = Math.sin(theta);
  const expected = [[c * sx, -s * sy], [s * sx, c * sy]];

  assert.ok(Math.abs(m00 - expected[0][0]) < 0.02, `m00: got ${m00}, expected ~${expected[0][0]}`);
  assert.ok(Math.abs(m01 - expected[0][1]) < 0.02, `m01: got ${m01}, expected ~${expected[0][1]} (this is the entry the shear bug broke)`);
  assert.ok(Math.abs(m10 - expected[1][0]) < 0.02, `m10: got ${m10}, expected ~${expected[1][0]} (this is the entry the shear bug broke)`);
  assert.ok(Math.abs(m11 - expected[1][1]) < 0.02, `m11: got ${m11}, expected ~${expected[1][1]}`);
});
