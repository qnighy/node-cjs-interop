import { describe, expect, it } from "@jest/globals";
import { interopImportCJSNamespace, interopImportCJSDefault } from ".";
import * as module1 from "./__fixtures__/module1.cjs";
import * as module2 from "./__fixtures__/module2.cjs";
import * as module3 from "./__fixtures__/module3.mjs";
import * as module4 from "./__fixtures__/module4.cjs";

describe("interopImportCJSNamespace", () => {
  it("Returns the same value for pure CJS", () => {
    const wrapped = interopImportCJSNamespace(module1);
    expect(wrapped).toBe(module1);
    expect(wrapped.default(42)).toBe(1764);
    expect(wrapped.version).toBe("0.1.2");
  });

  it("Returns the default value for transpiled CJS", () => {
    const wrapped = interopImportCJSNamespace(module2);
    expect(wrapped).toBe(module2.default);
    expect(wrapped.default(42)).toBe(1764);
    expect(wrapped.version).toBe("0.1.2");
  });

  it("Returns the same value for native ESM", () => {
    const wrapped = interopImportCJSNamespace(module3);
    expect(wrapped).toBe(module3);
    expect(wrapped.default(42)).toBe(1764);
    expect(wrapped.version).toBe("0.1.2");
  });

  it("Returns the same value for poorly-written transpiled CJS", () => {
    const wrapped = interopImportCJSNamespace(module4);
    expect(wrapped).toBe(module4);
  });
});

describe("interopImportCJSNamespace with loose = true", () => {
  it("Returns the same value for pure CJS", () => {
    const wrapped = interopImportCJSNamespace(module1, true);
    expect(wrapped).toBe(module1);
    expect(wrapped.default(42)).toBe(1764);
    expect(wrapped.version).toBe("0.1.2");
  });

  it("Returns the default value for transpiled CJS", () => {
    const wrapped = interopImportCJSNamespace(module2, true);
    expect(wrapped).toBe(module2.default);
    expect(wrapped.default(42)).toBe(1764);
    expect(wrapped.version).toBe("0.1.2");
  });

  it("Returns the same value for native ESM", () => {
    const wrapped = interopImportCJSNamespace(module3, true);
    expect(wrapped).toBe(module3);
    expect(wrapped.default(42)).toBe(1764);
    expect(wrapped.version).toBe("0.1.2");
  });

  it("Returns the default value for poorly-written transpiled CJS", () => {
    const wrapped = interopImportCJSNamespace(module4, true);
    expect(wrapped).toBe(module4.default);
    expect(wrapped.default(42)).toBe(1764);
    expect(wrapped.version).toBe("0.1.2");
  });
});

describe("interopImportCJSDefault", () => {
  it("Returns the same value for pure CJS", () => {
    const wrapped = interopImportCJSDefault(module1.default);
    expect(wrapped).toBe(module1.default);
    expect(wrapped(42)).toBe(1764);
  });

  it("Returns the default value for transpiled CJS", () => {
    const wrapped = interopImportCJSDefault(module2.default);
    expect(wrapped).toBe(
      (module2 as unknown as { default: typeof module2 }).default.default
    );
    expect(wrapped(42)).toBe(1764);
  });

  it("Returns the same value for native ESM", () => {
    const wrapped = interopImportCJSDefault(module3.default);
    expect(wrapped).toBe(module3.default);
    expect(wrapped(42)).toBe(1764);
  });

  it("Returns the default value for poorly-written transpiled CJS", () => {
    const wrapped = interopImportCJSDefault(module4.default);
    expect(wrapped).toBe(
      (module4 as unknown as { default: typeof module4 }).default.default
    );
    expect(wrapped(42)).toBe(1764);
  });
});
