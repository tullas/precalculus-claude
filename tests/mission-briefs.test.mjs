import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { loadUnit } from "./dom-harness.mjs";

// Regression coverage for mission-brief.md content: this was previously
// completely untested (renderInto()'s fetch() doesn't work from a file://
// jsdom page — matching the app's own documented file:// caveat — so no
// existing test ever exercised the actual markdown parse of any brief).
// TrajectoryMD is a classic-script top-level const, so it's visible to
// other scripts in the same page but not attached to window; window.eval()
// runs in that same script realm, so it can reach it directly.

const UNITS = [
  "unit-1-morphing-machines",
  "unit-2-rollercoaster-engineering",
  "unit-3-cosmic-scales",
  "unit-4-cycles-and-waves",
  "unit-5-cgi-engine-vectors",
  "unit-6-limits-gateway",
];

test("every mission-brief.md parses cleanly with no leaked markdown syntax", async () => {
  for (const unit of UNITS) {
    const { window } = await loadUnit(unit);
    const md = readFileSync(new URL(`../units/${unit}/mission-brief.md`, import.meta.url), "utf8");
    window.__md = md;
    const html = window.eval("TrajectoryMD.render(window.__md)");
    const textOnly = html.replace(/<[^>]+>/g, " ");
    assert.doesNotMatch(textOnly, /\*\*/, `${unit}: unmatched ** should not leak through as literal asterisks`);
    assert.doesNotMatch(textOnly, /`/, `${unit}: unmatched backtick should not leak through`);
    assert.match(html, /<h1>/, `${unit}: should render its title as an h1`);
    assert.match(html, /<table>/, `${unit}: should render its XP table`);
  }
});

test("every mission-brief.md includes a real-world connection and an applied practice problem", async () => {
  for (const unit of UNITS) {
    const { window } = await loadUnit(unit);
    const md = readFileSync(new URL(`../units/${unit}/mission-brief.md`, import.meta.url), "utf8");
    window.__md = md;
    const html = window.eval("TrajectoryMD.render(window.__md)");
    assert.match(html, /<strong>Real world:<\/strong>/, `${unit}: missing a "Real world" connection`);
    assert.match(html, /<strong>Try it for real:<\/strong>/, `${unit}: missing an applied practice problem`);
  }
});
