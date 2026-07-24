# TRAJECTORY — A Mission-Driven Precalculus Course

Trajectory is a six-unit, narrative-first Precalculus curriculum built as a static
site: pure HTML5, CSS3, and vanilla JavaScript, with Markdown mission briefs as
the content layer. No build step, no framework, no cloud account required.

Every unit reframes a standard Precalc topic as a mission with a real
engineering or scientific stake — students aren't "graphing transformations,"
they're calibrating a video-game camera rig; they aren't "finding asymptotes,"
they're certifying a rollercoaster for public safety.

## Why this architecture

| Constraint | Solution |
|---|---|
| 100% local-first, cloud-independent | No npm install, no bundler, no external API keys. Open `index.html` or serve with Python's stdlib. |
| No third-party account dependencies | No Google Workspace, Canvas LMS, or Notion API. Progress is stored in the browser via `localStorage` (student-owned, per-device). |
| Static repo, Git-native | Every file is plain text (HTML/CSS/JS/MD) and diffs cleanly. |
| Free hosting | Directory layout matches GitHub Pages' expectations exactly — push and it's live. |

## Run it locally

```bash
cd precalc-course
python3 -m http.server 8000
# then open http://localhost:8000
```

No other dependencies. Any static server works (`npx serve`, VS Code Live
Server, `php -S`) — Python's is called out because it ships with the OS on
every platform this course targets.

## Testing

The site itself has zero dependencies — `npm`/`node_modules` are only for an
optional dev-only test suite that isn't needed to run or deploy the course.

```bash
npm install   # dev-only: jsdom, for the test suite below
npm test
```

Tests load each unit's real `index.html` through jsdom and exercise it the
way a student would (drag sliders, click buttons), rather than duplicating
markup into hand-written fixtures that could drift from what ships. See
`tests/dom-harness.mjs` for the (small) set of jsdom stubs this requires.

## Version control

```bash
git init
git add .
git commit -m "Initial commit: Trajectory Precalculus course scaffold"
```

Recommended `.gitignore` is already included (editor/OS cruft only — there is
no build output to ignore, because there is no build step).

## Deploy to GitHub Pages (free)

```bash
git remote add origin https://github.com/<your-username>/<your-repo>.git
git branch -M main
git push -u origin main
```

Then in the GitHub repo: **Settings → Pages → Source → Deploy from branch →
`main` / `/ (root)`**. The site will be live at
`https://<your-username>.github.io/<your-repo>/` within a minute or two.
Because `index.html` sits at the repo root and every internal link is
relative, no path rewriting is needed for the Pages subdirectory.

## Directory structure

```
precalc-course/
├── index.html                    # Mission Control — the course landing page
├── README.md
├── .gitignore
├── docs/
│   └── curriculum-blueprint.md   # Full pedagogy + game-design + engineering spec
├── assets/
│   ├── css/
│   │   ├── style.css             # Global design system (tokens, layout, nav)
│   │   └── lab.css               # Shared styling for interactive lab pages
│   └── js/
│       ├── main.js               # Landing page orbit-nav + progress tracking
│       └── graph-engine.js       # Shared canvas plotting/interaction engine
└── units/
    ├── unit-1-morphing-machines/       # Functions as Machines & Morphing Graphs
    ├── unit-2-rollercoaster-engineering/  # Polynomial & Rational Functions
    ├── unit-3-cosmic-scales/           # Exponential & Logarithmic Functions
    ├── unit-4-cycles-and-waves/        # Trigonometry
    ├── unit-5-cgi-engine-vectors/      # Vectors & Matrices
    └── unit-6-limits-gateway/          # Introduction to Limits
        ├── index.html             # Mission page shell + embedded lab
        ├── mission-brief.md       # Narrative hook, objectives, XP/badge table
        └── lab.js                 # The unit's interactive simulation
```

## Content model

Each unit folder is self-contained and follows the same three-file contract,
so adding **Unit 7** later means copying the pattern, not touching shared
code. `mission-brief.md` is pure content (editable by a teacher with no JS
knowledge); `lab.js` is pure interaction logic; `index.html` is the thin
shell that wires them together via `assets/js/graph-engine.js`.

See `docs/curriculum-blueprint.md` for the full pedagogy rationale, the
gamification economy (XP, badges, mastery gates), and the technical spec for
`graph-engine.js`.

## Development log

Running notes on what's shipped and what's next, so work continues
coherently across sessions without re-deriving context from scratch.

**Shipped**

