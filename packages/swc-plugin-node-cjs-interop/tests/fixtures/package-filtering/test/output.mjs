const _ns = _interopImportCJSNamespace(_nsOrig5);
const _ns1 = _interopImportCJSNamespace(_nsOrig4);
const _ns2 = _interopImportCJSNamespace(_nsOrig3);
const _ns3 = _interopImportCJSNamespace(_nsOrig2);
const _ns4 = _interopImportCJSNamespace(_nsOrig1);
const _ns5 = _interopImportCJSNamespace(_nsOrig);
function _interopImportCJSNamespace(ns, loose) {
    return (loose || ns.__esModule) && ns.default && ns.default.__esModule ? ns.default : ns;
}
/*#__CJS__*/ import * as _nsOrig from "foo";
/*#__CJS__*/ import * as _nsOrig1 from "bar";
import baz from "baz";
import foobar from "foobar";
/*#__CJS__*/ import * as _nsOrig2 from "@scoped/foo";
/*#__CJS__*/ import * as _nsOrig3 from "@scoped/bar";
import scopedBaz from "@scoped/baz";
import scopedFoobar from "@scoped/foobar";
import scoopedFoo from "@scooped/foo";
import scoopedBar from "@scooped/bar";
import scoopedBaz from "@scooped/baz";
import scoopedFoobar from "@scooped/foobar";
/*#__CJS__*/ import * as _nsOrig4 from "foo/sub.js";
/*#__CJS__*/ import * as _nsOrig5 from "bar/sub.js";
import bazSub from "baz/sub";
import relative from "./relative.js";
import absolute from "/path/to/absolute.js";
console.log({
    foo: _ns5.default,
    bar: _ns4.default,
    baz,
    foobar,
    scopedFoo: _ns3.default,
    scopedBar: _ns2.default,
    scopedBaz,
    scopedFoobar,
    scoopedFoo,
    scoopedBar,
    scoopedBaz,
    scoopedFoobar,
    fooSub: _ns1.default,
    barSub: _ns.default,
    bazSub,
    relative,
    absolute
});
