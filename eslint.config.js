import js from "@eslint/js";
import tseslint from "typescript-eslint";
import jest from "eslint-plugin-jest";
import babelDevelopment from "@babel/eslint-plugin-development";
import prettier from "eslint-config-prettier";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jest.configs["flat/recommended"],
  prettier,
  {
    files: ["**/*.@(?([mc])[jt]s|[jt]sx)"],
  },
  {
    ignores: [
      "**/dist/**/*",
      "packages/babel-plugin-node-cjs-interop/test/fixtures/**/output.*",
      "packages/swc-plugin-node-cjs-interop/tests/fixtures/**/output.*",
    ],
  },
  {
    languageOptions: {
      globals: {
        console: true,
      },
    },
  },
  {
    files: ["**/*.c[jt]s"],
    languageOptions: {
      parserOptions: {
        sourceType: "script",
      },
      globals: {
        ...globals.commonjs,
        __dirname: true,
        __filename: true,
      },
    },
  },
  {
    files: ["**/eslint.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["**/*.cjs"],
    rules: {
      "@typescript-eslint/no-var-requires": "off",
    },
  },
  {
    files: ["packages/*/@(src|test)/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
  },
  ...tseslint.configs.recommendedTypeChecked.map((c) => ({
    ...c,
    files: ["packages/*/@(src|test)/**/*.ts"],
  })),
  {
    plugins: {
      "@babel/development": babelDevelopment,
    },
  },
  {
    rules: {
      "@babel/development/no-deprecated-clone": "error",
      "@babel/development/no-undefined-identifier": "error",
    },
  },
  {
    files: ["packages/babel-plugin-node-cjs-interop/src/index.ts"],
    rules: {
      "@babel/development/plugin-name": "error",
    },
  },
  {
    files: [
      "packages/babel-plugin-node-cjs-interop/test/fixtures/**/input.*",
      "packages/swc-plugin-node-cjs-interop/tests/fixtures/**/input.*",
    ],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-import-assign": "off",
    },
  },
);
