# Upgrading RepCam to Expo SDK 54

> **TL;DR** RepCam was pinned to Expo SDK 50 and leaned on a TensorFlow.js pose
> pipeline (`@tensorflow/tfjs-react-native`, `@tensorflow-models/pose-detection`)
> plus `react-native-fs` and `expo-gl`. That stack is heavy, partly unmaintained,
> and does not build cleanly on modern Expo. This change lifts the project to
> **Expo SDK 54 / React Native 0.81 / React 19 / TypeScript 5.9**, removes the
> entire machine-learning path, and replaces it with a plain `expo-camera` live
> preview plus a *temporary, simulated* rep counter. Crucially, the app's real
> value — a well-tested, pure-TypeScript rep-counting engine — is preserved
> untouched.

---

## Background

### For the newcomer: Expo, React Native, and what an "SDK version" really is

React Native lets you write an app once in TypeScript and run it on both iOS and
Android. But a React Native app is not *only* JavaScript: many features (the
camera, the GPU, secure storage) are implemented in native Swift/Kotlin code that
your JavaScript calls into. Those native pieces are called **native modules**.

**Expo** is a framework and toolchain on top of React Native. Among other things,
it curates a large set of native modules (`expo-camera`, `expo-haptics`, …) and
guarantees that a specific *set of versions* work together. That guaranteed set is
an **Expo SDK version**.

> 🧠 **Definition — Expo SDK version.** A pinned, mutually-compatible matrix of
> `react`, `react-native`, and every `expo-*` / community native module. SDK 54
> means React 19.1.0, React Native 0.81.5, `expo-camera@~17`, and so on. Mixing
> versions across SDKs is the single most common cause of "it won't build".

Expo publishes this matrix in a file called `bundledNativeModules.json`. The
command `npx expo install <pkg>` reads it and installs the version that matches
your SDK, rather than the latest on npm. That is why you should never
`npm install expo-camera@latest` in an Expo project.

> 🧠 **Definition — Metro.** The bundler React Native uses. It walks your import
> graph starting from the entry file, resolves every `import`/`require` to a file
> on disk, and packs them into one JavaScript bundle (compiled to Hermes bytecode
> for release). If any import can't be resolved, the bundle fails — which makes
> "does it bundle?" a strong correctness signal, used in *Verification* below.

### The narrow problem: why this repo didn't build on modern Expo

The old `package.json` targeted **SDK 50** and carried a machine-learning stack to
run **MoveNet** (a pose model) on camera frames:

```jsonc
"@tensorflow/tfjs": "^4.20.0",
"@tensorflow/tfjs-react-native": "^1.0.0",   // ⚠️ unmaintained, needs expo-gl + a native camera-tensor bridge
"@tensorflow-models/pose-detection": "^2.1.3",
"expo-gl": "~13.6.0",                          // pulled in only to give TF a WebGL context
"react-native-fs": "^2.20.0",                  // ⚠️ unmaintained, requires manual native linking
"expo": "~50.0.21", "react": "18.2.0", "react-native": "0.73.6"
```

This causes three distinct problems on SDK 54:

1. **Forbidden / unmaintained dependencies.** `@tensorflow/tfjs-react-native`
   hasn't kept pace with React Native's New Architecture; `react-native-fs` is
   effectively abandoned in favour of `expo-file-system`. Both fight the SDK 54
   toolchain.
2. **A bundler hack that shouldn't need to exist.** `@tensorflow-models/pose-detection`
   barrel-imports web-only backends (the WebGPU backend, MediaPipe). To stop Metro
   choking on them, the repo shipped a `metro.config.js` that *redirected* those
   modules to an empty stub (`shims/empty.js`). That is a smell: we were bending
   the bundler around a dependency we barely used.
3. **A breaking `expo-camera` API change.** SDK 50 used the `<Camera>` component
   with a `CameraType.back` **enum** and `Camera.useCameraPermissions()`. Modern
   `expo-camera` (v17) replaced all of that with the `<CameraView>` component, a
   top-level `useCameraPermissions()` hook, and a `CameraType` that is now a plain
   **string union** `'front' | 'back'`.

The task was explicit: **remove the ML stack entirely, do not implement pose
detection yet, and make the project build and run on SDK 54** — while preserving
the folder structure, the reusable UI, the navigation, and the tested core.

---

## Intuition

The key realisation is that RepCam is really *two* programs wearing one coat:

