# RepCam 🏋️

**On-device AI camera rep tracker.** Point your phone at yourself, and RepCam
counts your reps in real time — push-ups, pull-ups, squats, deadlifts and more.

- 🤖 **On-device AI** — pose detection (MoveNet) runs locally. No video ever
  leaves your phone.
- 🔌 **No backend** — every workout is stored on-device. No account, no servers.
- ♾️ **Buy once** — a single one-time purchase unlocks everything. No subscription.
- 🎯 **Auto-detect or pick** — let RepCam recognise the movement, or choose it.
- 📈 **Progress** — history, streaks, personal bests and per-day charts.
- 🎨 **Two themes** — Dark (black background, red accents) and Light (white, green).

## Exercises

Push-ups · Pull-ups · Squats · Deadlifts · Lunges · Bicep curls · Shoulder press ·
Sit-ups · Jumping jacks.

## How it works

```
 camera frame ──▶ MoveNet pose ──▶ joint-angle "signal" ──▶ smoothing (EMA)
                                                                  │
                              rep count ◀── hysteresis state machine (RepCounter)
```

The heavy lifting is a **pure TypeScript core** (`src/core`) with no React Native
or TensorFlow dependencies, which makes it fully unit-testable:

- `core/pose` — keypoint types + joint-angle geometry + EMA smoothing.
- `core/reps` — the exercise catalogue, the `RepCounter` state machine, and the
  heuristic auto-detector.
- `core/stats` + `data/aggregate.ts` — progress aggregation and chart geometry.

Everything that touches the device (camera, MoveNet model, storage, purchases)
lives behind a small interface so it can be swapped for a test/demo double.

## Getting started

```bash
npm install
npm start          # then open in Expo Go, or a dev build
```

> The live camera + MoveNet path runs on a physical device (or a dev build).
> In Expo Go / the simulator you can use **Demo mode** (toggle in the session
> screen) to see the full counting pipeline with a synthetic mover.

## Scripts

| Script | What it does |
| --- | --- |
| `npm test` | Runs the core engine unit tests (Jest). |
| `npm run typecheck` | Type-checks the whole app. |
| `npm run typecheck:core` | Type-checks just the pure core. |
| `npm start` | Starts the Expo dev server. |

## Tech

Expo (SDK 50) · React Native · TypeScript · `@tensorflow-models/pose-detection`
(MoveNet) via `@tensorflow/tfjs-react-native` · `expo-camera` · `react-native-svg`
· AsyncStorage · React Navigation.

## Wiring real purchases

The app ships with `LocalEntitlementService` (persists the unlock flag locally),
so it is fully runnable out of the box. To ship a real store purchase, implement
`EntitlementService` with `react-native-iap` and swap it in
`src/context/EntitlementContext.tsx` — no screen code changes.

See [`docs/EXPLAINER.md`](docs/EXPLAINER.md) for a deep dive.
