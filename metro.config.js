// Learn more: https://docs.expo.dev/guides/customizing-metro/
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// `@tensorflow-models/pose-detection` eagerly requires web-only modules
// (MediaPipe + the WebGPU backend) from its barrel index. On React Native we
// only use MoveNet via tfjs-react-native's native backend, so we resolve those
// modules to an empty stub to keep the bundle lean and Metro happy.
const EMPTY_MODULE = path.resolve(__dirname, 'shims/empty.js');
const STUBBED_MODULES = new Set(['@tensorflow/tfjs-backend-webgpu', '@mediapipe/pose']);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (STUBBED_MODULES.has(moduleName)) {
    return { type: 'sourceFile', filePath: EMPTY_MODULE };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
