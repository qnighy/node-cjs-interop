import fs from "node:fs";
import path from "node:path";
import resolve from "resolve";
import { classifyModule, ModuleType } from "./classify-module.js";

const NON_JS_PACKAGES = [
  /^@types\//,
  "type-fest",
];

type Options = {
  basePath: string;
  mainFields: string[];
  console: typeof console;
};

export async function listTargetPackages(options: Options): Promise<string[]> {
  const pjson = (await findPackageJson(options.basePath)) as {
    dependencies?: string[];
    devDependencies?: string[];
  };
  const packageNames: string[] = [];
  if (pjson.dependencies) {
    packageNames.push(...Object.keys(pjson.dependencies));
  }
  if (pjson.devDependencies) {
    packageNames.push(...Object.keys(pjson.devDependencies));
  }
  return await listTargetPackagesFrom(options, packageNames);
}

async function findPackageJson(basePath: string): Promise<unknown> {
  let currentPath = basePath;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const pjsonPath = path.resolve(currentPath, "package.json");
    if (fs.existsSync(pjsonPath)) {
      return JSON.parse(
        await fs.promises.readFile(pjsonPath, { encoding: "utf-8" })
      ) as unknown;
    }

    const nextPath = path.resolve(currentPath, "..");
    if (nextPath === currentPath)
      throw new Error(`Cannot find package.json in ${basePath}`);
    currentPath = nextPath;
  }
}

export async function listTargetPackagesFrom(
  options: Options,
  packageNames: string[]
): Promise<string[]> {
  const ret: string[] = [];
  for (const packageName of packageNames) {
    if (isNonJSPackage(packageName)) continue;

    let moduleType: ModuleType | undefined = undefined;
    try {
      moduleType = await classifyPackage(options, packageName);
    } catch (e) {
      options.console.error(e);
    }
    if (moduleType === "commonjs-babel") {
      ret.push(packageName);
    }
  }
  return ret;
}

function isNonJSPackage(packageName: string) {
  return NON_JS_PACKAGES.some((condition) => typeof condition === "string" ? packageName === condition : condition.test(packageName));
}

async function classifyPackage(
  options: Options,
  packageName: string
): Promise<ModuleType> {
  const [spec] = await new Promise<
    [string | undefined, PackageMeta | undefined]
  >((resolvePromise, reject) => {
    resolve(
      packageName,
      {
        basedir: options.basePath,
        packageFilter(pkg: Record<string, unknown>) {
          pkg = { ...pkg };
          for (const mainField of [...options.mainFields].reverse()) {
            if (typeof pkg[mainField] === "string") {
              pkg["main"] = pkg[mainField];
            } else if (typeof pkg[mainField] === "object") {
              const map = pkg[mainField] as Record<string, string>;
              const relativePath = pkg["main"] as string;
              if (typeof map[relativePath] === "string") pkg["main"] = map[relativePath];
            }
          }
          return pkg;
        },
      },
      (err, spec, meta) => {
        if (err) reject(err);
        else resolvePromise([spec, meta]);
      }
    );
  });
  if (!spec)
    throw new Error(`Cannot find ${packageName}: resolve returned nothing`);
  const code = await fs.promises.readFile(spec, { encoding: "utf-8" });
  return classifyModule(code);
}

type PackageMeta = {
  name: string;
  version: string;
  [key: string]: unknown;
};
