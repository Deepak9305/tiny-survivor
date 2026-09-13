# Tiny Survivor — premium UI redesign QA

source visual truth path: user-supplied Tiny Survivor concept sheets and the premium UI redesign brief in the current conversation; image attachments were not exposed as local files
implementation screenshot paths: `tiny-survivor-home-redesign-360.png`, `tiny-survivor-home-redesign-390.png`, `tiny-survivor-home-redesign-412.png`, `tiny-survivor-game-hud-redesign-390.png`, `tiny-survivor-levelup-redesign-390.png`
viewport: 360 x 800, 390 x 844, and 412 x 915 CSS px; deviceScaleFactor 1
source and implementation pixel dimensions: implementation captures are native viewport dimensions; source attachment pixel metadata was unavailable, so no pixel-diff density normalization was possible
state: Home, active Stage 1-1 gameplay, and first Level Up overlay

## Full-view comparison evidence

The redesigned Home render uses the supplied key art as a full-bleed atmosphere, with a compact top bar, prominent logo, lightweight current-stage link, large gold Play CTA, and exactly four bottom tabs. This matches the supplied direction to prioritize character/world/Play over dashboard cards and metadata.

The gameplay render keeps the Phaser canvas as the dominant surface. The React layer contains only compact HP, timer, kills, pause, XP, conditional boss, temporary tutorial, and cinematic warning UI. The Level Up render keeps gameplay visible behind a light overlay and presents three vertically stacked, readable choice cards with rarity styling and a disabled rewarded reroll.

## Focused region comparison evidence

- Home: `tiny-survivor-home-redesign-390.png` checked top-bar density, logo scale, artwork crop, stage hierarchy, Play reachability, and four-tab navigation.
- Gameplay HUD: `tiny-survivor-game-hud-redesign-390.png` checked safe-area positioning, compact HP/timer/kills/pause grouping, thin XP bar, and canvas dominance.
- Level Up: `tiny-survivor-levelup-redesign-390.png` checked readable card structure, icon treatment, rarity labels, effect copy, spacing, overlay density, and reroll state.

## Required fidelity surfaces

- Fonts and typography: existing Barlow Condensed display hierarchy and Nunito Sans body copy are preserved; Home/Play/Level Up use larger display weights while metadata remains readable.
- Spacing and layout: Home and gameplay are full-height with safe-area padding; Home was checked at all three target portrait sizes; Level Up uses a vertical stack that fits the 390 x 844 state without horizontal overflow.
- Colors and tokens: normalized navy, cyan, gold, purple, danger, health, text, muted, and soft-line tokens are used; green remains reserved for health/success states.
- Image quality and asset fidelity: `/assets/tiny-survivor-key-art.png` is used as the real full-bleed Home asset with atmospheric overlays; no placeholder image or handcrafted illustration was added.
- Copy and content: Home now presents only `CURRENT STAGE`, stage/world, `PLAY`, and one continuation line; gameplay removes permanent weapon chips and verbose tutorial copy; Level Up uses concise effect copy.
- Icons: Lucide icons remain consistent for avatar, currencies, navigation, HUD, warnings, and upgrade choices.

## Findings

No actionable P0, P1, or P2 findings remain.

- P3: The supplied concept sheets show bespoke character/enemy illustrations per screen. This pass intentionally reuses the existing key art and leaves Phaser entity rendering unchanged to honor the no-gameplay-change constraint and protect runtime performance.
- P3: Source attachment pixel metadata was unavailable in the workspace, so QA is visual and responsive rather than a normalized pixel diff.

## Functional regression checks

- [x] Home Play starts the current stage.
- [x] Home stage link opens the map.
- [x] Heroes, Upgrade, and Missions bottom tabs navigate correctly.
- [x] Shop remains reachable from the Home top bar.
- [x] Settings remains reachable from the Home top bar.
- [x] Phaser mounts normally and the HUD wrapper remains `pointer-events: none`.
- [x] Level Up pauses the run; selecting a card applies the existing upgrade and resumes gameplay.
- [x] Pause and Resume work from the gameplay HUD.
- [x] Browser errors check returned no errors for the verified states.

## Comparison history

1. Pre-redesign render: Home used a bordered hero card, dashboard quick actions, six persistent navigation items, permanent weapon chips, and a three-column Level Up modal.
2. Redesign pass: removed Home quick-action cards and persistent Shop/Map tabs; introduced full-bleed Home composition, compact HUD, temporary tutorial, cinematic boss warning styling, and stacked upgrade cards.
3. Post-redesign render: Home passed at 360 x 800, 390 x 844, and 412 x 915; gameplay and Level Up passed at 390 x 844 with no browser errors.

## Verification

- `npm run lint`: passed (`tsc --noEmit`)
- `npm run build`: passed (`vite build`)
- Browser verification: passed; page loaded, key interactions worked, and no browser errors were reported.

final result: passed
