/**
 * Mission Control — renders the six unit sector-cards and the orbit
 * trajectory signature element, both driven from the same UNITS array so
 * adding Unit 7 means editing one list, not two templates.
 */
const UNITS = [
  {
    id: "unit-1-morphing-machines",
    sector: "SECTOR 01",
    title: "Morphing Machines",
    tagline: "Calibrate a game-camera rig. Functions, domain/range, and transformations as a joystick.",
    badge: "Camera Calibrated",
  },
  {
    id: "unit-2-rollercoaster-engineering",
    sector: "SECTOR 02",
    title: "Rollercoaster Engineering",
    tagline: "Certify a coaster track. Polynomial end behavior, multiplicity, and rational asymptotes.",
    badge: "Track Certified",
  },
  {
    id: "unit-3-cosmic-scales",
    sector: "SECTOR 03",
    title: "Cosmic Scales",
    tagline: "Track an outbreak across impossible numbers. Exponentials, logs, and log-scale reasoning.",
    badge: "Outbreak Contained",
  },
  {
    id: "unit-4-cycles-and-waves",
    sector: "SECTOR 04",
    title: "Cycles and Waves",
    tagline: "Pilot circular motion into a wave console. The unit circle, radians, and sinusoids.",
    badge: "Signal Locked",
  },
  {
    id: "unit-5-cgi-engine-vectors",
    sector: "SECTOR 05",
    title: "CGI Engine Vectors",
    tagline: "Build a 2D render layer. Vectors, the dot product, and transformation matrices.",
    badge: "Engine Online",
  },
  {
    id: "unit-6-limits-gateway",
    sector: "SECTOR 06",
    title: "Limits: Gateway",
    tagline: "Debug a sensor that errors at the exact point you need it. One-sided limits.",
    badge: "Sensor Repaired",
  },
];

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem("trajectory:progress") || "{}");
  } catch (e) { return {}; }
}

function renderSectorGrid() {
  const grid = document.getElementById("sector-grid");
  if (!grid) return;
  const progress = getProgress();
  grid.innerHTML = UNITS.map((u) => {
    const p = progress[u.id] || { xp: 0, badgeEarned: false };
    return `
      <a class="sector-card" href="units/${u.id}/index.html">
        <div class="sector-card__id">${u.sector}</div>
        <h3>${u.title}</h3>
        <p>${u.tagline}</p>
        <div class="sector-card__meta">
          <span>${p.xp} XP logged</span>
          <span class="${p.badgeEarned ? "sector-card__badge" : ""}">${p.badgeEarned ? "★ " + u.badge : "Badge locked"}</span>
        </div>
      </a>`;
  }).join("");
}

function renderOrbit() {
  const container = document.getElementById("orbit-container");
  if (!container) return;
  const progress = getProgress();
  const n = UNITS.length;
  const w = 900, h = 120;
  const points = UNITS.map((u, i) => {
    const x = 40 + (i * (w - 80)) / (n - 1);
    const y = h / 2 + Math.sin(i * 0.9) * 22;
    return { x, y, done: !!(progress[u.id] && progress[u.id].badgeEarned), label: `0${i + 1}` };
  });
  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(" ");
  const doneCount = points.filter((p) => p.done).length;
  const progressRatio = doneCount / n;

  const nodes = points.map((p) =>
    `<circle class="orbit__node ${p.done ? "orbit__node--done" : ""}" cx="${p.x}" cy="${p.y}" r="7"></circle>
     <text class="orbit__label" x="${p.x}" y="${p.y - 14}" text-anchor="middle">${p.label}</text>`
  ).join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
      <path class="orbit__path" d="${pathD}"></path>
      <path class="orbit__progress" d="${pathD}"
            style="stroke-dashoffset:${600 - Math.round(600 * progressRatio)}"></path>
      ${nodes}
    </svg>`;
}

renderSectorGrid();
renderOrbit();

// If the person completes a unit and hits the browser Back button to
// return here, some browsers restore this page from the back/forward
// cache (bfcache) instead of re-running this script — which would show
// a stale XP/badge snapshot from before they played. `pageshow` fires on
// both a fresh load and a bfcache restore, so re-rendering there keeps
// the dashboard honest either way.
window.addEventListener("pageshow", () => {
  renderSectorGrid();
  renderOrbit();
});
