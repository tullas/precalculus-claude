import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { loadUnit, setSlider, click } from "./dom-harness.mjs";

const UNITS = [
  "unit-1-morphing-machines",
  "unit-2-rollercoaster-engineering",
  "unit-3-cosmic-scales",
  "unit-4-cycles-and-waves",
  "unit-5-cgi-engine-vectors",
  "unit-6-limits-gateway",
];

// Generic contract every unit's lab.js is expected to satisfy. This is what
// would have caught, e.g., a lab.js that throws on load because an id in
// lab.js and index.html drifted out of sync.
describe("every unit loads and responds without throwing", () => {
  for (const unit of UNITS) {
    test(unit, async () => {
      const { document, errors } = await loadUnit(unit);

      assert.equal(errors.length, 0, `unexpected runtime error(s): ${errors.map(String).join("; ")}`);

      const readout = document.getElementById("readout");
      assert.ok(readout, "#readout should exist");
      assert.notEqual(readout.textContent.trim(), "", "#readout should be populated on initial render");

      // Exercise every range/select input once, at both ends of its range,
      // and confirm nothing throws and the readout is still populated.
      const inputs = document.querySelectorAll('input[type="range"], select');
      for (const el of inputs) {
        if (el.tagName === "SELECT") {
          const lastIndex = el.options.length - 1;
          el.selectedIndex = lastIndex;
          el.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
          el.selectedIndex = 0;
          el.dispatchEvent(new document.defaultView.Event("change", { bubbles: true }));
        } else {
          setSlider(el, el.min);
          setSlider(el, el.max);
        }
      }
      assert.equal(errors.length, 0, `slider/select sweep threw: ${errors.map(String).join("; ")}`);
      assert.notEqual(readout.textContent.trim(), "", "#readout should stay populated after input changes");

      // "Certify"/"check" and "new target" flows should run without throwing.
      const checkBtn = document.getElementById("check-btn");
      const newTargetBtn = document.getElementById("new-target-btn");
      if (checkBtn && checkBtn.style.display !== "none") click(checkBtn);
      if (newTargetBtn && newTargetBtn.style.display !== "none") click(newTargetBtn);
      assert.equal(errors.length, 0, `check/new-target flow threw: ${errors.map(String).join("; ")}`);
    });
  }
});
