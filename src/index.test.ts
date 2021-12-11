import { describe, expect, it } from "@jest/globals";
import { transform } from "@babel/core";
import plugin from ".";

describe("babel-plugin-import-interop-only", () => {
  it("wraps default imports", () => {
    const result = transform(`import f from "mod";\nconsole.log(f);\n`, {
      presets: [],
      plugins: [plugin],
      configFile: false,
      babelrc: false,
    });
    expect(result?.code).toMatchSnapshot();
  });

  it("wraps named default imports", () => {
    const result = transform(`import { default as f } from "mod";\nconsole.log(f);\n`, {
      presets: [],
      plugins: [plugin],
      configFile: false,
      babelrc: false,
    });
    expect(result?.code).toMatchSnapshot();
  });

  it("wraps namespace imports", () => {
    const result = transform(`import * as M from "mod";\nconsole.log(M);\n`, {
      presets: [],
      plugins: [plugin],
      configFile: false,
      babelrc: false,
    });
    expect(result?.code).toMatchSnapshot();
  });
})
