import { describe, expect, it } from "@jest/globals";
import square1, {
  version as version1,
  counter as counter1,
  countUp as countUp1,
  getThis as getThis1,
} from "fixture-package-native-esm";
import square2, {
  version as version2,
  counter as counter2,
  countUp as countUp2,
  getThis as getThis2,
} from "fixture-package-babel-esm";
import square3, {
  version as version3,
  counter as counter3,
  countUp as countUp3,
  getThis as getThis3,
} from "fixture-package-pure-cjs";
import square4, {
  version as version4,
  counter as counter4,
  countUp as countUp4,
  getThis as getThis4,
} from "fixture-package-mangled-babel-esm";

describe("Basic usage with named imports", () => {
  describe("Native ESM", () => {
    it("imports default exports correctly", () => {
      expect(square1(10)).toBe(100);
    });
    it("imports named exports correctly", () => {
      expect(version1).toBe("0.1.2");
    });
    it("references the up-to-date value", () => {
      const oldValue = counter1;
      countUp1();
      expect(counter1).toBe(oldValue + 1);
    });
    it("doesn't attach the module as this value", () => {
      expect(getThis1()).toBe(undefined);
    });
  });
  describe("Babel ESM", () => {
    it("imports default exports correctly", () => {
      expect(square2(10)).toBe(100);
    });
    it("imports named exports correctly", () => {
      expect(version2).toBe("0.1.2");
    });
    it("references the up-to-date value", () => {
      const oldValue = counter2;
      countUp2();
      expect(counter2).toBe(oldValue + 1);
    });
    it("doesn't attach the module as this value", () => {
      expect(getThis2()).toBe(undefined);
    });
  });
  describe("Pure CJS", () => {
    it("imports default exports correctly", () => {
      expect(square3(10)).toBe(100);
    });
    it("imports named exports correctly", () => {
      expect(version3).toBe("0.1.2");
    });
    it("references the initial value", () => {
      const oldValue = counter3;
      countUp3();
      expect(counter3).toBe(oldValue);
    });
    it("doesn't attach the module as this value", () => {
      expect(getThis3()).toBe(undefined);
    });
  });
  describe("Mangled Babel ESM", () => {
    it("imports namespace as default", () => {
      expect((square4 as Interop<typeof square4>).default(10)).toBe(100);
      expect(typeof square4).toBe("object");
    });
    it("imports named exports correctly", () => {
      expect(version4).toBe("0.1.2");
    });
    it("references the initial value", () => {
      const oldValue = counter4;
      countUp4();
      expect(counter4).toBe(oldValue);
    });
    it("doesn't attach the module as this value", () => {
      expect(getThis4()).toBe(undefined);
    });
  });
});

type Interop<T> = T & { default: T };
