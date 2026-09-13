# Tiny Survivor — supporting-screen redesign QA

source visual truth path: user-supplied Tiny Survivor concept sheets in the current conversation plus `C:\Users\rv941\.codex\attachments\a38e416f-310a-4ff9-8191-f309ff3e0d9a\pasted-text.txt`; concept images were not exposed as local files
implementation screenshot paths: `meta-home-390.png`, `meta-world-map-360.png`, `meta-world-map-390.png`, `meta-stage-detail-390.png`, `meta-heroes-390.png`, `meta-heroes-412.png`, `meta-upgrades-360.png`, `meta-upgrades-390.png`, `meta-missions-390.png`, `meta-settings-reset-390.png`, `meta-stage-clear-412.png`, `meta-game-over-390.png`
viewport: 360 x 800, 390 x 844, and 412 x 915 CSS px; deviceScaleFactor 1
source and implementation pixel dimensions: implementation captures are native viewport dimensions (verified with image metadata); source attachment pixel metadata was unavailable, so no density-normalized pixel diff was possible
state: current Home, all-world map, Stage 1-1 detail, selected Shadow hero, permanent upgrades, zero-progress daily missions, reset confirmation, representative Stage Clear, and live Game Over

## Full-view comparison evidence

- Home keeps the approved full-bleed key art, compact actual-hero currency bar, focused current-stage link, gold Play CTA, and four-tab navigation. `meta-home-390.png` is the current browser render.
- World Map uses a cinematic current-world lead, a connected alternating five-node path, complete/available/locked/boss states, all four world sections, and no persistent bottom navigation. `meta-world-map-360.png` and `meta-world-map-390.png` show the mobile layout; the DOM snapshot verified World 1 through World 4 and the locked Endless portal.
- Stage Detail uses full-width key art, stage identity, actual duration/power/best data, boss callout, enemy chips, coin reward, first-clear gem reward, and a gold Start Run CTA. `meta-stage-detail-390.png` fits the preferred viewport without clipping.
- Heroes uses a real Shadow key-art treatment and Lucide rune/silhouette treatments for Knight and Ranger, compact selector tiles, actual selected-hero state, starting weapon, and passive. `meta-heroes-390.png` and `meta-heroes-412.png` show the responsive layout.
- Upgrades uses two-column progression tiles with real saved levels and costs, five level pips, current/next effects, and disabled affordability states. `meta-upgrades-360.png` and `meta-upgrades-390.png` show the narrow and standard layouts.
- Missions shows only saved mission progress or a zero-progress fallback, says “Refreshes daily,” and has no fabricated timer or weekly chest. `meta-missions-390.png` shows the empty-safe state.
- Stage Clear uses actual RunResult time, kills, highest level, and coins; Next Stage is gold, Replay is blue, and Home is ghost. `meta-stage-clear-412.png` shows the revised result state.
- Game Over uses deep crimson contrast, actual run stats, cyan revive, gold Retry, and ghost Home. `meta-game-over-390.png` was captured from a live Phaser run after the player died.
- Settings uses game-like toggle rows and an in-app reset confirmation instead of `window.confirm`. `meta-settings-reset-390.png` shows the modal state.

## Focused region comparison evidence

- Top bars: `meta-home-390.png`, `meta-world-map-390.png`, and `meta-stage-detail-390.png` check safe-area spacing, back-button reachability, actual hero naming, currency hierarchy, and utility-style headers.
- Progress and state controls: `meta-world-map-360.png`, `meta-upgrades-360.png`, and `meta-missions-390.png` check node states, pips, progress bars, disabled rewards, and narrow-width wrapping.
- Result actions: `meta-stage-clear-412.png` and `meta-game-over-390.png` check primary/secondary/ghost hierarchy, result stat density, contrast, and button reachability.
- Modal: `meta-settings-reset-390.png` checks the destructive-action copy, focusable Cancel/Reset controls, and the lack of a browser-native confirmation dialog.

## Required fidelity surfaces