- **A pure counting engine.** Given a stream of poses (17 body keypoints per
  frame), decide how many reps happened. This is deterministic TypeScript with no
  camera and no TensorFlow, and it is covered by 51 unit tests.
- **A frame → pose producer.** Turn camera pixels into those keypoints. *This* is
  the only part that needed TensorFlow.

Everything forbidden lived in the second program. So the migration is a clean cut:
keep the engine, delete the ML producer, and give the engine a different pose
source.

> 💡 **The core move.** The workout screen never talked to TensorFlow directly —
> it talked to a `PoseProvider` interface and pushed whatever poses it got into
> the engine. We already had a second implementation of that interface, a
> `MockPoseProvider` that *synthesises* a moving skeleton for the demo/fallback
> view. We simply promote the mock to be the (temporary) pose source everywhere.

Concretely, the data flow changes like this:

```
BEFORE:  camera frame ─▶ tfjs tensor ─▶ MoveNet ─▶ pose ─▶ RepCounter ─▶ "12 reps"
                         └────────── removed ──────────┘

AFTER:   live camera (preview only, not analysed)
         synthetic mover ─▶ pose ─▶ RepCounter ─▶ "12 reps"
```

A toy example makes the "simulated counter" concrete. The mock mover oscillates
one joint angle over time, e.g. for push-ups the elbow angle sweeps
`40° → 175° → 40° → …`. Feed that into the *same* hysteresis state machine and it
counts a rep every time the angle completes a full `down → up` cycle — so the big
number on screen ticks up roughly once per second, and the "Finish set" flow saves
a real record to History and Statistics. Nothing downstream can tell that the
poses were synthetic rather than from a camera, which is exactly why the whole UI
stays exercisable.

---

## Code

### 1. Dependencies (`package.json`)

