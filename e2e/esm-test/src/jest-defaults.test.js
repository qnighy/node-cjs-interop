import { describe, expect, it } from "@jest/globals";

import value1, { A as A1 } from "test-pkg1";
import value2, { A as A2 } from "test-pkg2";
import value3, { A as A3 } from "test-pkg3";

describe("babel-plugin-node-cjs-interop + jest", () => {
  it("interoperates with simulated ESM defaults", async () => {
    expect(value1).toBe("default-value");
    expect(A1).toBe("A");
  });

  it("interoperates with native ESM defaults", async () => {
    expect(value2).toBe("default-value");
    expect(A2).toBe("A");
  });

  it("interoperates with pure CJS defaults", async () => {
    expect(value3()).toBe("default-function");
    expect(A3).toBe("A");
  });
});
