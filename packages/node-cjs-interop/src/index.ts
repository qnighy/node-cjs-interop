/**
 * Adjusts a namespace object to allow interoperation between
 * Node.js native ESM and Babel's ESM transpilation.
 *
 * @param ns the namespace object provided by Node.js
 * @param loose skip checking the existence of `ns.__esModule`.
 *        This is useful when cjs-module-lexer is unable to detect the
 *        definition of `__esModule`.
 * @returns the adjusted namespace object
 * @example
 *   ```ts
 *   import * as nsOrig from "mod";
 *   const ns = interopImportCJSNamespace(nsOrig);
 *   console.log([ns.foo, ns.default]);
 *   ```
 */
export function interopImportCJSNamespace<T>(ns: T, loose?: boolean): T {
  type TT = NamespaceWrapper<T>;
  return (loose || (ns as TT).__esModule) &&
    (ns as TT).default &&
    (ns as TT).default.__esModule
    ? (ns as TT).default
    : ns;
}

/**
 * Adjusts a namespace object to allow interoperation between
 * Node.js native ESM and Babel's ESM transpilation.
 *
 * This is an alternative to {@link interopImportCJSNamespace} that
 * aligns with skew default-import mode. This is useful when all of
 * the following conditions are met:
 *
 * - You have "module" or "moduleResolution" set to "node16" or "nodenext"
 * - Your source code is in ESM mode. That is:
 *   - The extension is ".mjs" or ".mts"
 *   - or the extension is ".js", ".ts", ".jsx", or ".tsx" and you have
 *     "type": "module" in your package.json
 * - The module you are importing is in CJS mode. That is:
 *   - The extension is ".cjs" or ".cts"
 *   - or the extension is ".js", ".ts", ".jsx", or ".tsx" and you have
 *     "type": "commonjs" in your package.json
 *
 * @param ns the namespace object provided by Node.js
 * @returns the adjusted namespace object
 * @example
 *   ```ts
 *   import * as nsOrig from "mod";
 *   const ns = interopImportCJSNamespaceT(nsOrig);
 *   console.log([ns.default.foo, ns.default.default]);
 *   ```
 */
export function interopImportCJSNamespaceT<T>(ns: T): T {
  type TT = NamespaceWrapper<T>;
  return (ns as TT).default && (ns as TT).default.__esModule
    ? ns
    : { ...ns, default: ns };
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
  return d && (d as DefaultWrapper<T>).__esModule
    ? (d as DefaultWrapper<T>).default
    : d;
}

type NamespaceWrapper<T> = T & {
  __esModule?: boolean;
  default: T & { __esModule?: boolean };
};

type DefaultWrapper<T> = T & { default: T; __esModule?: boolean };
