/** @type {import("@babel/core").TransformOptions} */
module.exports = {
  targets: { node: "14" },
  presets: [
    ["@babel/preset-env", { modules: false }],
    ["@babel/preset-typescript", { allowDeclareFields: true }],
  ],
};
