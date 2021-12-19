/**
 * Adjusts a namespace object to allow interoperation between
 * Node.js native ESM and Babel's ESM transpilation.
 *
 * @param ns the namespace object provided by Node.js
 * @returns the adjusted namespace object
 * @example
 *   ```ts
 *   import * as nsOrig from "mod";
 *   const ns = interopImportCJSNamespace(nsOrig);
 *   console.log([ns.foo, ns.default]);
 *   ```
 */
export function interopImportCJSNamespace<T>(ns: T): T {
  return (ns as any).default && (ns as any).default.__esModule ? (ns as any).default : ns;
}

/**
 * Adjusts a default imported object to allow interoperation between
 * Node.js native ESM and Babel's ESM transpilation.
 *
 * @param d the default imported object provided by Node.js
 * @returns the adjusted default imported object
 * @example
 *   ```ts
 *   import valueOrig from "mod";
 *   const value = interopImportCJSDefault(value);
 *   console.log(value);
 *   ```
 */
export function interopImportCJSDefault<T>(d: T): T {
  return d && (d as any).__esModule ? (d as any).default : d;
}
