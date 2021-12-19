# Import helpers for Babel ESM from Node.js native ESM

## When you need this

- Your module is Node.js-native ESM (`*.mjs` or `"type": "module"`).
- You are importing non-native ESM (transpiled to CJS by Babel, TypeScript, or a similar transpiler).
  - Such modules define the `__esModule` export.

## `interopImportCJSNamespace`

```javascript
import { interopImportCJSNamespace } from "node-cjs-interop";
import * as nsOrig from "mod";
const ns = interopImportCJSNamespace(nsOrig);

console.log([ns.default, ns.A]);
```

## `interopImportCJSDefault`

```javascript
import { interopImportCJSDefault } from "node-cjs-interop";
import valueOrig from "mod";
const value = interopImportCJSDefault(valueOrig);

console.log(value);
```
