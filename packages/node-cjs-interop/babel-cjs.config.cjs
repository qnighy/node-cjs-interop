/** @type {import("@babel/core").TransformOptions} */
module.exports = {
  extends: "./babel.config.cjs",
  presets: [["@babel/preset-env", { modules: "commonjs" }]],
};
