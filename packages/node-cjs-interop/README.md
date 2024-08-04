# `node-cjs-interop`: Import helpers for Babel ESM from Node.js native ESM

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

- `a.js` (the module being imported) is a **simulated ESM**. That is, the module is transpiled as a CommonJS module (by Babel or TypeScript) before execution. And,
- `b.js` (the importing module) is a **native ESM**, That is, the module is run on Node.js' native ES Module support.

You can reproduce the above condition by placing the following files:

```javascript
// a.cjs

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true,
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

- [`babel-plugin-node-cjs-interop`](https://npmjs.com/package/babel-plugin-node-cjs-interop) / [`swc-plugin-node-cjs-interop`](https://npmjs.com/package/swc-plugin-node-cjs-interop): automatically inserts the compatibility wrapper.
- `node-cjs-interop` (this package): allows manually wrapping the exported value.

## Getting started

Install the package:

```
npm install node-cjs-interop
# or:
yarn add node-cjs-interop
```

Wrap a default import:

```javascript
import { interopImportCJSDefault } from "node-cjs-interop";
import styledOrig from "styled-components";

const styled = interopImportCJSDefault(styledOrig);

const CustomDiv = styled.div`
  ...
`;
```

Wrap a namespace import:

```javascript
import { interopImportCJSNamespace } from "node-cjs-interop";
import * as nsOrig from "your-package";
const ns = interopImportCJSNamespace(nsOrig);
```

## Difference between `interopImportCJSNamespace` and `interopCJSDefault`

`interopImportCJSNamespace` allows more accurate simulation of ESM semantics:

```javascript
import { interopImportCJSNamespace } from "node-cjs-interop";
// import styled from "styled-components";
import * as nsOrig from "styled-components";

const ns = interopImportCJSNamespace(nsOrig);

// const CustomDiv = styled.div`...`;
const CustomDiv = ns.default.div`...`;
```

However, using [`babel-plugin-node-cjs-interop`](https://npmjs.com/package/babel-plugin-node-cjs-interop) is recommend over manual wrapping.

## The "twisted" variant

You can also use the "twisted" variant of the functions:

```javascript
import { interopImportCJSNamespaceT } from "node-cjs-interop";
import * as TextareaAutosizeOrig from "react-textarea-autosize";

const {
  default: { default: TextareaAutosize },
} = interopImportCJSNamespaceT(TextareaAutosizeOrig);
```

This is useful when you have `"module"` or `"moduleResolution"` set to `"nodenext"` or `"node16"`
in your `tsconfig.json` and you need to import `default` from a "dual package" in which the
type definitions are recognized in the `.cts` mode.

There is no such thing as `interopImportCJSDefaultT` because in this mode, the imported `default` value
would be the namespace object, and if it was originally the proper default export
(i.e. in case it was imported like ESM), there is no way to reconstruct the whole namespace object from it.
