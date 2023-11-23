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
  plugins: ["@typescript-eslint", "jest"],
  ignorePatterns: ["dist/**/*", "cjs/dist/**/*"],
  rules: {
    "no-redeclare": "off",
    "@typescript-eslint/no-redeclare": "error",
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
      files: [".eslintrc.cjs"],
      parserOptions: {
        sourceType: "script",
      },
      rules: {
        "@typescript-eslint/no-var-requires": "off",
      },
    },
  ],
};
