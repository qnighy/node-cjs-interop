/** @type {(options: { cjs: boolean }) => import("@babel/core").TransformOptions} */
exports.createConfig = function ({ cjs }) {
  return {
    presets: [
      ["@babel/preset-env", { targets: { node: "14" }, modules: cjs ? "commonjs" : false }],
      ["@babel/preset-typescript", { allowDeclareFields: true }],
    ],
    plugins: [
      cjs && ["babel-plugin-replace-import-extension", { extMapping: { ".js": ".cjs" }}],
    ].filter(Boolean),
  };
};
