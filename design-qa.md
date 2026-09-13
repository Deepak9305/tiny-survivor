# Tiny Survivor design QA

source visual truth path: user-provided Tiny Survivor concept sheets attached in the build brief (conversation reference; the attachments were not exposed as local files)
implementation screenshot path: `tiny-survivor-home-mobile.png`, `tiny-survivor-stage-mobile-final.png`, `tiny-survivor-game-mobile-final.png`
viewport: 390 x 844 CSS px; deviceScaleFactor 1
source and implementation pixel dimensions: implementation captures are 390 x 844 px; source attachment pixel metadata was unavailable in the local workspace, so no pixel-diff density normalization was possible
state: fresh app home, World Map → Stage Detail, and active Stage 1-1 with the first level-up overlay

## Full-view comparison evidence

The concept sheets and rendered captures share the intended mobile-game language: portrait composition, deep navy surfaces, electric-cyan borders and effects, gold primary rewards/CTAs, restrained red danger states, compact Barlow Condensed-style display hierarchy, and a bottom navigation treatment. The implementation intentionally uses a real Phaser gameplay canvas rather than rendering gameplay entities in React DOM.

## Focused region comparison evidence

- Home: `tiny-survivor-home-mobile.png` checked the logo/hero art, primary Play CTA, currency header, and bottom navigation against the supplied main-menu concepts.
- Stage detail: `tiny-survivor-stage-mobile-final.png` checked the biome artwork crop, boss callout, possible-enemy chips, reward row, and Start Run CTA against the supplied stage-select concepts.
- Level-up: `tiny-survivor-game-mobile-final.png` checked the dimmed gameplay state, three upgrade cards, rarity treatment, and readable choice hierarchy against the supplied level-up concepts.

## Findings

No actionable P0, P1, or P2 visual findings remain.

- P3: The concept sheets show bespoke character and enemy illustrations per screen, while this slice reuses one generated graveyard key-art image for menu surfaces and uses lightweight Phaser vector-like shapes for runtime entities. This is an intentional Phase 1 performance/architecture tradeoff; it keeps gameplay readable and avoids placeholder image boxes while leaving a clear asset seam for future character/enemy sprites.
- P3: The reference concepts contain more menu destinations and monetization panels than the Phase 1 slice. The implemented routes cover the core flow plus Heroes, Upgrades, Missions, Shop, and Settings; remaining content expansion is data-ready but not needed for the first playable loop.

## Comparison history

1. Initial render: home and gameplay canvas loaded, but the first static playtest could die before collecting enough XP. Fixed early contact pressure, increased starting pickup range, and reduced the first XP threshold.
2. Post-fix render: at 390 x 844, Home, Map, Stage Detail, Gameplay, and Level Up rendered without overlay or console errors. Level-up appeared during a normal run, a card selection resumed the run, and the pause sheet opened from the HUD.

## Implementation checklist

- [x] Real Phaser gameplay canvas mounted from React without per-frame React entity updates.
- [x] Portrait-safe layout at 390 x 844 with safe-area padding and touch joystick.
- [x] Home → Map → Stage Detail → Play interaction verified.
- [x] Auto-attack, enemies, XP, level-up choice, passive/weapon upgrades, pause, retry, game-over and stage-clear code paths present.
- [x] Local save normalization and persistence through Capacitor Preferences with browser fallback.
- [x] Capacitor Android project generated, synced, and debug APK build verified.
- [x] Browser console/errors check passed for the verified states.

## Follow-up polish

- Replace the Phase 1 Phaser shapes with a small atlas of hand-painted enemy/player sprites.
- Add the remaining boss implementations, weapon evolutions, AdMob reward callbacks, audio assets, and full 20-stage balance pass.

final result: passed
