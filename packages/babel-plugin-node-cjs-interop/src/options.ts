import { OptionValidator } from "@babel/helper-validator-option";

const v: OptionValidator = new OptionValidator("babel-plugin-node-cjs-interop");

export type Options = {
  packages?: string[] | undefined;
};

const optionShape = {
  packages: "string[]",
} as const;

export function validateOptions(options: object): asserts options is Options {
  v.validateTopLevelOptions(options, optionShape);
  validatePackages(options.packages);
  if (options.packages !== undefined && !Array.isArray(options.packages)) {
    throw new Error("babel-plugin-node-cjs-interop: packages should be an array");
  }
}

function validatePackages(packages: unknown): asserts packages is string[] | undefined {
  if (packages === undefined) return;
  if (!Array.isArray(packages)) {
    throw new Error("babel-plugin-node-cjs-interop: packages should be an array");
  }

  if (!packages.every((p): p is string => typeof p === "string")) {
    throw new Error("babel-plugin-node-cjs-interop: packages should be an array of strings");
  }
}
