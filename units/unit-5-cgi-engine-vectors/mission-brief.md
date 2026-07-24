# Sector 05 — CGI Engine Vectors

**Mission:** Get the render engine's transform layer working before the next sprite ships.

**Key idea:**

- A vector is an arrow `(x, y)`. Add tip-to-tail; scale it to stretch or flip.
- Dot product `u·v = u.x·v.x + u.y·v.y` measures alignment: positive = same direction, zero = perpendicular, negative = opposite.
- A 2×2 matrix is a saved transform — multiply any point by it to rotate, scale, or shear.

**Real world:** This is the literal math running every frame of a video game or animated film — rotating a character, scaling a UI element, aiming a camera. The same 2×2 matrix steers a robot arm and points a drone; the dot product is how a game engine checks whether two objects are facing each other.

**Try it for real:** A sprite needs to be rotated 90° counter-clockwise and stretched to twice its height with its width unchanged, in one step. What 2×2 matrix does both at once?

**Your task:** Use the sliders to rotate and scale the sprite until it matches the target orientation.

**XP**

| Action | XP |
|---|---|
| Apply a rotation + non-uniform scale | 10 |
| Match a target orientation | 25 |
| 3 matches in a session | +15 bonus |

**Badge — Engine Online:** 3 matches.