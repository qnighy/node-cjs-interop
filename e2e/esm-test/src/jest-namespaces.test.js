import { describe, expect, it } from "@jest/globals";

// import * as ns1 from "test-pkg1";
import * as ns2 from "test-pkg2";
import * as ns3 from "test-pkg3";

describe("babel-plugin-node-cjs-interop + jest", () => {
  // it("interoperates with simulated ESM namespace imports", async () => {
  //   expect(ns1.default).toBe("default-value");
  //   expect(ns1.A).toBe("A");
  // });

  it("interoperates with native ESM namespace imports", async () => {
    expect(ns2.default).toBe("default-value");
    expect(ns2.A).toBe("A");
  });

  it("interoperates with pure CJS namespace imports", async () => {
    expect(ns3.default()).toBe("default-function");
    expect(ns3.A).toBe("A");
  });
});