Out went the ML stack and the unmaintained packages; everything else moved to its
SDK 54 version (taken from Expo's `bundledNativeModules.json`):

| Removed | Upgraded / kept (SDK 54) |
| --- | --- |
| `@tensorflow/tfjs` | `expo` → `~54.0.35` |
| `@tensorflow/tfjs-react-native` | `react` → `19.1.0`, `react-native` → `0.81.5` |
| `@tensorflow-models/pose-detection` | `expo-camera` → `~17.0.10` |
| `expo-gl` | `expo-haptics` → `~15.0.8`, `expo-status-bar` → `~3.0.9` |
| `react-native-fs` | `@react-native-async-storage/async-storage` → `2.2.0` |
| | `react-native-svg` → `15.12.1`, `-screens` → `~4.16.0`, `-safe-area-context` → `~5.6.0` |
| | `@react-navigation/*` → **v7**; `typescript` → `~5.9.2` |

One non-obvious addition: `babel-preset-expo` is now listed explicitly in
`devDependencies`.

> ⚠️ **Edge case — the hoisting trap.** `babel-preset-expo` is a dependency *of*
> `expo`, so you'd expect it to just work. But npm installed it *nested* under
> `node_modules/expo/node_modules/`, where Babel (resolving from the project root)
> couldn't find it, and Metro failed with `Cannot find module 'babel-preset-expo'`.
> Declaring it as a direct devDependency hoists it to the top-level
> `node_modules/` and fixes the bundle. This is a known Expo gotcha.

### 2. Deleting the machine-learning path

Three files were removed outright:

- `src/services/pose/MoveNetPoseProvider.ts` — the TensorFlow implementation.
- `metro.config.js` — the custom resolver only existed to stub TF's web backends;
  with TF gone, Expo's default Metro config is correct.
- `shims/empty.js` — the stub those redirects pointed at.

### 3. Migrating `expo-camera` to the v17 API

The `<Camera>` + enum API is gone. The new API is a component + a hook + a string
union:

```tsx
// BEFORE (SDK 50)
import { Camera, CameraType } from 'expo-camera';
const [permission, requestPermission] = Camera.useCameraPermissions();
const [cameraType, setCameraType] = useState<CameraType>(CameraType.back);

// AFTER (SDK 54)
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
const [permission, requestPermission] = useCameraPermissions();
const [cameraType, setCameraType] = useState<CameraType>('back'); // 'front' | 'back'
```

The camera-flip button changed accordingly, from comparing against `CameraType.back`
to comparing against the literal `'back'`.

### 4. The new `CameraPoseView`

This is the heart of the change. The old view wrapped a `TensorCamera` and ran
MoveNet on every frame. The new one renders a plain `<CameraView>` preview, shows
the required placeholder banner, and drives the temporary counter with the
synthetic mover:

```tsx
export function CameraPoseView({ exerciseId, onPose, onError, facing }: CameraPoseViewProps) {
  const providerRef = useRef(new MockPoseProvider(EXERCISES[exerciseId]));

  // TEMPORARY: synthesize movement (~30 fps) so the fake rep counter ticks up.
  useEffect(() => {
    let active = true;
    const tick = async () => {
      if (!active) return;
      const pose = await providerRef.current.estimate(undefined);
      if (pose) onPose(pose);           // ← same seam the real detector will use
    };
    const interval = setInterval(tick, 33);
    return () => { active = false; clearInterval(interval); };
  }, [onPose]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <CameraView style={StyleSheet.absoluteFill} facing={facing}
        onMountError={(e) => onError(e?.message ?? 'Camera failed to start.')} />
      {/* … banner: "Pose Detection will be implemented later." … */}
    </View>
  );
}
```

The `SessionScreen` still requests camera permission, still falls back to **Demo
mode** if permission is denied (so it works on simulators), and still shows the big
rep number and the "Finish set" → save-to-history flow — all unchanged.

### 5. Screens & navigation

The task's required screen list includes both a **History** screen and a
**Statistics** screen. The app already stored a full workout history in
AsyncStorage but only surfaced aggregates on a single "Progress" tab, so:

- Added `src/screens/HistoryScreen.tsx` — lists every logged set grouped by day
  (Today / Yesterday / date), with a long-press-to-delete affordance. It is a thin
  renderer over the existing `HistoryContext` and `dayKey` helper.
- Renamed `ProgressScreen` → `StatisticsScreen` (title "Statistics").
- The bottom tabs are now **Home · History · Statistics · Settings**; the
  `Session` and `Paywall` screens remain stack modals. `TabParamList` was updated
  to match.

React Navigation moved from v6 to **v7**. The APIs RepCam uses
(`createNativeStackNavigator`, `createBottomTabNavigator`, a themed
`NavigationContainer`) are source-compatible; the themed container keeps working
because it spreads the built-in `DefaultTheme`/`DarkTheme` (which in v7 already
include the required `fonts` field) before overriding colours.

### 6. Comment & doc hygiene

Comments that described the now-removed MoveNet/TensorFlow path (in
`PoseProvider.ts`, `MockPoseProvider.ts`, `useRepSession.ts`, `core/pose/types.ts`)
were updated so the code no longer references packages that aren't installed. The
README was rewritten for SDK 54, and `docs/EXPLAINER.md` got a status note.

---

## Verification

Because api.expo.dev is not reachable from the build sandbox, `expo install --check`
can't run here; instead every version was validated by hand against Expo's
`bundledNativeModules.json` for the `sdk-54` branch. The functional checks all pass:

| Check | Command | Result |
| --- | --- | --- |
| Types | `npx tsc --noEmit` | ✅ 0 errors |
| Unit tests | `npx jest` | ✅ 51 passed, 7 suites |
| iOS bundle | `EXPO_OFFLINE=1 expo export --platform ios` | ✅ 1001 modules, no missing imports |
| Android bundle | `EXPO_OFFLINE=1 expo export --platform android` | ✅ bundles clean |
| Dev server | `EXPO_OFFLINE=1 expo start` | ✅ boots, `/status` → HTTP 200 |

> 🔎 **Why `expo export` is the acid test.** It runs the *exact* Metro pipeline
> that `expo start` uses and resolves the entire import graph. A successful export
> means there are no missing imports, no unresolved packages, and no dangling
> references to the deleted TensorFlow modules.

**Manual QA on a device / simulator:**

1. `npm install`
2. `npx expo start`, then press `i` (iOS) or `a` (Android), or scan the QR in Expo Go.
3. On **Home**, pick an exercise and tap **Start**.
4. Approve the camera permission. You should see the **live camera**, the banner
   *"Pose Detection will be implemented later."*, and the big **REP** number
   ticking upward on its own (the simulated counter).
5. Tap **Finish set**. Confirm the set appears on the **History** tab and that the
   totals/charts update on the **Statistics** tab.
6. Deny the camera permission (or run on a simulator without a camera) and confirm
   the screen falls back to **Demo mode** with an animated skeleton.

---

## Alternatives

**A. Keep on-device pose detection, but swap TensorFlow for a maintained stack**
(e.g. `react-native-vision-camera` frame processors + MLKit/TFLite pose).

| Pros | Cons |
| --- | --- |
| Delivers the "real" product feature | Explicitly out of scope — the task says *do not* implement pose detection yet |
| Avoids a second migration later | Requires a config/dev build (not pure Expo Go) and native setup |
| | Much larger, riskier change; harder to verify without a device |

**B. Drop the camera entirely and make the counter a manual tap / timer.**

| Pros | Cons |
| --- | --- |
| Simplest possible; fewer permissions | The spec explicitly requires a live `expo-camera` preview |
| No camera edge cases to handle | Throws away the camera plumbing we'll need again soon |
| | The rep engine would go unused, making 51 tests dead weight |

The chosen approach (live preview + synthetic pose source behind the existing
`PoseProvider` seam) is the smallest change that satisfies every requirement while
keeping the real detector a drop-in away.

---

## Suggested people to talk to

The entire prior git history of this repository has a **single author — an AI
agent committing as `Claude <noreply@anthropic.com>`** (verified via
`git log --format='%an'`). There is therefore no human with pre-existing context on
these files to point you to.

Practically, that means two things: (1) treat the code as un-reviewed-by-a-human
and lean on the tests + the bundle checks above; and (2) loop in whoever owns your
team's **mobile / Expo tooling** for the dependency-matrix decisions (SDK pinning,
New Architecture, and the eventual choice of a real pose-detection library), since
that is where the next round of risk lives.