- All six units have a functional lab matching their `mission-brief.md`.
- Unit 2 (Rollercoaster Engineering): added a Polynomial/Rational track
  mode toggle, a rational-track renderer (asymptote + hole), a feature
  checklist the student self-flags before running, and an animated
  "Run simulator" that rides the track and reacts to the first *unflagged*
  feature (crossing → no effect, kiss → bounce + fail, asymptote →
  fly off-screen + fail, hole → vanish/reappear + continue).
- Unit 5 (CGI Engine Vectors): fixed a matrix-composition bug where
  non-uniform scale (`sx != sy`) wasn't applied to the off-diagonal terms,
  which silently introduced shear instead of a clean rotate+scale.
- Unit 1 (Morphing Machines): removed dead no-op code in the base function.
- Test suite (`npm test`, node's built-in test runner + jsdom): loads
  every unit's real `index.html`, sweeps every slider, exercises
  check/new-target flows, and has targeted behavior tests for Unit 2's
  simulator and the Unit 5 matrix fix. Writing it caught two more real
  bugs: `graph-engine.js`'s grid-line loop stepped by a fixed 1 math
  unit regardless of axis range, which turned into a near-infinite loop
  for Unit 3's exponential y-range (now shares an adaptive step with the
  axis labels, which also fixes them not lining up); and Unit 2's
  checklist code called `CSS.escape()` for no real reason (swapped for a
  plain `Map` lookup).
- XP wiring for units 1, 3, 4, 5, 6 now matches their mission briefs
  literally instead of approximately:
  - Unit 1: "Move each slider once" now pays 10 XP the first time each
    individual slider is touched (was a flat 10 XP on the unrelated
    "new target" click).
  - Unit 3: "Toggle log view once" now pays its 10 XP exactly once (was
    paying it on *every* toggle — an accidental infinite-XP exploit).
  - Unit 4: "Complete one full revolution" now pays 10 XP when the angle
    dial reaches its full-circle end (was tied to "new target" instead).
  - Unit 5: "Apply a rotation + non-uniform scale" now pays 10 XP the
    first time `theta != 0` and `sx != sy` hold at once (was tied to
    "new target" instead).
  - Unit 6: "Zoom to max on one function" now pays 10 XP when the zoom
    slider reaches its max (was tied to "new target" instead).
  - Units 1, 3, 4, 5, 6 also each promised a "+N bonus XP" for 3 correct
    matches/estimates in their XP table, but only the badge was actually
    firing — the bonus XP itself was silently never paid. All five now
    pay it. Covered by `tests/xp-actions.test.mjs`.
- Correctness tests for Units 3 and 6's core math
  (`tests/unit3-unit6-math.test.mjs`): Unit 3's exponential
  threshold-crossing formula (accept/reject boundaries and the displayed
  N(guess) value), and Unit 6's four rational/trig limit sensors (both
  the near-discontinuity samples converging on the documented limit at
  max zoom, and the accept/reject judgment). No bugs found — both were
  already correct — but this closes the "only generic smoke coverage"
  gap for these two units.

- Persistent XP badge on every unit page. A user reported completing
  unit 4's target three times in a row with "the XP not changing." The
  underlying XP logic was correct (and tested), but the only place a unit
  page showed the running total was the `status` line, which is
  transient — it gets wiped the moment the next target loads
  (~1.4-1.6s later). Three quick correct answers could easily outrun
  that flash, leaving no visible confirmation anywhere on the page (the
  Mission Control homepage total was one click away, but nobody should
  have to leave the lab to see what they just earned). Added a small
  "N XP" pill in every unit's header, wired to refresh at every XP/badge
  award call site (not just from `render()`, since awards don't always
  happen alongside a render call) so it's accurate independent of the
  status line's timing. Unit 2's several award sites were consolidated
  behind two local wrapper functions (`addXP`/`awardBadge`) so the badge
  can't be missed at a call site by hand; the other five units call
  `refreshXpBadge()` explicitly at each site. Covered by
  `tests/xp-badge.test.mjs`, including a direct reproduction of the
  reported scenario (three rapid-fire correct matches with no waiting
  between them).

- Unit 3 (Cosmic Scales) depth pass: added "Run outbreak simulation," an
  animated playback (a marker rides the growth curve from day 0 to day
  30) alongside the existing instant "Submit estimate." The threshold
  line highlights once the marker crosses it and the guess marker grows
  once the marker passes that day, then the animation hands off to the
  existing `checkEstimate()` for scoring — no new XP logic was added, so
  all prior tests stayed valid unchanged. `render()` and the new
  animation now share a `drawScene()` helper instead of duplicating the
  curve/threshold/guess drawing code. Covered by
  `tests/unit3-outbreak-sim.test.mjs` (controls lock during the
  animation and unlock after; a double-click while running is a no-op;
  both a correct and incorrect guess score identically whether run
  through the animation or the instant check).

