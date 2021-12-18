import { describe, expect, it } from "@jest/globals";
import util from "node:util";
import childProcess from "node:child_process";
import path from "node:path";

const execFile = util.promisify(childProcess.execFile);

const filename = new URL(import.meta.url).pathname;
const dirname = path.dirname(filename);
const root = path.resolve(dirname, "..");
const loaderArgs = ["--experimental-loader", path.resolve(root, "./node-loader-babel.js")];

describe("babel-plugin-node-cjs-interop + node-loader", () => {
  it("interoperates with simulated ESM defaults", async () => {
    const source = path.resolve(root, "src/test1.js");
    const { stdout } = await execFile("node", [...loaderArgs, source]);
    expect(stdout).toContain("OK");
  });

  it("interoperates with simulated ESM namespace imports", async () => {
    const source = path.resolve(root, "src/test2.js");
    const { stdout } = await execFile("node", [...loaderArgs, source]);
    expect(stdout).toContain("OK");
  });

  it("interoperates with native ESM defaults", async () => {
    const source = path.resolve(root, "src/test3.js");
    const { stdout } = await execFile("node", [...loaderArgs, source]);
    expect(stdout).toContain("OK");
  });

  it("interoperates with native ESM namespace imports", async () => {
    const source = path.resolve(root, "src/test4.js");
    const { stdout } = await execFile("node", [...loaderArgs, source]);
    expect(stdout).toContain("OK");
  });

  it("interoperates with pure CJS defaults", async () => {
    const source = path.resolve(root, "src/test5.js");
    const { stdout } = await execFile("node", [...loaderArgs, source]);
    expect(stdout).toContain("OK");
  });

  it("interoperates with pure CJS namespace imports", async () => {
    const source = path.resolve(root, "src/test6.js");
    const { stdout } = await execFile("node", [...loaderArgs, source]);
    expect(stdout).toContain("OK");
  });
});
