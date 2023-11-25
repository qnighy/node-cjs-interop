# swc-plugin-node-cjs-interop

## 0.1.5

### Patch Changes

- 37a65b0: Support dynamic imports

## 0.1.4

### Patch Changes

- b16c3ee: Update swc monorepo

## 0.1.3

### Patch Changes

- 972e632: Add a variant helper that wraps default one more time.

  The helper is called `interopImportCJSNamespaceT` and you can use it just like `interopImportCJSNamespace`
  (except that it assumes `loose = true` by default).

  To use it from the Babel/SWC plugins, use the `packagesT` option instead of `packages`.

## 0.1.2

- Update dependencies

## 0.1.1

Add `loose` option to support more libraries.

## 0.1.0

Initial release.
