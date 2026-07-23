import { test } from "node:test";
import assert from "node:assert/strict";
import { loadUnit, setSlider, click } from "./dom-harness.mjs";

// The bug report this addresses: a user completed unit 4's target three
// times in a row and the XP "wasn't changing." The per-unit `status` line
// does update, but it's transient — it gets cleared the moment the next
// target loads (a ~1.4s setTimeout) — and there was no persistent XP
// display anywhere on the unit page itself. A fast run of correct answers
// could easily outrun that flash and leave no visible confirmation.
//
// Fix: a small persistent "N XP" badge in the page header, refreshed at
// every XP/badge-earning call site (not just from render(), which doesn't
// always get called immediately alongside an award).

const UNITS_WITH_BADGE = [
  "unit-1-morphing-machines",
  "unit-2-rollercoaster-engineering",
  "unit-3-cosmic-scales",
  "unit-4-cycles-and-waves",
  "unit-5-cgi-engine-vectors",
  "unit-6-limits-gateway",
];

test("every unit's XP badge starts at '0 XP'", async () => {
  for (const unit of UNITS_WITH_BADGE) {
    const { document } = await loadUnit(unit);
    const badge = document.getElementById("xp-badge");
    assert.ok(badge, `${unit}: expected an #xp-badge element`);
    assert.equal(badge.textContent, "0 XP", `${unit}: badge should start at 0 XP`);
  }
});

test("unit 4: the badge updates immediately on each award, independent of the transient status line", async () => {
  const { document } = await loadUnit("unit-4-cycles-and-waves");
  const badge = document.getElementById("xp-badge");
  const slider = document.getElementById("slider-theta");
  const checkBtn = document.getElementById("check-btn");

  // 1) revolution milestone
  setSlider(slider, slider.max);
  assert.equal(badge.textContent, "10 XP");

  // 2) three quick correct matches, back-to-back, with no waiting for the
  // status-clearing setTimeout in between — exactly what the report
  // described ("ran it three times... continuous").
  for (let round = 0; round < 3; round++) {
    const m = document.getElementById("target-brief").textContent.match(/θ = (-?\d+\.\d+)π rad/);
    setSlider(slider, parseFloat(m[1]) * Math.PI);
    click(checkBtn);
  }

  // Even though the status line for round 1 and 2 would already be
  // cleared/overwritten by now in a slow human session, the badge reflects
  // the true cumulative total: 10 (revolution) + 20*3 (matches) + 20 (bonus).
  assert.equal(badge.textContent, "90 XP · ★ Badge earned");
  assert.ok(badge.classList.contains("xp-badge--earned"));
});

test("unit 1: the badge updates on the per-slider XP award, not just on match", async () => {
  const { document } = await loadUnit("unit-1-morphing-machines");
  const badge = document.getElementById("xp-badge");
  setSlider(document.getElementById("slider-a"), 2);
  assert.equal(badge.textContent, "10 XP");
});

test("unit 2: the badge updates on the pre-flight asymptote flag, before any run", async () => {
  const { document } = await loadUnit("unit-2-rollercoaster-engineering");
  const badge = document.getElementById("xp-badge");
  click(document.getElementById("mode-rational"));
  assert.equal(badge.textContent, "0 XP");

  const checkbox = document.querySelector("#checklist-items input[type=checkbox]");
  checkbox.checked = true;
  checkbox.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
  assert.equal(badge.textContent, "20 XP");
});

test("unit 3, 5, 6: badge reflects their respective first-award actions", async () => {
  {
    const { document } = await loadUnit("unit-3-cosmic-scales");
    const toggle = document.getElementById("toggle-log");
    toggle.checked = true;
    toggle.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
    assert.equal(document.getElementById("xp-badge").textContent, "10 XP");
  }
  {
    const { document } = await loadUnit("unit-5-cgi-engine-vectors");
    setSlider(document.getElementById("slider-theta"), Math.PI / 2);
    setSlider(document.getElementById("slider-sy"), 0.5);
    assert.equal(document.getElementById("xp-badge").textContent, "10 XP");
  }
  {
    const { document } = await loadUnit("unit-6-limits-gateway");
    const zoomSlider = document.getElementById("slider-zoom");
    setSlider(zoomSlider, zoomSlider.max);
    assert.equal(document.getElementById("xp-badge").textContent, "10 XP");
  }
});
