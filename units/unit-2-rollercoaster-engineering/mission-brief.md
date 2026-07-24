# Sector 02 — Rollercoaster Engineering

**Mission:** Certify a coaster track by end of day. Get the roots wrong and it crashes or never lands.

**Key idea:**

- Each root of `f(x) = a(x−r₁)(x−r₂)(x−r₃)` is where the track touches the ground.
- Leading sign + degree decide end behavior (up or down at each far end).
- A root that appears twice → the track *kisses* the ground instead of crossing it.
- Rational tracks: **asymptote** = a wall the track approaches but never touches. **Hole** = one missing point, otherwise fine.

**Real world:** Real coaster engineers run this exact root check — by computer, not by hand — before a single piece of track gets welded, because a missed double root in real life means a cart stalls mid-loop. The same math flags break-even points on a business plan and finds the load where a support beam's stress heads toward a vertical asymptote.

**Try it for real:** A footbridge support is modeled by `f(x) = (x − 3)(x − 3)(x + 1)`. Without graphing it, where does the curve touch the ground without crossing, and where does it cross straight through?

**Your task:** Certify the track shown. Spot every crossing, kiss, asymptote, and hole correctly.

**XP**

| Action | XP |
|---|---|
| Certify one track | 20 |
| Correctly ID a double root | +15 |
| Flag an asymptote before running the simulator | 20 |

**Badge — Track Certified:** 3 certifications in one session.