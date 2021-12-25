# `babel-plugin-node-cjs-interop`: fix the default import interoperability issue in Node.js

## The problem to solve

Consider the following modules:

```javascript
// a.js

export default function greet() {
  console.log("Hello, world!");
}
```

```javascript
// b.js

import greet from "a.js";

greet();
```

They usually work, unless the following conditions are met:

- `a.js` (the module being imported) has been transpiled as a CommonJS module (by Babel or TypeScript) before execution. And,
- `b.js` (the importing module) is being directly run on Node.js' native ES Module support.

You can reproduce the above condition by placing the following files:

```javascript
// a.cjs

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = greet;

function greet() {
  console.log("Hello, world!");
}
```

```javascript
// b.mjs

import greet from "./a.cjs";

greet();
```

```
$ node ./b.mjs
./b.mjs:3
greet();
^

TypeError: greet is not a function
    at ./b.mjs:3:1
    at ModuleJob.run (node:internal/modules/esm/module_job:185:25)
    at async Promise.all (index 0)
    at async ESMLoader.import (node:internal/modules/esm/loader:281:24)
    at async loadESM (node:internal/process/esm_loader:88:5)
    at async handleMainPromise (node:internal/modules/run_main:65:12)
```

The following packages solve the problem:

- `babel-plugin-node-cjs-interop` (this package): automatically inserts the compatibility wrapper.
- `node-cjs-interop`: allows manually wrapping the exported value.

## Getting started

Install the babel plugin:

```
npm install -D babel-plugin-node-cjs-interop
# or:
yarn add -D babel-plugin-node-cjs-interop
```

Configure it in your Babel configuration:

```javascript
// .babelrc.js or babel.config.js

export default {
  presets: [/* ... */],
  plugins: [
    // ...
    [
      "babel-plugin-node-cjs-interop",
      {
        // List the packages you're experiencing problems
        // importing from Node.js' native ESM.
        packages: [
          "styled-components",
          "@babel/helper-plugin-test-runner",
        ],
      },
    ],
  ],
};
```

## Caveats

### re-exports

`export ... from` is not detected yet.

### Observing the export's newest value

In ES Modules, a module can change its exports' values after it's been loaded, and the importing module can observe the update.

```javascript
export let counter = 0;
export function countUp() {
  counter++;
}
```

```javascript
import { counter, countUp } from "./counter.js";

console.log(counter); // => 0
countUp();
console.log(counter); // => 1
```

The incompatibility between Node.js and Babel extends to this semantics too; if the module being imported has been transpiled to a CommonJS module and the importing module has not, the value of the named export is never updated.

This plugin also restores the intended behavior of variable updates.

### Accesses to missing named exports

When using native ES Modules, it is an error to import a non-existent named export:

```javascript
// Error
import { nonExistent } from "./a.js";
```

With `babel-plugin-node-cjs-interop`, it silently returns `undefined`.

### False positives

This plugin uses the `__esModule` flag to detect Babel's ES Module support. Technically speaking, it may lead to false positives in a rare situation. Consider the following code:

```javascript
// a.js (will be transpiled to CommonJS)
export const val = 42;
```

```javascript
// b.js (native ESM; this plugin is not applied)
export * from "a.js";
export const foo = 100;
```

```javascript
// c.js (native ESM)
import { foo } from "b.js";
```

When this plugin is applied to the last import, the import will return an unintended value.

## Options

### packages

- type: `string[]`
- default: `[]`

List of packages to apply the transformation.

Currently there is no way to apply the transformation to all imports.

### useRuntime

- type: `boolean`
- default: `false`

Imports helpers from the `node-cjs-interop` package. You need to add `node-cjs-interop` to your package's dependency.

## How it works

### How Node.js and Babel act differently with CommonJS interoperation

ES Modules and CommonJS Modules use different models for module exports:

- In **ES Modules**, a module exports **multiple values**, each having a name in string.
- In **CommonJS Modules**, a module exports a **single unnamed value**.

For this reason, exports are mapped differently in each direction:

- ES Modules' named imports are mapped to CommonJS exports in the following ways:
  - The import named `default` is mapped to the single exported value.
  - Other named imports are mapped to each property of the single exported value.
- CommonJS Modules' imports are mapped to ES Modules' exported namespace (the record containing all exported values).

And it has a big downside: **ES Modules' `default` exports don't round-trip** when shipped through CommonJS Modules. This is problematic for transpilers like Babel, which needs to embed the semantics of ES Modules to CommonJS Modules. Therefore Babel implements the additional rule to the above:

- If a CommonJS module defines `exports.__esModule` as a truthy value, ES Modules' importing rule is modified so that the `default` import is treated uniformly with other named imports (i.e. mapped to `exports.default` rather than `exports`).

And Babel defines `exports.__esModule` when transpiling modules in ES Modules to CommonJS Modules format.

However, Node.js didn't implement the rule for `__esModule`. It's [a result of careful consideration](https://github.com/nodejs/node/pull/40892#issuecomment-974654787), but is still problematic to gradual migration from CommonJS Modules to ES Modules.

### node-cjs-interop

node-cjs-interop works around the problem by **replacing the namespace object** appropriately. This is achieved by the following function:

```javascript
function interopImportCJSNamespace(ns) {
  return
    ns.default && ns.default.__esModule ?
    // `ns.default` likely comes from Babel's ESM emulation.
    // In this case `ns.default` works as the namespace object.
    ns.default :
    // Original namespace object
    ns;
}
```

babel-node-cjs-interop first transforms named imports:

```javascript
import f, { a } from "mod";
console.log({ f, a });
```

to namespace imports:

```javascript
import * as ns from "mod";
console.log({ f: ns.default, a: ns.a });
```

and then wrap the namespace object by the aforementioned function:

```javascript
import * as nsOrig from "mod";
const ns = interopImportCJSNamespace(nsOrig);
console.log({ f: ns.default, a: ns.a });
```
