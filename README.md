# `babel-plugin-node-cjs-interop` and `node-cjs-interop`: fix the default import interoperability issue in Node.js

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

## Solution 1: Babel plugin

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
        packages: [
          "styled-components",
          "@babel/helper-plugin-test-runner",
        ],
      },
    ],
  ],
};
```

See [the package's README](./packages/babel-plugin-node-cjs-interop/README.md) for details.

## Solution 2: manually inserting the wrapper

```
npm install -D node-cjs-interop
# or:
yarn add -D node-cjs-interop
```

```javascript
import styledOrig from "styled-components";
import { interopImportCJSDefault } from "node-cjs-interop";

const styled = interopImportCJSDefault(styledOrig);
```

See [the package's README](./packages/node-cjs-interop/README.md) for details.
