import { test } from "node:test";
import assert from "node:assert/strict";
import { loadUnit, setSlider, click, waitFor } from "./dom-harness.mjs";

function flagCheckbox(document, featureId, checked) {
  const box = document.querySelector(`[data-feature-id="${featureId}"] input[type="checkbox"]`);
  assert.ok(box, `expected a checklist row for feature "${featureId}"`);
  box.checked = checked;
  box.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
}

async function waitForSimEnd(document) {
  const status = document.getElementById("status");
  await waitFor(() => /Simulation (complete|failed)/.test(status.textContent), { timeoutMs: 4000 });
  return status.textContent;
}

test("unit 2: unflagged double root ends the run with a bounce failure", async () => {
  const { document } = await loadUnit("unit-2-rollercoaster-engineering");
  setSlider(document.getElementById("slider-r1"), 2);
  setSlider(document.getElementById("slider-r2"), 2);
  setSlider(document.getElementById("slider-r3"), 5);

  click(document.getElementById("run-btn"));
  const text = await waitForSimEnd(document);

  assert.match(text, /Simulation failed/);
  assert.match(text, /double root/i);
  const row = document.querySelector('[data-feature-id="kiss@2.0"]');
  assert.ok(row.classList.contains("checklist__row--missed"));
  assert.equal(document.getElementById("run-btn").disabled, false, "controls should re-enable after the run ends");
});

test("unit 2: flagging the double root lets the run complete and pay out XP", async () => {
  const { document } = await loadUnit("unit-2-rollercoaster-engineering");
  setSlider(document.getElementById("slider-r1"), 2);
  setSlider(document.getElementById("slider-r2"), 2);
  setSlider(document.getElementById("slider-r3"), 5);
  flagCheckbox(document, "kiss@2.0", true);
  flagCheckbox(document, "crossing@5.0", true);

  click(document.getElementById("run-btn"));
  const text = await waitForSimEnd(document);

  assert.match(text, /Simulation complete/);
  assert.match(text, /\+\d+ XP/);
  const row = document.querySelector('[data-feature-id="kiss@2.0"]');
  assert.ok(row.classList.contains("checklist__row--ok"));
});

test("unit 2: unflagged asymptote (rational mode) ends the run by flying off-screen", async () => {
  const { document } = await loadUnit("unit-2-rollercoaster-engineering");
  click(document.getElementById("mode-rational"));
  // defaults: asymptote at -2, hole at 3 — leave both unflagged.

  click(document.getElementById("run-btn"));
  const text = await waitForSimEnd(document);

  assert.match(text, /Simulation failed/);
  assert.match(text, /asymptote/i);
});

test("unit 2: unflagged hole is non-fatal — cart vanishes/reappears and the run still succeeds", async () => {
  const { document } = await loadUnit("unit-2-rollercoaster-engineering");
  click(document.getElementById("mode-rational"));
  flagCheckbox(document, "asymptote@-2.0", true);
  // hole@3.0 left unflagged on purpose.

  click(document.getElementById("run-btn"));
  const text = await waitForSimEnd(document);

  assert.match(text, /Simulation complete/);
  assert.match(text, /feature.*unflagged/i);
  const row = document.querySelector('[data-feature-id="hole@3.0"]');
  assert.ok(row.classList.contains("checklist__row--missed"));
});

test("unit 2: flagging an asymptote before running pays the pre-flight XP bonus immediately", async () => {
  const { document, window } = await loadUnit("unit-2-rollercoaster-engineering");
  click(document.getElementById("mode-rational"));

  flagCheckbox(document, "asymptote@-2.0", true);
  assert.match(document.getElementById("status").textContent, /Asymptote flagged before launch.*\+20 XP/);

  const progress = JSON.parse(window.localStorage.getItem("trajectory:progress"));
  assert.equal(progress["unit-2-rollercoaster-engineering"].xp, 20);
});
