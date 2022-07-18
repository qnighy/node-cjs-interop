export default {
  transform: {
    "\\.[jt]sx?$": "@swc/jest"
  },
  extensionsToTreatAsEsm: [
    ".ts",
    ".mts"
  ],
  transformIgnorePatterns: [
    "/node_modules/",
    "\\.pnp\\.[^\\/]+$",
    "fixture-package",
    "babel-plugin-node-cjs-interop"
  ]
};
