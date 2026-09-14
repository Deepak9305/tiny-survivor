# Tiny Survivor model drop-in folders

Production GLB files can be added without changing gameplay code:

- `heroes/` — hero models such as `shadow.glb`
- `enemies/` — the eight Monster Codex entries
- `bosses/` — Skeleton King, Forest Witch, Frost Golem, and Demon Lord
- `environment/graveyard/`, `forest/`, `frozen/`, `castle/` — world props

`src/game3d/assets/ModelRegistry.ts` is the local-only loading boundary. Until
an asset exists, the improved procedural factories remain the intentional
fallback; no remote or hotlinked models are used.
