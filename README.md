# RepCam 🏋️

**Offline, on-device camera rep tracker.** Point your phone at yourself and log
your sets — push-ups, pull-ups, squats, deadlifts and more. Everything is stored
locally; there is no account and no server.

- 🔌 **No backend** — every workout is stored on-device with AsyncStorage. No
  account, no servers, no cloud.
- 📷 **Live camera** — the workout screen shows the live camera via `expo-camera`.
- ♾️ **Buy once** — a single one-time purchase unlocks everything. No subscription.
- 📈 **Progress** — history, streaks, personal bests and per-day charts.
- 🎨 **Two themes** — Dark (black background, red accents) and Light (white, green).

> ⚠️ **Pose detection is not implemented yet.** The workout screen shows the live
> camera with the banner *"Pose Detection will be implemented later."* and a
> **temporary, simulated** rep counter so the full UI (counting, history, stats)
> stays functional. On-device pose detection is intentionally deferred to a later
> milestone — see [`docs/UPGRADE_SDK54.md`](docs/UPGRADE_SDK54.md).

## Screens

- **Home** — pick an exercise (or auto-detect) and start a session.
- **Workout Session** — live camera + placeholder + the temporary rep counter.
- **History** — every logged set, grouped by day (long-press to delete).
- **Statistics** — totals, streaks, personal bests and reps-per-day charts.
- **Settings** — theme, haptics, the one-time purchase and clearing local data.

## Exercises

Push-ups · Pull-ups · Squats · Deadlifts · Lunges · Bicep curls · Shoulder press ·
Sit-ups · Jumping jacks.

## How it works

```
 pose stream ──▶ joint-angle "signal" ──▶ smoothing (EMA)
                                              │
          rep count ◀── hysteresis state machine (RepCounter)
```

The heavy lifting is a **pure TypeScript core** (`src/core`) with no React Native
dependencies, which makes it fully unit-testable:

- `core/pose` — keypoint types + joint-angle geometry + EMA smoothing.
- `core/reps` — the exercise catalogue, the `RepCounter` state machine, and the
  heuristic auto-detector.
- `core/stats` + `data/aggregate.ts` — progress aggregation and chart geometry.

Everything that touches the device (camera, storage, purchases) lives behind a
small interface so it can be swapped for a test/demo double. The pose stream is
currently produced by a synthetic "mover" (`services/pose/MockPoseProvider`);
when real detection is added it implements the same `PoseProvider` seam without
any screen changes.

## Getting started

```bash
npm install
npx expo start     # then open in Expo Go, or a dev build
```

The project runs out of the box in Expo Go / the simulator. If the camera
permission is denied (common on simulators) the session screen falls back to a
**Demo mode** that animates a synthetic skeleton through the selected exercise.

## Scripts

| Script | What it does |
| --- | --- |
| `npm test` | Runs the core engine unit tests (Jest). |
| `npm run typecheck` | Type-checks the whole app. |
| `npm run typecheck:core` | Type-checks just the pure core. |
| `npm start` | Starts the Expo dev server. |

## Tech

Expo (SDK 54) · React Native 0.81 · React 19 · TypeScript 5.9 · `expo-camera` ·
`react-native-svg` · AsyncStorage · React Navigation v7.

## Wiring real purchases

The app ships with `LocalEntitlementService` (persists the unlock flag locally),
so it is fully runnable out of the box. To ship a real store purchase, implement
`EntitlementService` with `react-native-iap` and swap it in
`src/context/EntitlementContext.tsx` — no screen code changes.

See [`docs/EXPLAINER.md`](docs/EXPLAINER.md) for a deep dive into the rep-counting
engine, and [`docs/UPGRADE_SDK54.md`](docs/UPGRADE_SDK54.md) for the SDK 54
migration.
