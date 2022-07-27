import { describe, expect, it } from "@jest/globals";
import { validateOptions } from "./options.js";

describe("validateOptions", () => {
  it("allows empty options", () => {
    const options = {};
    expect(() => validateOptions(options)).not.toThrow();
  });

  it("forbids unknown option keys", () => {
    const options = { foo: 42 };
    expect(() => validateOptions(options)).toThrow(
      "babel-plugin-node-cjs-interop: 'foo' is not a valid top-level option.\n- Did you mean 'loose'?"
    );
  });

  it("allows packages as an empty array", () => {
    const options = { packages: [] };
    expect(() => validateOptions(options)).not.toThrow();
  });

  it("allows packages as an array of strings", () => {
    const options = { packages: ["foo", "bar"] };
    expect(() => validateOptions(options)).not.toThrow();
  });

  it("forbids packages with non-string elements", () => {
    const options = { packages: ["foo", 42] };
    expect(() => validateOptions(options)).toThrow(
      "babel-plugin-node-cjs-interop: packages should be an array of strings"
    );
  });

  it("forbids non-package names in packages option", () => {
    const options = { packages: ["foo/bar", "foo"] };
    expect(() => validateOptions(options)).toThrow(
      "babel-plugin-node-cjs-interop: not a package name: foo/bar"
    );
  });

  it("allows loose as false", () => {
    const options = { loose: false };
    expect(() => validateOptions(options)).not.toThrow();
  });

  it("allows loose as true", () => {
    const options = { loose: true };
    expect(() => validateOptions(options)).not.toThrow();
  });

  it("forbids invalid loose value", () => {
    const options = { loose: 10 };
    expect(() => validateOptions(options)).toThrow(
      "babel-plugin-node-cjs-interop: 'loose' option must be a boolean."
    );
  });

  it("allows useRuntime as false", () => {
    const options = { useRuntime: false };
    expect(() => validateOptions(options)).not.toThrow();
  });

  it("allows useRuntime as true", () => {
    const options = { useRuntime: true };
    expect(() => validateOptions(options)).not.toThrow();
  });

  it("forbids invalid useRuntime value", () => {
    const options = { useRuntime: 10 };
    expect(() => validateOptions(options)).toThrow(
      "babel-plugin-node-cjs-interop: 'useRuntime' option must be a boolean."
    );
  });
});
