import { describe, expect, it } from "@jest/globals";
import { getPackageName } from "./package-name.js";

describe("getPackageName", () => {
  it("returns undefined for empty string", () => {
    expect(getPackageName("")).toBe(undefined);
  });

  it("returns undefined for absolute paths", () => {
    expect(getPackageName("/")).toBe(undefined);
    expect(getPackageName("/foo")).toBe(undefined);
    expect(getPackageName("/foo/bar")).toBe(undefined);
  });

  it("returns undefined for relative paths", () => {
    expect(getPackageName(".")).toBe(undefined);
    expect(getPackageName("./")).toBe(undefined);
    expect(getPackageName("./foo")).toBe(undefined);
    expect(getPackageName("./foo/bar")).toBe(undefined);
    expect(getPackageName("../foo")).toBe(undefined);
    expect(getPackageName("../foo/bar")).toBe(undefined);
  });

  it("returns first segment for unscoped packages", () => {
    expect(getPackageName("foo")).toBe("foo");
    expect(getPackageName("foo-bar")).toBe("foo-bar");
    expect(getPackageName("foo.bar")).toBe("foo.bar");
  });

  it("returns first segment for modules from unscoped packages", () => {
    expect(getPackageName("foo/index")).toBe("foo");
    expect(getPackageName("foo-bar/server")).toBe("foo-bar");
    expect(getPackageName("foo.bar/dist/index.js")).toBe("foo.bar");
  });

  it("returns first two segments for scoped packages", () => {
    expect(getPackageName("@test/foo")).toBe("@test/foo");
    expect(getPackageName("@test/foo-bar")).toBe("@test/foo-bar");
    expect(getPackageName("@test/foo.bar")).toBe("@test/foo.bar");
  });

  it("returns first two segments for modules from scoped packages", () => {
    expect(getPackageName("@test/foo/index")).toBe("@test/foo");
    expect(getPackageName("@test/foo-bar/server")).toBe("@test/foo-bar");
    expect(getPackageName("@test/foo.bar/dist/index.js")).toBe("@test/foo.bar");
  });

  it("returns undefined for incomplete scoped packages", () => {
    expect(getPackageName("@test")).toBe(undefined);
  });
});
