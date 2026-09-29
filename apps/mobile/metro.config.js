// Expo configures Metro for the pnpm monorepo automatically (SDK 52+) — do not add
// watchFolders / nodeModulesPaths here. NativeWind compiles src/global.css.
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

module.exports = withNativeWind(getDefaultConfig(__dirname), { input: './src/global.css' });
