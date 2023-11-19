import { OptionValidator } from "@babel/helper-validator-option";
import { isPackageName } from "./package-name.js";

const v: OptionValidator = new OptionValidator("babel-plugin-node-cjs-interop");

export type Options = {
  packages?: string[] | undefined;
  loose?: boolean;
  useRuntime?: boolean;
};

const optionShape = {
  packages: "string[]",
  loose: "boolean",
  useRuntime: "boolean",
} as const;

export function validateOptions(options: object): asserts options is Options {
  v.validateTopLevelOptions(options, optionShape);
  validatePackages(options.packages);
  v.validateBooleanOption("loose", options.loose as boolean | undefined);
  v.validateBooleanOption(
    "useRuntime",
    options.useRuntime as boolean | undefined,
  );
  validatePackagesSemantics(options.packages ?? []);
}

function validatePackages(
  packages: unknown,
): asserts packages is string[] | undefined {
  if (packages === undefined) return;
  if (!Array.isArray(packages)) {
    throw new Error(
      "babel-plugin-node-cjs-interop: packages should be an array",
    );
  }

  if (!packages.every((p): p is string => typeof p === "string")) {
    throw new Error(
      "babel-plugin-node-cjs-interop: packages should be an array of strings",
    );
  }
}

function validatePackagesSemantics(packages: string[]) {
  for (const name of packages) {
    if (!isPackageName(name)) {
      throw new Error(
        `babel-plugin-node-cjs-interop: not a package name: ${name}`,
      );
    }
  }
}
