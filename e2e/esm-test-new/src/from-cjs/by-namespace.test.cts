import { describe, expect, it } from "@jest/globals";
import * as ns1 from "fixture-package-native-esm";
import * as ns2 from "fixture-package-babel-esm";
import * as ns3 from "fixture-package-pure-cjs";

describe("Basic CJS usage with namespace imports", () => {
  describe("Native ESM", () => {
    it("imports default exports correctly", () => {
      expect(ns1.default(10)).toBe(100);
    });
    it("imports named exports correctly", () => {
      expect(ns1.version).toBe("0.1.2");
    });
    it("references the up-to-date value", () => {
      const oldValue = ns1.counter;
      ns1.countUp();
      expect(ns1.counter).toBe(oldValue + 1);
    });
    it("is not callable by itself", () => {
      expect(typeof ns1).toBe("object");
    });
  });
  describe("Babel ESM", () => {
    it("imports default exports correctly", () => {
      expect(ns2.default(10)).toBe(100);
    });
    it("imports named exports correctly", () => {
      expect(ns2.version).toBe("0.1.2");
    });
    it("references the up-to-date value", () => {
      const oldValue = ns2.counter;
      ns2.countUp();
      expect(ns2.counter).toBe(oldValue + 1);
    });
    it("is not callable by itself", () => {
      expect(typeof ns2).toBe("object");
    });
  });
  describe("Pure CJS", () => {
    it("imports default exports correctly", () => {
      expect((ns3 as any).default(10)).toBe(100);
    });
    it("imports named exports correctly", () => {
      expect(ns3.version).toBe("0.1.2");
    });
    it("references the initial value", () => {
      const oldValue = ns3.counter;
      ns3.countUp();
      expect(ns3.counter).toBe(oldValue);
    });
    it("is not callable by itself", () => {
      expect(typeof ns3).toBe("object");
    });
  });
});
