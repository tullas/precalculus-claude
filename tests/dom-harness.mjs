// Shared test harness for smoke-testing units without a browser.
//
// Loads the *actual* units/<unit>/index.html through jsdom, so we're
// exercising the real markup + the real lab.js, not a re-typed fixture that
// could drift from what ships. Two things jsdom doesn't implement well
// enough for our needs get stubbed:
//
//   1. Canvas 2D context — jsdom has no rendering backend. GraphEngine only
//      needs the *contract* (fillRect/beginPath/moveTo/.../fillText), not
//      actual pixels, so a no-op recorder object is enough.
//   2. requestAnimationFrame — jsdom doesn't schedule it against real frame
//      timing. We drive it with setImmediate and a fake, monotonically
//      increasing timestamp so time-based animations (Unit 2's simulator)
//      complete in milliseconds of *real* time instead of the ~5 real
//      seconds their in-app durations imply.
//
// Everything else (sliders, buttons, checkboxes, localStorage, textContent)
// is real jsdom behavior.

import pkg from "jsdom";
const { JSDOM, VirtualConsole, requestInterceptor } = pkg;
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "..");

function stubCanvasContext(window) {
  const noop = () => {};
  const ctx = {
    fillRect: noop, strokeRect: noop, clearRect: noop,
    beginPath: noop, closePath: noop, moveTo: noop, lineTo: noop,
    stroke: noop, fill: noop, arc: noop, fillText: noop, strokeText: noop,
    setTransform: noop, save: noop, restore: noop, translate: noop,
    scale: noop, rotate: noop,
    // GraphEngine assigns these as plain properties, not methods:
    fillStyle: "", strokeStyle: "", lineWidth: 1, font: "",
  };
  window.HTMLCanvasElement.prototype.getContext = () => ctx;
  // jsdom's default layout is 0x0; give the canvas a nonzero size so
  // GraphEngine's pixel<->math conversion has something to divide by.
  Object.defineProperty(window.HTMLCanvasElement.prototype, "clientWidth", { value: 600, configurable: true });
  Object.defineProperty(window.HTMLCanvasElement.prototype, "clientHeight", { value: 400, configurable: true });
  window.HTMLCanvasElement.prototype.getBoundingClientRect = () => ({
    width: 600, height: 400, top: 0, left: 0, right: 600, bottom: 400,
  });
}

// The pages pull Google Fonts over the network; letting that request
// actually go out in a sandboxed/offline test environment means jsdom hangs
// until it times out. Local (file://) resources — our own scripts and
// stylesheets — still load normally; anything else gets an instant empty
// response instead of a real network round trip.
const blockNonLocal = requestInterceptor((request) => {
  if (request.url.startsWith("file://")) return undefined; // let it proceed normally
  return new Response("", { status: 204 }); // instant no-op instead of a real network round trip
});

// jsdom treats file:// pages as an opaque origin and refuses real
// localStorage access from one ("SecurityError: localStorage is not
// available for opaque origins"). Trajectory (assets/js/progress.js) is our
// only consumer of it, and its usage is trivial (getItem/setItem of one
// JSON blob), so an in-memory stub is enough for tests.
function stubLocalStorage(window) {
  const store = new Map();
  const api = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
    key: (i) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  };
  Object.defineProperty(window, "localStorage", { value: api, configurable: true });
}

function stubAnimationFrame(window) {
  let clock = 0;
  window.requestAnimationFrame = (cb) => {
    clock += 16.6667;
    const ts = clock;
    return setImmediate(() => cb(ts));
  };
  window.cancelAnimationFrame = (id) => clearImmediate(id);
}

/**
 * Load a unit's index.html in a fresh jsdom window and wait for its
 * synchronous <script> tags (progress.js, graph-engine.js, lab.js, ...) to
 * have run.
 */
export async function loadUnit(unitDirName) {
  const file = path.join(REPO_ROOT, "units", unitDirName, "index.html");
  const errors = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (e) => {
    // "Could not load link" (Google Fonts) and our own resource-loader block
    // message are expected and harmless in tests — everything else is real.
    if (/Could not load link|blocked non-local resource/.test(e.message)) return;
    errors.push(e);
  });

  const dom = await JSDOM.fromFile(file, {
    url: `file://${path.join(REPO_ROOT, "units", unitDirName)}/`,
    resources: { interceptors: [blockNonLocal] },
    runScripts: "dangerously",
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      stubCanvasContext(window);
      stubAnimationFrame(window);
      stubLocalStorage(window);
      window.addEventListener("error", (e) => errors.push(e.error || e.message));
    },
  });

  const { window } = dom;
  if (window.document.readyState !== "complete") {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`${unitDirName}: timed out waiting for window 'load'`)), 5000);
      window.addEventListener("load", () => { clearTimeout(timer); resolve(); });
    });
  }

  return { dom, window: dom.window, document: dom.window.document, errors };
}

/** Dispatch a real 'input' event after setting a slider's value. */
export function setSlider(el, value) {
  el.value = String(value);
  el.dispatchEvent(new el.ownerDocument.defaultView.Event("input", { bubbles: true }));
}

/** Click helper that works for both <button> elements and jsdom's Event ctor. */
export function click(el) {
  el.dispatchEvent(new el.ownerDocument.defaultView.Event("click", { bubbles: true }));
}

/** Poll until `predicate()` is true or `timeoutMs` elapses (for rAF-driven async flows). */
export async function waitFor(predicate, { timeoutMs = 4000, stepMs = 5 } = {}) {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error("waitFor: timed out waiting for condition");
    }
    await new Promise((r) => setTimeout(r, stepMs));
  }
}
