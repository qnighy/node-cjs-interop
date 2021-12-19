export default {
  plugins: [
    [
      "babel-plugin-node-cjs-interop",
      {
        modulePrefixes: ["fixture-package-babel-esm"],
      },
    ],
  ],
};
