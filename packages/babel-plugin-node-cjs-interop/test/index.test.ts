import runner from "@babel/helper-plugin-test-runner/esm.mjs";

const __dirname = new URL(".", import.meta.url).pathname;

runner(__dirname);
