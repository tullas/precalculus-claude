# Trajectory — Curriculum & Engineering Blueprint

## 1. Pedagogical framework

**Core thesis:** a formula memorized without a mental model decays within
weeks; a formula that is the *answer to a question the student already cares
about* becomes intuition. Every unit therefore opens with a **scenario hook**
(a stake, a job, a malfunction to fix), not a definition.

Three repeating structural devices carry this across all six units:

1. **The Machine metaphor.** A function is never "f(x) =" in isolation — it
   is a machine with an input slot, an output slot, and a visible mechanism.
   Composition is two machines bolted together. This metaphor is introduced
   in Unit 1 and referenced in every unit after it, so the visual language
   never has to be re-taught.
2. **Manipulate before you're told.** Every lab lets the student drag a
   slider or joystick and *see the consequence* before any formal vocabulary
   ("amplitude," "multiplicity," "asymptote") is named. The term is
   introduced as a label for something they already noticed, not as a fact
   to memorize first.
3. **The mission stakes something real.** Certifying a rollercoaster,
   tracking an outbreak, calibrating a camera rig — the math is the
   mechanism by which the mission succeeds or fails, so getting the concept
   wrong has an in-fiction consequence, not just a wrong-answer buzzer.

## 2. Unit blueprint matrix

| Unit | Math content | Narrative frame | Core interactive artifact | Signature "aha" moment |
|---|---|---|---|---|
| 1 — Morphing Machines | Domain/range, composition, transformations f(b(x−h))+k | Calibrating a game-camera rig | Joystick-style transform lab: 4 sliders (a, b, h, k) drive a live graph in real time | Realizing h and k feel like camera pan, a and b feel like zoom — the algebra *is* the joystick |
| 2 — Rollercoaster Engineering | End behavior, multiplicity, rational asymptotes & holes | Certifying a coaster track for a theme park inspection board | Track-builder: edit a polynomial's factors, watch the "track" bank, flatten, or blow past the guardrails (asymptotes) | A repeated root doesn't cross the track — it *kisses* it, like a coaster that touches the ground and lifts back off |
| 3 — Cosmic Scales | Exponential growth/decay, logarithms as inverse scaling | Tracking a pandemic outbreak / mapping the observable universe on one ruler | Dual-mode scale lab: linear vs. log axis toggle on the same outbreak data | Numbers that look impossible on a linear axis become a straight, readable line on a log axis |
| 4 — Cycles and Waves | Unit circle, radians, sine/cosine as wave generators | Piloting circular motion into a wave-transmission console | Circle-to-wave tracer: a dot orbits the unit circle while its height traces a sine wave in real time, synced frame-by-frame | The wave isn't a separate shape to memorize — it's a shadow of the circle, unrolled over time |
| 5 — CGI Engine Vectors | Vector algebra, dot product, 2D transformation matrices | Building the physics/render layer of a 2D game engine | Matrix sandbox: apply rotation/scale/shear matrices to a sprite and watch its vertices move live | A matrix isn't a grid of numbers — it's a *saved transformation* you can apply to anything |
| 6 — Limits: Gateway to Calculus | One-sided limits, indeterminate forms, algebraic evaluation | Debugging a sensor that reports "ERROR" exactly at the point you need it | Zoom-in explorer: keep zooming into a graph near a hole until the "ERROR" resolves into a clear approach value from both sides | A limit isn't about the point itself — it's about the trend closing in from both directions |

## 3. Gamification economy

Kept deliberately simple so it works with zero backend (all state lives in
`localStorage`, keyed per unit):

- **XP** — every completed lab challenge awards XP (defined per-unit in
  `mission-brief.md`'s front-matter-style table). XP is cosmetic momentum,
  not a gate.
- **Badges** — one badge per unit, awarded when a specific *mastery
  condition* is met in the lab (not just "opened the page"), e.g. Unit 2's
  badge requires certifying three different track configurations without
  triggering a guardrail failure.
- **Mastery gate (optional, teacher-toggleable)** — a unit's "Advanced
  Challenge" section stays visually locked until the badge is earned,
  encouraging exploration before the harder problem set.

This is intentionally not a points-and-leaderboard system — competition
between students is de-emphasized in favor of a personal mission log, since
the target failure mode being designed against is math anxiety, not lack of
challenge.

## 4. Technical architecture

- **No framework, no build step.** Every page is hand-written HTML5 that
  loads two shared assets (`style.css`, `graph-engine.js`) plus one
  unit-specific `lab.js`. This keeps the "clone and run" promise literal.
- **`graph-engine.js`** is the one piece of shared infrastructure worth
  documenting in detail (see below) — every unit's canvas visualization is
  built on top of it so units 2–6 don't reinvent coordinate mapping.
- **State:** `localStorage["trajectory:progress"]` stores a JSON object of
  `{ unitId: { xp, badgeEarned, lastVisited } }`. No PII, no network call —
  fully compliant with the cloud-independence constraint.
- **Content/code separation:** a teacher editing the story beats or XP
  values only ever touches the unit's `mission-brief.md`. Nobody needs to
  read JavaScript to edit the curriculum's *words*.

### `graph-engine.js` public API

```js
GraphEngine.mount(canvasEl, {
  xRange: [-10, 10],
  yRange: [-10, 10],
  grid: true,
  axisLabels: true
})
// returns a `scene` object:
scene.plotFunction(fn, { color, lineWidth })      // fn: (x) => y
scene.plotPoint(x, y, { color, label })
scene.plotVector(x1, y1, x2, y2, { color })
scene.clear()
scene.toPixel(x, y)   // math coords -> canvas pixel coords
scene.toMath(px, py)  // canvas pixel coords -> math coords
```

This tiny API (plot a function, plot a point, plot a vector, clear, and
coordinate-convert) is sufficient to build every lab in this course — new
units should reach for it before writing any raw `CanvasRenderingContext2D`
calls.

## 5. Accessibility & device floor

- All interactive controls are real `<input type="range">` elements (keyboard-
  operable, screen-reader-labeled) — canvases are the *visualization*, never
  the only way to change a value.
- Color choices maintain WCAG AA contrast against the dark background; no
  concept is color-only-encoded (labels/shapes back up every color cue).
- Layout is responsive down to a 360px-wide phone screen; labs stack their
  control panel below the canvas on narrow viewports.
- `prefers-reduced-motion` disables the ambient starfield drift and the
  circle-tracer's idle animation in Unit 4.

## 6. Extending the course (Unit 7+)

1. Duplicate `units/unit-6-limits-gateway/` as a template.
2. Rewrite `mission-brief.md` with the new narrative hook, objectives, and
   XP/badge table.
3. Write `lab.js` against the `GraphEngine` API above.
4. Add one `<a class="sector-card">` entry to `index.html`'s Mission Control
   grid and one node to the orbit path in `assets/js/main.js`.

No other file needs to change — this is the whole point of keeping
`graph-engine.js` and `style.css` as the only shared surface area.
