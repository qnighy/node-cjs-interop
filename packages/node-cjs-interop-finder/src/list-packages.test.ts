import { URL } from "node:url";
import path from "node:path";
import { describe, expect, it } from "@jest/globals";
import { listTargetPackages } from "./list-packages";

function filePath(url: string) {
  const urlObj = new URL(url);
  if (urlObj.protocol !== "file:")
    throw new Error(`Not a file protocol: ${url}`);
  return urlObj.pathname;
}

const fixtures = path.resolve(
  path.dirname(filePath(import.meta.url)),
  "./__fixtures__"
);

const consoleError: typeof console.error = (message) => {
  if (message instanceof Error) {
    throw message;
  }
  throw new Error(`console.error: ${message as string}`);
};

describe("listTargetPackges", () => {
  it("Lists simulated ESM packages for Node.js", async () => {
    const result = await listTargetPackages({
      basePath: path.resolve(fixtures, "package1"),
      mainFields: [],
      console: {
        error: consoleError,
        // log: console.log,
      } as typeof console,
    });
    expect(result).toEqual(["dep2", "dep3", "dep5"]);
  });

  it("Lists simulated ESM packages for module bundlers", async () => {
    const result = await listTargetPackages({
      basePath: path.resolve(fixtures, "package1"),
      mainFields: ["browser", "module"],
      console: {
        error: consoleError,
        // log: console.log,
      } as typeof console,
    });
    expect(result).toEqual(["dep2"]);
  });
});
