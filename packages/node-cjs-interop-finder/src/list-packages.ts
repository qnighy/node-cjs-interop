import fs from "node:fs";
import path from "node:path";
import resolve from "resolve";
import { classifyModule, ModuleType } from "./classify-module.js";

type Options = {
  basePath: string;
  mainFields: string[];
  console: typeof console;
};

export async function listTargetPackages(options: Options): Promise<string[]> {
  const pjson = await findPackageJson(options.basePath);
  const packageNames: string[] = [];
  if (pjson.dependencies) {
    packageNames.push(...Object.keys(pjson.dependencies));
  }
  if (pjson.devDependencies) {
    packageNames.push(...Object.keys(pjson.devDependencies));
  }
  return await listTargetPackagesFrom(options, packageNames);
}

async function findPackageJson(basePath: string): Promise<any> {
  let currentPath = basePath;
  while (true) {
    const pjsonPath = path.resolve(currentPath, "package.json");
    if (fs.existsSync(pjsonPath)) {
      return JSON.parse(await fs.promises.readFile(pjsonPath, { encoding: "utf-8" }));
    }

    const nextPath = path.resolve(currentPath, "..");
    if (nextPath === currentPath) throw new Error(`Cannot find package.json in ${basePath}`);
    currentPath = nextPath;
  }
}

export async function listTargetPackagesFrom(options: Options, packageNames: string[]): Promise<string[]> {
  const ret: string[] = [];
  for (const packageName of packageNames) {
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

async function classifyPackage(options: Options, packageName: string): Promise<ModuleType> {
  const [spec] = await new Promise<[string | undefined, any | undefined]>((resolvePromise, reject) => {
    resolve(packageName, {
      basedir: options.basePath,
      packageFilter(pkg) {
        for (const mainField of options.mainFields) {
          if (pkg[mainField]) return { ...pkg, main: pkg[mainField] };
        }
        return pkg;
      },
    }, (err, spec, meta) => {
      if (err) reject(err);
      else resolvePromise([spec, meta]);
    });
  });
  if (!spec) throw new Error(`Cannot find ${packageName}: resolve returned nothing`);
  const code = await fs.promises.readFile(spec, { encoding: "utf-8" });
  return classifyModule(code);
}
