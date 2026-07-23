import { test } from "node:test";
import assert from "node:assert/strict";
import { loadRoot } from "./dom-harness.mjs";

test("mission control: renders 0 XP / locked badges with empty progress", async () => {
  const { document } = await loadRoot();
  const grid = document.getElementById("sector-grid");
  assert.match(grid.textContent, /0 XP logged/);
  assert.match(grid.textContent, /Badge locked/);
  assert.doesNotMatch(grid.textContent, /★/);
});

test("mission control: renderSectorGrid() reflects whatever is currently in localStorage", async () => {
  const { window, document } = await loadRoot();
  window.localStorage.setItem("trajectory:progress", JSON.stringify({
    "unit-4-cycles-and-waves": { xp: 80, badgeEarned: true },
  }));
  window.renderSectorGrid();

  const grid = document.getElementById("sector-grid");
  assert.match(grid.textContent, /80 XP logged/);
  assert.match(grid.textContent, /★ Signal Locked/);
});

test("mission control: 'pageshow' (bfcache restore) re-renders with current progress", async () => {
  const { window, document } = await loadRoot();
  const grid = document.getElementById("sector-grid");
  assert.match(grid.textContent, /0 XP logged/, "sanity check: starts at 0");

  // Simulate XP being earned on a unit page, then the browser restoring
  // this homepage from bfcache on Back navigation — which fires 'pageshow'
  // without re-running <script> tags from scratch. Without the fix, the
  // grid would keep showing the stale 0 XP snapshot from initial load.
  window.localStorage.setItem("trajectory:progress", JSON.stringify({
    "unit-4-cycles-and-waves": { xp: 80, badgeEarned: true },
  }));
  window.dispatchEvent(new window.Event("pageshow"));

  assert.match(grid.textContent, /80 XP logged/, "pageshow should re-render with the now-current progress");
  assert.match(grid.textContent, /★ Signal Locked/);
});

test("mission control: orbit marks a unit's node done once its badge is earned", async () => {
  const { window, document } = await loadRoot();
  window.localStorage.setItem("trajectory:progress", JSON.stringify({
    "unit-2-rollercoaster-engineering": { xp: 60, badgeEarned: true },
  }));
  window.dispatchEvent(new window.Event("pageshow"));

  const doneNodes = document.querySelectorAll(".orbit__node--done");
  assert.equal(doneNodes.length, 1, "exactly one unit has earned its badge");
});
