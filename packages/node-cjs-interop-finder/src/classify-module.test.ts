import { describe, expect, it } from "@jest/globals";
import { classifyModule } from "./classify-module";

describe("classifyModule", () => {
  it("Detects pure CJS", () => {
    expect(classifyModule(`
      module.exports = function() {
        console.log("Hello, world!");
      };
    `)).toBe("commonjs");
  });

  it("Detects ESM", () => {
    expect(classifyModule(`
      export default function() {
        console.log("Hello, world!");
      }
    `)).toBe("module");
  });

  it("Detects exports.__esModule with Object.defineProperty", () => {
    expect(classifyModule(`
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true
      });
      exports.default = _default;

      function _default() {
        console.log("Hello, world!");
      }
    `)).toBe("commonjs-babel");
  });

  it("Detects module.exports.__esModule with Object.defineProperty", () => {
    expect(classifyModule(`
      "use strict";

      Object.defineProperty(module.exports, "__esModule", {
        value: true
      });
      exports.default = _default;

      function _default() {
        console.log("Hello, world!");
      }
    `)).toBe("commonjs-babel");
  });

  it("Detects exports.__esModule with assignment", () => {
    expect(classifyModule(`
      "use strict";

      exports.__esModule = true;
      exports.default = _default;

      function _default() {
        console.log("Hello, world!");
      }
    `)).toBe("commonjs-babel");
  });

  it("Detects module.exports.__esModule with assignment", () => {
    expect(classifyModule(`
      "use strict";

      module.exports.__esModule = true;
      exports.default = _default;

      function _default() {
        console.log("Hello, world!");
      }
    `)).toBe("commonjs-babel");
  });
});