---

## Quiz

<details>
<summary><b>1.</b> Why was the TensorFlow stack the <i>only</i> thing that had to be removed to satisfy "no ML, keep everything else"?</summary>

- **A.** Because the rep-counting engine imported TensorFlow directly.
- **B. ✅ Because the engine only ever consumed a `PoseProvider`; TensorFlow lived exclusively in the frame→pose producer (`MoveNetPoseProvider` + `CameraPoseView`), so removing that producer left the pure engine intact.**
- **C.** Because TensorFlow was used for storage and charts too.

*A and C are wrong: `src/core` has no TensorFlow imports (that's why it's unit-testable), and storage/charts use AsyncStorage and plain geometry.*
</details>

<details>
<summary><b>2.</b> After removing TensorFlow, why did the very first <code>expo export</code> still fail?</summary>

- **A.** A TypeScript error in the new camera view.
- **B.** The `expo-camera` version was wrong.
- **C. ✅ `babel-preset-expo` was installed nested under `node_modules/expo/` instead of hoisted to the root, so Babel couldn't resolve it; adding it as a direct devDependency fixed the bundle.**

*It was a module-resolution/hoisting issue, not a type or version error — the types compiled and the camera version already matched SDK 54.*
</details>

<details>
<summary><b>3.</b> What is the difference between the SDK 50 and SDK 54 <code>CameraType</code>?</summary>

- **A. ✅ SDK 50 exposed `CameraType` as an enum (`CameraType.back`); SDK 54 makes it a string union `'front' | 'back'`, so you pass the literal `'back'` to `<CameraView facing=...>`.**
- **B.** They are identical; only the component name changed.
- **C.** SDK 54 removed `CameraType` entirely.

*The component also changed (`Camera` → `CameraView`) and permissions moved to a top-level `useCameraPermissions()` hook, but the question is specifically about the type.*
</details>

<details>
<summary><b>4.</b> How does the app keep the rep counter "functional" without any pose detection?</summary>

- **A.** It increments a number on a fixed timer.
- **B. ✅ `CameraPoseView` runs the existing `MockPoseProvider` on an interval and pushes its synthetic poses through the same `RepCounter` hysteresis state machine, so reps are genuinely *counted* from a simulated movement signal.**
- **C.** It replays a recorded workout from AsyncStorage.

*Option A would bypass the real engine; the point of using the mock is that the entire counting pipeline (and its 51 tests) stays exercised, so wiring a real detector later needs no downstream changes.*
</details>

<details>
<summary><b>5.</b> Why is a successful <code>expo export</code> a meaningful correctness check for this change?</summary>

- **A.** It runs the unit tests.
- **B.** It uploads the app to the App Store.
- **C. ✅ It runs the same Metro pipeline as `expo start` and resolves the entire import graph, so it fails loudly if any import is missing or if a deleted TensorFlow module is still referenced anywhere.**

*It doesn't run Jest (that's a separate check) and it produces a local bundle, not a store upload. Its value here is proving there are no unresolved/dangling imports after the deletions.*
</details>
