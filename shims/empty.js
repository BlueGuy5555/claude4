// Intentionally empty.
//
// The `@tensorflow-models/pose-detection` package barrel-imports web-only
// backends (WebGPU) and the MediaPipe runtime that RepCam never uses — we run
// MoveNet through tfjs-react-native's native backend. Metro is pointed here for
// those modules so bundling succeeds without shipping unused web code.
module.exports = {};
