# babel-plugin-node-cjs-interop

## 0.1.7

### Patch Changes

- 37a65b0: Support dynamic imports

## 0.1.6

### Patch Changes

- fb98f16: Internally improve Babel config

## 0.1.5

### Patch Changes

- 972e632: Add a variant helper that wraps default one more time.

  The helper is called `interopImportCJSNamespaceT` and you can use it just like `interopImportCJSNamespace`
  (except that it assumes `loose = true` by default).

  To use it from the Babel/SWC plugins, use the `packagesT` option instead of `packages`.

## 0.1.4

### Patch Changes

- 54b33bb: Change how dual packages are configured

## 0.1.3

- Update dependencies

## 0.1.2

Add `loose` option to support more libraries.

## 0.1.1

Fix `Property typeName of TSTypeReference expected node to be of a type ["TSEntityName"] but instead got "MemberExpression"` when used in conjunction with TypeScript

## 0.1.0

Initial release.
