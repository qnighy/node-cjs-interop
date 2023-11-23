---
"babel-plugin-node-cjs-interop": patch
"swc-plugin-node-cjs-interop": patch
"node-cjs-interop": patch
---

Add a variant helper that wraps default one more time.

The helper is called `interopImportCJSNamespaceT` and you can use it just like `interopImportCJSNamespace`
(except that it assumes `loose = true` by default).

To use it from the Babel/SWC plugins, use the `packagesT` option instead of `packages`.
