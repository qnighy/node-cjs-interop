export default {
  plugins: [
    [
      "babel-plugin-node-cjs-interop",
      {
        packages: [
          "fixture-package-babel-esm",
          "fixture-package-mangled-babel-esm",
        ],
        loose: true,
      },
    ],
  ],
};
