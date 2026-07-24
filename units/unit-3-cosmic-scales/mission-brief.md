# Sector 03 — Cosmic Scales

**Mission:** An outbreak looks flat for three weeks, then explodes. Catch the trend before the wall hits.

**Key idea:**

- Exponential growth multiplies by the same factor every time step — that's what makes the hockey-stick shape.
- A log answers one question: what exponent hits this number? `log₂(8) = 3` because `2³ = 8`.
- Plotting `log(N(t))` turns the hockey-stick into a straight line you can read and project.

**Real world:** This is the model epidemiologists used to track early outbreak case counts, the model behind compound interest on a savings account, and the model a biologist uses to predict when a bacteria colony outgrows its dish. The log trick — turning a hockey stick into a straight line — is why outbreak dashboards and stock-price charts both offer a "log scale" toggle.

**Try it for real:** A bacteria colony starts at 50 cells and grows 20% every hour. About how many hours until it passes 1,000 cells? (Same `N₀(1 + r)ᵗ` model as this lab — just solve for `t`.)

**Your task:** Toggle log view. Estimate the day the case count crosses the threshold.

**XP**

| Action | XP |
|---|---|
| Toggle log view once | 10 |
| Estimate the threshold day correctly | 25 |
| 3 correct estimates in a session | +15 bonus |

**Badge — Outbreak Contained:** 3 correct estimates.