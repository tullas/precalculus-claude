# Sector 05 — CGI Engine Vectors

**Mission:** Get the render engine's transform layer working before the next sprite ships.

**Key idea:**

- A vector is an arrow `(x, y)`. Add tip-to-tail; scale it to stretch or flip.
- Dot product `u·v = u.x·v.x + u.y·v.y` measures alignment: positive = same direction, zero = perpendicular, negative = opposite.
- A 2×2 matrix is a saved transform — multiply any point by it to rotate, scale, or shear.

**Your task:** Use the sliders to rotate and scale the sprite until it matches the target orientation.

**XP**

| Action | XP |
|---|---|
| Apply a rotation + non-uniform scale | 10 |
| Match a target orientation | 25 |
| 3 matches in a session | +15 bonus |

**Badge — Engine Online:** 3 matches.