- Unit 4 (Cycles and Waves) depth pass: added "Sweep full revolution," an
  animated playback of the dish rotating through a full circle while the
  unrolled sine wave is progressively traced out (revealed only up to
  the current angle, rather than drawn whole and just dragging a dot
  across it — makes the "unrolling the circle into a wave" idea visible
  as it happens instead of a fait accompli). At the end, the animation
  lands the real slider at the full-circle end and dispatches a genuine
  `input` event, so the existing revolution-XP handler is the only place
  that logic lives — the animation drives the same control a manual drag
  would rather than duplicating the award. Covered by
  `tests/unit4-sweep.test.mjs` (controls lock/unlock correctly; the sweep
  pays the same 10 XP a manual drag pays and not twice on a repeat run; a
  double-click mid-sweep is a no-op).

- Unit 6 (Limits: Gateway to Calculus) depth pass: added "Run zoom scan,"
  an animated version of zooming in. Because `render()` already reads the
  zoom slider's live value and shrinks the view accordingly, the
  animation needed no separate drawing code at all — it just sets the
  slider value and dispatches a real `input` event every frame, driving
  the exact listener a manual drag would (render + the zoom-to-max XP
  check together). The two sample points visibly converge on the limit
  as the window narrows, rather than the student only comparing two
  numbers before/after an instant jump. Covered by
  `tests/unit6-zoom-scan.test.mjs`.
- All three originally-flagged units (3, 4, 6) now have their depth
  pass; that punch-list item is closed.
- Fixed flaky animation tests (units 3/4/6): they were waiting a fixed
  real-world sleep (e.g. 300ms) on the assumption that the RAF stub's
  virtual animation clock — driven by a queue of `setImmediate`
  callbacks — always flushes near-instantly. That assumption held most
  of the time but not under system load, causing intermittent failures
  in the full suite that didn't reproduce running a single file. Fixed
  by polling for the actual completion signal (the button re-enabling)
  via the existing `waitFor()` helper instead of guessing a delay, and
  widened the real-timer margins in `xp-actions.test.mjs`'s multi-round
  bonus tests for the same reason. Also set `--test-concurrency=1` in
  the `npm test` script, since running many jsdom windows across
  parallel test files was part of what made the timing tight in the
  first place — this didn't fully fix it alone, but polling plus serial
  execution together made 5/5 consecutive full-suite runs pass clean.

- Real-world grounding added to all six mission briefs, per a direct
  request to make the course more clearly connect to problems students
  would recognize and know where to apply. Each brief now has two new
  sections between "Key idea" and "Your task":
  - **Real world:** names a genuine field/use case for that unit's math
    (coaster engineers' root-checking software, epidemiology/compound
    interest/bacterial growth for exponentials, satellite-dish and
    cell-tower aiming for the circle/wave unit, the matrix math inside
    every game engine and animated film, a speedometer as instantaneous
    limits, photo/audio editing for function transformations).
  - **Try it for real:** a short applied word problem using concrete,
    realistic numbers (a Ferris wheel's radius and hub height; a
    bacteria colony's growth rate; a car's mile-marker readings a
    hundredth of an hour apart) that the same math in the lab directly
    answers — meant to be workable with pencil and paper, independent of
    the interactive lab itself.
  - Content only — no lab mechanics changed. `tests/mission-briefs.test.mjs`
    is new coverage entirely: it turned up that no prior test had ever
    actually exercised a mission brief's markdown parse (`renderInto()`'s
    `fetch()` doesn't work from a `file://` jsdom page, matching the
    app's own documented file:// caveat, so it always silently fell into
    the "could not load" branch) — worked around by calling
    `TrajectoryMD.render()` directly via `window.eval()`, and used that
    to confirm all six briefs — old and new content alike — parse
    cleanly with no leaked markdown syntax.

**Known gaps / next up**

- The real-world grounding is currently limited to the mission-brief
  panel (read, not interactive). A deeper next step, if wanted: wiring
  a unit's actual lab mechanics to one of these real scenarios directly
  — e.g. Unit 3 could occasionally frame its outbreak numbers around a
  real historical growth rate instead of a random threshold, or Unit 4
  could offer a "Ferris wheel" reskin of the same circle/wave mechanic —
  rather than the real-world content living only in the static brief.
- `npm test` (48 tests) covers: smoke tests for all six units, animated
  depth-pass features for units 2/3/4/6, Unit 5's matrix fix, XP wiring
  across all six units, math correctness for units 3 and 6, the Mission
  Control dashboard, the persistent XP badge, and now the mission-brief
  markdown content itself.
