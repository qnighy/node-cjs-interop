/** @type {import("@babel/core").TransformOptions} */
export default {
  extends: "./babel.config.js",
  presets: [["@babel/preset-env", { modules: "commonjs" }]],
};
