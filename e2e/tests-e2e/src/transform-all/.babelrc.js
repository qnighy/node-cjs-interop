export default {
  plugins: [
    [
      "babel-plugin-node-cjs-interop",
      {
        modulePrefixes: [
          "fixture-package-native-esm",
          "fixture-package-babel-esm",
          "fixture-package-pure-cjs",
        ],
      },
    ],
  ],
};