- Fonts and typography: Barlow Condensed remains the display face for headings, stats, labels, and buttons; Nunito Sans remains body copy. Display hierarchy, all-caps labels, compact line heights, and mobile wrapping were checked across 360, 390, and 412 px renders.
- Spacing and layout rhythm: supporting screens use 14 px mobile gutters, 44 px back/toggle targets, scrollable map/upgrades/missions/settings surfaces, and fit-to-screen Stage Detail, Stage Clear, and Game Over compositions. No persistent controls are hidden by overflow.
- Colors and visual tokens: navy surfaces, cyan interaction states, gold progression/reward states, purple mission/Endless accents, green success/health states, and crimson loss states use the existing shared token direction. Ghost actions are transparent after the shared premium-button cascade was corrected.
- Image quality and asset fidelity: the existing `/assets/tiny-survivor-key-art.png` is used as real raster art for Home, map, Stage Detail, Shadow, and results; Lucide remains the icon family. No fake character letters, emoji, or handcrafted SVG replacement was introduced.
- Copy and content: fabricated `LV. 12`, mission progress (`320/500`, `364/600`), mission countdown, weekly chest, and `+50 GEMS` result copy were removed. Stage Detail retains data-backed coin and first-clear gem values.
- States and interactions: selected/locked heroes, available/locked map nodes, disabled mission claims, affordable upgrade purchase, settings reset modal, live Game Over, and Stage Clear actions were checked.

## Findings

No actionable P0, P1, or P2 findings remain.

- P3 / intentional constraint: the concept sheets show bespoke character/enemy illustrations per screen. This pass reuses the existing key art and leaves Phaser entity rendering unchanged to honor the no-gameplay-change constraint. Knight/Ranger use vector rune/silhouette treatments because no corresponding art assets or hero portrait fields exist.
- P3 / data safety note: Stage Clear intentionally shows the actual run coin reward and omits first-clear gems because the component receives `RunResult` but not the App-level `firstClear` flag. The App still awards `stage.firstClearReward` in the existing save flow; no fake gem amount is shown.
- P3 / scope note: Endless Survival stays disabled and visibly marked “Coming soon” because the current `Screen` model has no real Endless screen. It is not routed to a normal stage detail screen or falsely enabled.
- Evidence limit: the source concept images were available in the conversation but not as local files, so QA is visual and responsive rather than a normalized source-pixel diff. A full 180-second stage-clear run was not repeated; the Stage Clear component was rendered with a representative `RunResult` for visual validation.

## Functional regression checks

- [x] Local page loads in Brave at `http://localhost:4173/` with no blank screen.
- [x] Home shows the actual selected hero name (`Shadow`) and keeps gems secondary.
- [x] Home Play starts the current stage; the stage link opens the map.
- [x] Map has no persistent bottom navigation and exposes World 1–4 paths.
- [x] Available Stage 1-1 opens Stage Detail; Start Run remains wired to the existing game callback.
- [x] Heroes, Upgrade, and Missions bottom tabs navigate correctly.
- [x] Upgrade purchase changed the first saved level and deducted the real calculated cost.
- [x] Mission fallback renders 0 progress and no weekly chest/timer.
- [x] Settings toggles remain wired; Reset opens the in-app modal, Cancel closes it, and `onReset` is only called from the confirmed action.
- [x] Live gameplay mounts, Level Up remains selectable, and Game Over renders from a real run result.
- [x] Browser error checks returned no errors for the verified states.

## Comparison history

1. Approved prior pass: Home, gameplay HUD, and Level Up were frozen after full-height mobile QA.
2. Supporting-screen pass: redesigned map, Stage Detail, Heroes, Upgrades, Missions, results, and Settings; removed fabricated UI data and the map bottom nav.
3. Post-fix pass: live Brave QA found the ghost Home action inheriting the gold fill from the prior premium CSS cascade. The shared ghost variant was corrected, then Game Over and Stage Clear were recaptured; no P0/P1/P2 differences remained.

## Verification

- `npm run lint`: passed (`tsc --noEmit`)
- `npm run build`: passed (`vite build`); only the existing Phaser bundle-size warning remains
- Browser verification: passed in Brave at 360 x 800, 390 x 844, and 412 x 915; local page loaded and browser error checks were clear
- Localhost fix preserved: Vite binds to `::`, so `localhost`, `127.0.0.1`, and IPv6 localhost resolve to the same dev server

final result: passed
