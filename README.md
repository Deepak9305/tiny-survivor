# Tiny Survivor

An offline-first portrait survivor roguelite vertical slice built with React, Phaser 3, TypeScript, Vite, and Capacitor.

## Run the web build

```bash
npm install
npm run dev
```

## Build Android

```bash
npx cap add android
npm run cap:android
```

The first slice includes the complete playable loop for Graveyard 1-1: joystick movement, automatic Magic Bolt attacks, enemies, XP crystals, level-up choices, elite waves, Skeleton King boss, stage clear, game over, retry, permanent upgrades, and local save persistence. AdMob, haptics, Preferences, App lifecycle, and Share are isolated behind services so native behavior can be enabled without changing gameplay code.
