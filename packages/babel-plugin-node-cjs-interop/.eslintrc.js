const path = require("path");

module.exports = {
  env: {
    node: true,
    es2021: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:jest/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
  },
  plugins: ["@typescript-eslint", "jest", "@babel/development"],
  rules: {
    "@babel/development/no-deprecated-clone": "error",
    "@babel/development/no-undefined-identifier": "error",
  },
  overrides: [
    {
      files: ["src/**/*.ts", "test/**/*.ts"],
      parser: "@typescript-eslint/parser",
      parserOptions: {
        project: [
          path.resolve(__dirname, "./tsconfig.json"),
          path.resolve(__dirname, "./configs/tsconfig.main.json"),
        ],
      },
      extends: [
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
    },
    {
      files: ["src/index.ts"],
      rules: {
        "@babel/development/plugin-name": "error",
      },
    },
    {
      files: [".eslintrc.js"],
      parserOptions: {
        sourceType: "script",
      },
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
};
