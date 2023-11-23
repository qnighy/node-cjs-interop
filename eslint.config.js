import path from "node:path";

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import parser from "@typescript-eslint/parser";
import globals from "globals";

const __dirname = new URL(".", import.meta.url).pathname;

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  js.configs.recommended,
  ...compat.extends("plugin:@typescript-eslint/recommended"),
  ...compat.extends("plugin:jest/recommended"),
  prettier,
  {
    files: ["**/*.@(?([mc])[jt]s|[jt]sx)"],
  },
  {
    ignores: [
      "**/dist/**/*",
      "packages/babel-plugin-node-cjs-interop/test/fixtures/**/output.*",
    ],
  },
  {
    languageOptions: {
      parser,
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
    files: ["packages/node-cjs-interop/@(src|test)/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: [
          path.resolve(__dirname, "./packages/node-cjs-interop/tsconfig.json"),
          path.resolve(
            __dirname,
            "./packages/node-cjs-interop/configs/tsconfig.main.json"
          ),
        ],
      },
    },
  },
  {
    files: ["packages/babel-plugin-node-cjs-interop/@(src|test)/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: [
          path.resolve(
            __dirname,
            "./packages/babel-plugin-node-cjs-interop/tsconfig.json"
          ),
          path.resolve(
            __dirname,
            "./packages/babel-plugin-node-cjs-interop/configs/tsconfig.main.json"
          ),
        ],
      },
    },
  },
  {
    files: ["packages/node-cjs-interop-finder/@(src|test)/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: [
          path.resolve(
            __dirname,
            "./packages/node-cjs-interop-finder/tsconfig.json"
          ),
          path.resolve(
            __dirname,
            "./packages/node-cjs-interop-finder/configs/tsconfig.main.json"
          ),
        ],
      },
    },
  },
  {
    files: ["e2e/tests-e2e/@(src|test)/**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: [
          path.resolve(__dirname, "./e2e/tests-e2e/tsconfig.json"),
          path.resolve(__dirname, "./e2e/tests-e2e/configs/tsconfig.main.json"),
        ],
      },
    },
  },
  ...compat
    .extends("plugin:@typescript-eslint/recommended-type-checked")
    .map((c) => ({
      ...c,
      files: [
        "packages/*/@(src|test)/**/*.ts",
        "e2e/tests-e2e/@(src|test)/**/*.ts",
      ],
    })),
  ...compat.plugins("@babel/development"),
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
    files: ["packages/babel-plugin-node-cjs-interop/test/fixtures/**/input.*"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-import-assign": "off",
    },
  },
];
