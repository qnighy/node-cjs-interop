import { describe, expect, it } from "@jest/globals";
import { transform, TransformOptions } from "@babel/core";
import plugin from ".";

const defaultOptions: TransformOptions = {
  presets: [],
  plugins: [[plugin, { modulePrefixes: ["mod"] }]],
  configFile: false,
  babelrc: false,
};

describe("babel-plugin-node-cjs-interop", () => {
  it("wraps default imports", () => {
    const result = transform(`import f from "mod";\nconsole.log(f);\n`, defaultOptions);
    expect(result?.code).toMatchSnapshot();
  });

  it("wraps named default imports", () => {
    const result = transform(`import { default as f } from "mod";\nconsole.log(f);\n`, defaultOptions);
    expect(result?.code).toMatchSnapshot();
  });

  it("wraps namespace imports", () => {
    const result = transform(`import * as M from "mod";\nconsole.log(M);\n`, defaultOptions);
    expect(result?.code).toMatchSnapshot();
  });

  it("doesn't wrap named imports", () => {
    const result = transform(`import { f } from "mod";\nconsole.log(f);\n`, defaultOptions);
    expect(result?.code).toMatchSnapshot();
  });

  describe("with typescript", () => {
    const options: TransformOptions = {
      ...defaultOptions,
      presets: ["@babel/preset-typescript"],
      filename: "test.ts",
    };

    it("wraps default imports", () => {
      const result = transform(`import f from "mod";\nconsole.log(f);\n`, options);
      expect(result?.code).toMatchSnapshot();
    });

    it("wraps named default imports", () => {
      const result = transform(`import { default as f } from "mod";\nconsole.log(f);\n`, options);
      expect(result?.code).toMatchSnapshot();
    });

    it("wraps namespace imports", () => {
      const result = transform(`import * as M from "mod";\nconsole.log(M);\n`, options);
      expect(result?.code).toMatchSnapshot();
    });

    it("doesn't wrap named imports", () => {
      const result = transform(`import { f } from "mod";\nconsole.log(f);\n`, options);
      expect(result?.code).toMatchSnapshot();
    });

    it("doesn't wrap type imports (default imports)", () => {
      const result = transform(`import type f from "mod";\n`, options);
      expect(result?.code).toMatchSnapshot();
    });

    it("doesn't wrap type imports (named default imports)", () => {
      const result = transform(`import type { default as f } from "mod";\n`, options);
      expect(result?.code).toMatchSnapshot();
    });

    it("doesn't wrap type imports (named default imports, individual specification)", () => {
      const result = transform(`import { type default as f } from "mod";\n`, options);
      expect(result?.code).toMatchSnapshot();
    });

    it("doesn't wrap type imports (namespace imports)", () => {
      const result = transform(`import type * as M from "mod";\n`, options);
      expect(result?.code).toMatchSnapshot();
    });
  });

  describe("source filtering", () => {
    it("filters sources", () => {
      const result = transform(`import foo from "foo";\nimport bar from "bar";\nconsole.log(foo, bar)\n`, {
        ...defaultOptions,
        plugins: [[plugin, { modulePrefixes: ["foo"] }]],
      });
      expect(result?.code).toMatchSnapshot();
    });

    it("filters multiple sources", () => {
      const result = transform(`import foo from "foo";\nimport bar from "bar";\nimport baz from "baz";\nconsole.log(foo, bar, baz)\n`, {
        ...defaultOptions,
        plugins: [[plugin, { modulePrefixes: ["foo", "bar"] }]],
      });
      expect(result?.code).toMatchSnapshot();
    });

    it("matches subdirectories", () => {
      const result = transform(`import foo from "foo";\nimport bar from "foo/bar";\nimport baz from "baz";\nconsole.log(foo, bar, baz)\n`, {
        ...defaultOptions,
        plugins: [[plugin, { modulePrefixes: ["foo"] }]],
      });
      expect(result?.code).toMatchSnapshot();
    });

    it("doesn't match non-subdirectory prefixes", () => {
      const result = transform(`import foo from "foo";\nimport bar from "foobar";\nimport baz from "baz";\nconsole.log(foo, bar, baz)\n`, {
        ...defaultOptions,
        plugins: [[plugin, { modulePrefixes: ["foo"] }]],
      });
      expect(result?.code).toMatchSnapshot();
    });

    it("allows specifying scoped packages", () => {
      const result = transform(`import foo from "@foo/foo";\nimport bar from "@foo/bar";\nimport baz from "baz";\nconsole.log(foo, bar, baz)\n`, {
        ...defaultOptions,
        plugins: [[plugin, { modulePrefixes: ["@foo/bar"] }]],
      });
      expect(result?.code).toMatchSnapshot();
    });
  });
})
