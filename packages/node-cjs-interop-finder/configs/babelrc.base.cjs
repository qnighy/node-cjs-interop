exports.createConfig = function () {
  return {
    presets: [
      ["@babel/preset-env", { targets: { node: "14" }, modules: false }],
      ["@babel/preset-typescript", { allowDeclareFields: true }],
    ],
  };
};
