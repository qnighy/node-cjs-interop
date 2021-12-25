export default {
  plugins: [
    [
      "babel-plugin-node-cjs-interop",
      {
        packages: [
          "fixture-package-native-esm",
          "fixture-package-babel-esm",
          "fixture-package-pure-cjs",
        ],
      },
    ],
  ],
};
