# A Babel plugin to insert `interopRequireDefault` for Node.js native ESM

## Problem to solve

Consider the following modules:

```javascript
// mod1.js
export default "default";
export const A = "A";
```

```javascript
// mod2.js
import mod1 from "./mod1.js";
console.log(mod1);
```

We expect "default" to be printed. However, it is not always the case if the modules are in different packages and transpiled differently.

More specifically, when mod1.js was transpiled to CommonJS Modules using Babel and mod2.js is kept in the ES Modules format, then `{ A: "A", default: "default" }` is printed instead.

This is an unfortunate result of how different parts of the Node.js ecosystem dealt with the incompatibility between CommonJS and ES Modules under different constraints.

## When you need this

- Your package is a native ESM package. That means:
  - `package.json` contains `"type": "module"`
  - Or the module extensions are `.mjs`
- And you are using a simulated ESM package. That means:
  - `package.json` doesn't contain `"type": "module"` or the module extensions are `.cjs`
  - And the modules contain definitions of `__esModule` like the following:
    - `Object.defineProperty(exports, "__esModule", { value: true })`
    - `exports.__esModule = true `
- And you are using default exports from that package. One of the following:
  - `import foo from "the-package";`
  - `import { default as foo } from "the-package";`
  - `import * as fooNS from "the-package";` and `fooNS.default` is referenced

## Usage

Add this plugin to your Babel config:

```javascript
// babel.config.js or .babelrc.js
export default {
  presets: [
    ["@babel/preset-env", { modules: false }],
    // ...
  ],
  plugins: [
    [
      "babel-plugin-node-cjs-interop",
      {
        // Only apply the workaround to specific packages
        packages: [
          "styled-components",
          // ...
        ],
      }
    ]
    // ...
  ],
};
```

Then an import helper is inserted to absorb the inconsistencies.

## How it works

Babel (and similar transpilers) transforms the following code:

```javascript
export default "default";
export const A = "A";
```

like this:

```javascript
exports.A = exports.default = void 0;
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = "default";
exports.A = "A";
```

Transpilers use `__esModule` to distinguish simulated ESMs from pure CJS.

```javascript
// Original:
// import foo from "./foo.js";
// console.log(foo);
const _module = _interopRequireDefault(require("./foo.js"));

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

console.log(_module.default);
```

Therefore,

- If the imported module is a pure CJS, it imports the value of `module.exports`.
- If the imported module is a simluated ESM, it imports the value of `module.exports.default`.

Node.js' native ESM support uses different strategies for CJS interop:

- Importing ESM from CJS: dynamic import `await import(...)` is enforced. It returns the namespace object.
- Importing CJS from ESM: the CJS module is wrapped by an ES module.

The ESM wrapper is based on [cjs-module-lexer](https://github.com/nodejs/cjs-module-lexer). It syntactically analyzes the module and maps each exports to named exports. However, it always maps the whole `exports` object to the default export. So the generated wrapper is virtually like this:

```javascript
const exports = require("./wrapped.js");

// Maps each named export
export const __esModule = exports.__esModule;
export const A = exports.A;

// The default export always references the `export` object
export default exports;
```

To bring back the original intention, this plugin inserts the same helper (`interopRequireDefault`) without transforming it to CJS:

```javascript
// Original:
// import foo from "./foo.js";
// console.log(foo);
const _foo = _interopRequireDefault(foo);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

import foo from "./foo.js";
console.log(_foo.default);
```

It works under the following assumptions:

- Pure CJS modules don't have `__esModule`.
- Default exported objects don't have `__esModule`.

This plugin uses the same `interopRequireDefault` helper for namespace imports:

```javascript
// Original:
// import * as ns from "./foo.js";
// console.log(ns);
const _ns = _interopRequireDefault(ns);

function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : { default: obj };
}

import * as ns from "./foo.js";
console.log(_ns.default);
```

Interestingly, it also works because `__esModule` is also exposed as a named export.

## Caveats

If the `default` export changes over time, this plugin may break the existing semantics.
That is why you need to explicitly configure the `packages` option.

## Options

### `packages`

Undefined or an array of string. The plugin only transforms imports containing one of the specified prefixes.

The match is based on path components; the `foo` matches `foo` and `foo/bar` but not `foobar`.


