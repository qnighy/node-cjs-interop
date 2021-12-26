/**
 * @type {(options: { esm: boolean }) => import("@babel/core").TransformOptions}
 */
exports.createConfig = ({ esm }) => {
  return {
    presets: [
      [
        "@babel/preset-env",
        { targets: { node: "14" }, modules: esm ? false : "commonjs" },
      ],
      ["@babel/preset-typescript", { allowDeclareFields: true }],
    ],
    plugins: [
      esm && [
        "babel-plugin-replace-import-extension",
        { extMapping: { ".js": ".mjs" } },
      ],
    ].filter(Boolean),
  };
};
