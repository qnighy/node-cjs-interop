import foo from "foo";
import bar from "bar";
import baz from "baz";
import foobar from "foobar";
import scopedFoo from "@scoped/foo";
import scopedBar from "@scoped/bar";
import scopedBaz from "@scoped/baz";
import scopedFoobar from "@scoped/foobar";
import scoopedFoo from "@scooped/foo";
import scoopedBar from "@scooped/bar";
import scoopedBaz from "@scooped/baz";
import scoopedFoobar from "@scooped/foobar";
import fooSub from "foo/sub.js";
import barSub from "bar/sub.js";
import bazSub from "baz/sub";
import relative from "./relative.js";
import absolute from "/path/to/absolute.js";

console.log({
  foo,
  bar,
  baz,
  foobar,
  scopedFoo,
  scopedBar,
  scopedBaz,
  scopedFoobar,
  scoopedFoo,
  scoopedBar,
  scoopedBaz,
  scoopedFoobar,
  fooSub,
  barSub,
  bazSub,
  relative,
  absolute,
});
