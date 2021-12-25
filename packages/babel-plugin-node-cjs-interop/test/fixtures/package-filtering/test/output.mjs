const _ns6 = _interopImportCJSNamespace(_nsOrig6);

const _ns5 = _interopImportCJSNamespace(_nsOrig5);

const _ns4 = _interopImportCJSNamespace(_nsOrig4);

const _ns3 = _interopImportCJSNamespace(_nsOrig3);

const _ns2 = _interopImportCJSNamespace(_nsOrig2);

const _ns = _interopImportCJSNamespace(_nsOrig);

function _interopImportCJSNamespace(ns) {
  return ns.default && ns.default.__esModule ? ns.default : ns;
}

/*#__CJS__*/
import * as _nsOrig from "foo";

/*#__CJS__*/
import * as _nsOrig2 from "bar";
import baz from "baz";
import foobar from "foobar";

/*#__CJS__*/
import * as _nsOrig3 from "@scoped/foo";

/*#__CJS__*/
import * as _nsOrig4 from "@scoped/bar";
import scopedBaz from "@scoped/baz";
import scopedFoobar from "@scoped/foobar";
import scoopedFoo from "@scooped/foo";
import scoopedBar from "@scooped/bar";
import scoopedBaz from "@scooped/baz";
import scoopedFoobar from "@scooped/foobar";

/*#__CJS__*/
import * as _nsOrig5 from "foo/sub.js";

/*#__CJS__*/
import * as _nsOrig6 from "bar/sub.js";
import bazSub from "baz/sub";
import relative from "./relative.js";
import absolute from "/path/to/absolute.js";
console.log({
  foo: _ns.default,
  bar: _ns2.default,
  baz,
  foobar,
  scopedFoo: _ns3.default,
  scopedBar: _ns4.default,
  scopedBaz,
  scopedFoobar,
  scoopedFoo,
  scoopedBar,
  scoopedBaz,
  scoopedFoobar,
  fooSub: _ns5.default,
  barSub: _ns6.default,
  bazSub,
  relative,
  absolute
});
