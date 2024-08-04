/** @type {import("@babel/core").TransformOptions} */
export default {
  extends: "./babel.config.cjs",
  presets: [["@babel/preset-env", { modules: "commonjs" }]],
};
