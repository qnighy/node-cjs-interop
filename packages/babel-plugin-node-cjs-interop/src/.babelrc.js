const { createConfig } = require("../configs/babelrc.base.js");

module.exports = createConfig({ esm: process.env.BUILD_TARGET === "esm" });
