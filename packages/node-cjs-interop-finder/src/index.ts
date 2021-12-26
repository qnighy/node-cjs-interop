import { listTargetPackages } from "./list-packages.js";

(async () => {
  const packages = await listTargetPackages({
    basePath: process.cwd(),
    mainFields: [],
    console,
  });
  console.log(`packages (Node.js): [`);
  for (const packageName of packages) {
    console.log(`  ${JSON.stringify(packageName)},`);
  }
  console.log("]");

  const packagesWeb = await listTargetPackages({
    basePath: process.cwd(),
    mainFields: ["browser", "module"],
    console,
  });
  console.log(`packages (bundler): [`);
  for (const packageName of packagesWeb) {
    console.log(`  ${JSON.stringify(packageName)},`);
  }
  console.log("]");
})();
