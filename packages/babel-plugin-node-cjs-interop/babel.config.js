/** @type {import("@babel/core").TransformOptions} */
export default {
  targets: { node: "14" },
  presets: [
    ["@babel/preset-env", { modules: false }],
    ["@babel/preset-typescript", { allowDeclareFields: true }],
  ],
};
