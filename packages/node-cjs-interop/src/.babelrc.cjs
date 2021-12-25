const { createConfig } = require("../configs/babelrc.base.cjs");

module.exports = createConfig({ cjs: process.env.BUILD_TARGET === "cjs" });
