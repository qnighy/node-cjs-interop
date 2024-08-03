import path from "node:path";

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import jest from "eslint-plugin-jest";
import babelDevelopment from "@babel/eslint-plugin-development";
import prettier from "eslint-config-prettier";
import globals from "globals";

const __dirname = new URL(".", import.meta.url).pathname;

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
  ...tseslint.configs.recommendedTypeChecked.map((c) => ({
    ...c,
    files: [
      "packages/*/@(src|test)/**/*.ts",
      "e2e/tests-e2e/@(src|test)/**/*.ts",
    ],
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
    files: ["packages/babel-plugin-node-cjs-interop/test/fixtures/**/input.*"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-import-assign": "off",
    },
  }
);
