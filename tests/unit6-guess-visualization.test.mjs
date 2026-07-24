import { test } from "node:test";
import assert from "node:assert/strict";
import { loadUnit, setSlider } from "./dom-harness.mjs";

// Bug report: "the limit estimate slider is not functioning... it's
// moving nothing in the graph." Confirmed — render() computed `guess`
// but only ever wrote it into the numeric readout, never plotted it. A
// student dragging the one slider this whole unit revolves around would
// see literally nothing respond on the canvas.

test("unit 6: moving the 'Your limit estimate' slider actually draws something on the canvas", async () => {
  const { document, ctx } = await loadUnit("unit-6-limits-gateway");
  ctx.__calls.length = 0; // clear whatever the initial render produced

  setSlider(document.getElementById("slider-guess"), 7);

  const dashedLineDrawn = ctx.__calls.some(([name]) => name === "setLineDash");
  const labelDrawn = ctx.__calls.some(([name, args]) => name === "fillText" && args[0] === "your estimate");
  assert.ok(dashedLineDrawn, "moving the guess slider should draw a guide line on the canvas");
  assert.ok(labelDrawn, "the guide line should be labeled so it's clear what it represents");
});

test("unit 6: the guess guide line is drawn as a horizontal line at the slider's value", async () => {
  const { document, ctx } = await loadUnit("unit-6-limits-gateway");
  const guessSlider = document.getElementById("slider-guess");

  for (const guessValue of [-1, 3.5, 9]) {
    ctx.__calls.length = 0;
    setSlider(guessSlider, guessValue);

    // Find the dashed-line draw: a setLineDash with a non-empty pattern,
    // immediately followed by the moveTo/lineTo pair that draws it.
    const dashIdx = ctx.__calls.findIndex(([name, args]) => name === "setLineDash" && args[0].length > 0);
    assert.notEqual(dashIdx, -1, `guess=${guessValue}: expected a dashed line to be drawn`);
    const afterDash = ctx.__calls.slice(dashIdx);
    const moveTo = afterDash.find(([name]) => name === "moveTo");
    const lineTo = afterDash.find(([name]) => name === "lineTo");
    assert.ok(moveTo && lineTo, `guess=${guessValue}: expected a moveTo/lineTo pair for the guide line`);
    assert.equal(moveTo[1][1], lineTo[1][1], `guess=${guessValue}: guide line should be horizontal (same y-pixel at both ends)`);
  }
});
