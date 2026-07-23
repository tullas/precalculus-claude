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
