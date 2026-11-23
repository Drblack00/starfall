# Cinematic flight preview

Review-only branch based on main `9257b440f00b99fa45a11c3e7698e641e0c79b13`. No gameplay balance edits, merge, production deployment, or PR #17 changes.

- Enemy spawn telegraphs converge into directional wakes instead of rotating hoops; craft retain their full silhouette. Rift-jumping bosses leave a narrow transit wake.
- Boss hulls use the existing detailed metal lighting path; intro spins and phase squash/stretch are removed. Core and attack indicators remain.
- Smooth mode and the adaptive governor retain one low-poly planet with moving surface coordinates and fixed sunlight. HD retains its separate cloud deck. Compatibility-mode cloud motion remains active when the governor reduces detail.
- Hyperdrive integrates travel continuously through perspective depth, preserves rigid player hulls, uses restrained blue-white illumination, and retains the existing charge/cruise/settle timing. Fallback rendering shares the trajectory and reduced-motion fade.

## Evidence and limits

`node tests/graphics-preview.cjs`: PASS JavaScript parsing and frozen combat/economy hash checks. `git diff --check`: PASS.

Internal cloud Chromium: normal PLAY > launch confirmation > LAUNCH reached gameplay and the first boss. This browser reports WebGL unavailable, so observed rendering was 2D compatibility only.

Generated QA page (not shipped): enter through PLAY > LAUNCH, then Run transition checks. A completed-wave fixture calls the shipping `finishWave` path; this is a simulated regression, not a naturally completed playthrough. All four cases passed:

| Motion | Skip | Flash | Frames at simulated 60Hz | Destination |
|---|---|---|---|---|
| Normal | No | On | 181 | Sector 2 |
| Normal | Yes | Off | 45 | Sector 2 |
| Reduced | No | On | 181 | Sector 2 |
| Reduced | Yes | Off | 45 | Sector 2 |

Checks cover monotonic star travel during acceleration/deceleration, weapons offline in transit, exactly one resupply, correct destination, and no residual warp/shake. Reduced-motion peak intensity was zero; normal peak was one. A test-fixture issue with saved campaign progress was corrected by explicitly selecting sector 1 before the fixture.

Important remaining regressions to assess on hardware: GPU shader compilation and appearance, boss readability under simultaneous attacks, continuity at each teleport endpoint, visible surface rotation in Smooth and HD, and frame pacing/thermal load during sustained combat. The default planet adds one bounded draw; no new per-frame mesh/texture allocation or unbounded particle pool was introduced. This is a code-level budget assessment, not measured mobile performance.

Physical iPhone Safari, WebKit, GPU screenshots and mobile performance remain unverified. Local Chromium launch failed because the environment prohibits its required Unix socket; browser-runtime downloads returned HTTP 403. The supported cloud preview runs, but exposes only an internal localhost URL and no WebGL in this session. It is not an externally reachable iPhone preview link.

## Playable package

The accompanying ZIP includes `index.html`, `assets/`, and third-party notices. Serve its extracted directory on a static preview host; there is no build step. The full normal game and between-level transition are present. No debug/test hooks are included. An externally reachable, non-production static preview host is still required for a no-setup iPhone link. Do not point this branch at the production Render service.
