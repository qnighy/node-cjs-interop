# node-cjs-interop-finder

## 0.1.5

### Patch Changes

- c75999a: chore(deps): update babel monorepo

## 0.1.4

### Patch Changes

- 95bef4e: Update typescript
- a6b57a9: Update Babel

## 0.1.3

### Patch Changes

- fb98f16: Internally improve Babel config

## 0.1.2

- Update dependencies

## 0.1.1

- Add executable entrypoint. Fixes https://github.com/qnighy/node-cjs-interop/issues/1
- Skip known type-only package names to reduce noise.
- Correctly process package.json with object-typed `browser` field.
- Show more user-friendly message when encountered a package with CSS as its main file.
  It used to show a different error that the Babel parser cannot process decorators by default.

## 0.1.0

Initial release.
