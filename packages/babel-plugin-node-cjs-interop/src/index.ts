import type * as Babel from "@babel/core";
import type {
  CallExpression,
  Expression,
  Identifier,
  ImportExpression,
  JSXIdentifier,
  JSXMemberExpression,
  Node,
  Program,
} from "@babel/types";
import { declare } from "@babel/helper-plugin-utils";
import { getPackageName } from "./package-name.js";
import { validateOptions } from "./options.js";
import type { Options } from "./options.js";

export type { Options } from "./options.js";

const statePrefix = "import-interop";

export default declare<Options, Babel.PluginObj>((api, options) => {
  api.assertVersion("^7.0.0 || ^8.0.0");
  const { types: t } = api;

  validateOptions(options);

  return {
    name: "babel-plugin-node-cjs-interop",
    visitor: {
      ImportDeclaration(path, state) {
        const pkgType = applicableSourceType(path.node.source.value, options);
        if (!pkgType) return;
        // Should have been removed by transform-typescript. Just in case.
        if (path.node.importKind === "type") return;
        if (isCjsAnnotated(path.node)) return;
        if (path.node.specifiers.length === 0) return;

        const replaceMap = new Map<string, Replacement>();

        const existingNsImport = path.node.specifiers.find(
          (specifier) => specifier.type === "ImportNamespaceSpecifier",
        )?.local;

        const nsImport =
          existingNsImport ?? path.scope.generateUidIdentifier("ns");

        for (const specifier of path.node.specifiers) {
          let expr: Expression;
          if (specifier.type === "ImportDefaultSpecifier") {
            // ns.defalut
            expr = t.memberExpression(
              t.cloneNode(nsImport),
              t.identifier("default"),
            );
          } else if (specifier.type === "ImportSpecifier") {
            if (specifier.imported.type === "StringLiteral") {
              // ns["named"]
              expr = t.memberExpression(
                t.cloneNode(nsImport),
                t.cloneNode(specifier.imported),
                true,
              );
            } else {
              // ns.named
              expr = t.memberExpression(
                t.cloneNode(nsImport),
                t.cloneNode(specifier.imported),
              );
            }
          } else if (specifier.type === "ImportNamespaceSpecifier") {
            // No need to replace
            continue;
          } else {
            const { type }: never = specifier;
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new Error(`Unknown specifier type: ${type}`);
          }
          replaceMap.set(specifier.local.name, { scope: path.scope, expr });
        }

        const importHelper = getImportHelper(
          t,
          path,
          state,
          pkgType,
          options.useRuntime ?? false,
        );

        // import ... from "source";
        // ->
        // import * as moduleOrig from "source";
        // const module = _interopImportCJSNamespace(moduleOrig);
        const importOriginalName = path.scope.generateUidIdentifier("nsOrig");
        const program = path.scope.getProgramParent()
          .path as Babel.NodePath<Program>;
        program.unshiftContainer(
          "body",
          t.variableDeclaration("const", [
            t.variableDeclarator(
              nsImport,
              t.callExpression(t.cloneNode(importHelper), [
                t.cloneNode(importOriginalName),
                ...(pkgType !== "ts-twisted" && options.loose
                  ? [t.booleanLiteral(true)]
                  : []),
              ]),
            ),
          ]),
        );

        const newImport = t.cloneNode(path.node);
        newImport.specifiers = [t.importNamespaceSpecifier(importOriginalName)];
        path.replaceWith(newImport);
        annotateAsCjs(t, path.node);

        if (replaceMap.size > 0) {
          path.parentPath.traverse({
            Identifier(path) {
              const replacement = replaceMap.get(path.node.name);
              if (!replacement) return;

              if (!isReferencedValueIdentifier(path)) return;

              const binding = path.scope.getBinding(path.node.name);
              if (!binding || binding.scope === replacement.scope) {
                replaceIdentifier(t, path, t.cloneNode(replacement.expr));
              }
            },
            JSXIdentifier(path) {
              const replacement = replaceMap.get(path.node.name);
              if (!replacement) return;

              if (!isReferencedValueIdentifier(path)) return;

              const binding = path.scope.getBinding(path.node.name);
              if (!binding || binding.scope === replacement.scope) {
                replaceIdentifier(t, path, t.cloneNode(replacement.expr));
              }
            },
          });
        }
      },
      ExportNamedDeclaration(path) {
        if (!path.node.source) return;
        const pkgType = applicableSourceType(path.node.source.value, options);
        if (!pkgType) return;
        // Should have been removed by transform-typescript. Just in case.
        if (path.node.exportKind === "type") return;
        if (isCjsAnnotated(path.node)) return;
        if (path.node.specifiers.length === 0) return;

        throw path.buildCodeFrameError(
          "babel-plugin-node-cjs-interop: cannot transform export declarations",
        );
      },
      ExportAllDeclaration(path) {
        if (!path.node.source) return;
        const pkgType = applicableSourceType(path.node.source.value, options);
        if (!pkgType) return;
        // Should have been removed by transform-typescript. Just in case.
        if (path.node.exportKind === "type") return;
        if (isCjsAnnotated(path.node)) return;

        throw path.buildCodeFrameError(
          "babel-plugin-node-cjs-interop: cannot transform export declarations",
        );
      },
      // createImportExpressions === false; Babel 7 default
      CallExpression(path, state) {
        if (path.node.callee.type === "Import") {
          processImportExpression(
            path,
            path.get("arguments")[0] as Babel.NodePath<Expression>,
            state,
          );
        }
      },
      // createImportExpressions === true; Babel 8 default
      ImportExpression(path, state) {
        processImportExpression(path, path.get("source"), state);
      },
    },
  };

  function processImportExpression(
    path: Babel.NodePath<CallExpression | ImportExpression>,
    sourcePath: Babel.NodePath<Expression>,
    state: Babel.PluginPass,
  ) {
    if (sourcePath.node.type !== "StringLiteral") return;
    const pkgType = applicableSourceType(sourcePath.node.value, options);
    if (!pkgType) return;
    if (isCjsAnnotated(path.node)) return;

    const awaitPath = path.parentPath;
    if (
      awaitPath.isAwaitExpression() &&
      awaitPath.node.argument === path.node
    ) {
      if (isCjsAnnotated(awaitPath.node)) return;

      const importHelper = getImportHelper(
        t,
        path,
        state,
        pkgType,
        options.useRuntime ?? false,
      );

      const origNode = awaitPath.node;
      // await import("source")
      // -> _interopImportCJSNamespace(await import("source"))
      awaitPath.replaceWith(
        t.callExpression(t.cloneNode(importHelper), [
          awaitPath.node,
          ...(pkgType !== "ts-twisted" && options.loose
            ? [t.booleanLiteral(true)]
            : []),
        ]),
      );
      annotateAsCjs(t, origNode);
      return;
    } else {
      const importHelper = getImportHelper(
        t,
        path,
        state,
        pkgType,
        options.useRuntime ?? false,
      );

      const origNode = path.node;
      // import("source")
      // -> import("source").then((ns) => _interopImportCJSNamespace(ns))
      // NOTE: strictly speaking, it does not preserve scheduling semantics of the Promise;
      //       the transform delays the execution by one cycle of microtask queue.
      //       We could add other heuristics for cases like import("source").then(...)
      //       but ultimately we cannot do so when we are not sure where the Promise goes to.
      //       As the effect is fairly minor (do not depend on microtask cycle count!),
      //       we just leave it as is for now.
      path.replaceWith(
        t.callExpression(
          t.memberExpression(
            // Explicit parentheses to get room for the #__CJS__ comment
            t.parenthesizedExpression(path.node),
            t.identifier("then"),
            false,
            false,
          ),
          [
            t.arrowFunctionExpression(
              [t.identifier("ns")],
              t.callExpression(t.cloneNode(importHelper), [
                t.identifier("ns"),
                ...(pkgType !== "ts-twisted" && options.loose
                  ? [t.booleanLiteral(true)]
                  : []),
              ]),
            ),
          ],
        ),
      );
      annotateAsCjs(t, origNode);
      return;
    }
  }
});

type Replacement = {
  scope: Babel.NodePath["scope"];
  expr: Expression;
};

function getImportHelper(
  t: typeof Babel.types,
  path: Babel.NodePath,
  state: Babel.PluginPass,
  pkgType: PackageType,
  useRuntime: boolean,
): Identifier {
  const key =
    pkgType === "ts-twisted"
      ? `${statePrefix}/importHelperT`
      : `${statePrefix}/importHelper`;
  let helper = state.get(key) as Identifier | undefined;
  if (helper) return helper;

  const helperName =
    pkgType === "ts-twisted"
      ? "interopImportCJSNamespaceT"
      : "interopImportCJSNamespace";
  const scope = path.scope.getProgramParent();
  helper = scope.generateUidIdentifier(helperName);

  if (useRuntime) {
    // import {
    //   interopImportCJSNamespace as _interopImportCJSNamespace,
    // } from "node-cjs-interop";
    (scope.path as Babel.NodePath<Program>).unshiftContainer(
      "body",
      t.importDeclaration(
        [t.importSpecifier(t.cloneNode(helper), t.identifier(helperName))],
        t.stringLiteral("node-cjs-interop"),
      ),
    );
    state.set(key, helper);
    return helper;
  }

  const ns = t.identifier("ns");
  const loose = t.identifier("loose");
  const nsDefault = t.memberExpression(
    t.cloneNode(ns),
    t.identifier("default"),
  );

  if (pkgType === "ts-twisted") {
    // function interopImportCJSNamespaceT(ns) {
    //   return ns.default && ns.default.__esModule ? ns : {
    //     ...ns,
    //     default: ns
    //   };
    // }
    (scope.path as Babel.NodePath<Program>).unshiftContainer(
      "body",
      t.functionDeclaration(
        t.cloneNode(helper),
        [t.cloneNode(ns)],
        t.blockStatement([
          t.returnStatement(
            t.conditionalExpression(
              t.logicalExpression(
                "&&",
                t.cloneNode(nsDefault),
                t.memberExpression(
                  t.cloneNode(nsDefault),
                  t.identifier("__esModule"),
                ),
              ),
              t.cloneNode(ns),
              t.objectExpression([
                t.spreadElement(t.cloneNode(ns)),
                t.objectProperty(
                  t.identifier("default"),
                  t.cloneNode(ns),
                  false,
                  false,
                ),
              ]),
            ),
          ),
        ]),
      ),
    );
  } else {
    // function interopImportCJSNamespace(ns, loose) {
    //   return (loose || ns.__esModule) && ns.default && ns.default.__esModule ? ns.default : ns;
    // }
    (scope.path as Babel.NodePath<Program>).unshiftContainer(
      "body",
      t.functionDeclaration(
        t.cloneNode(helper),
        [t.cloneNode(ns), t.cloneNode(loose)],
        t.blockStatement([
          t.returnStatement(
            t.conditionalExpression(
              t.logicalExpression(
                "&&",
                t.logicalExpression(
                  "&&",
                  t.logicalExpression(
                    "||",
                    t.cloneNode(loose),
                    t.memberExpression(
                      t.cloneNode(ns),
                      t.identifier("__esModule"),
                    ),
                  ),
                  t.cloneNode(nsDefault),
                ),
                t.memberExpression(
                  t.cloneNode(nsDefault),
                  t.identifier("__esModule"),
                ),
              ),
              t.cloneNode(nsDefault),
              t.cloneNode(ns),
            ),
          ),
        ]),
      ),
    );
  }
  state.set(key, helper);
  return helper;
}

const CJS_ANNOTATION = "#__CJS__";

const isCjsAnnotated = ({ leadingComments }: Node): boolean =>
  !!leadingComments &&
  leadingComments.some((comment) => /#__CJS__/.test(comment.value));

function annotateAsCjs(t: typeof Babel.types, node: Node): void {
  if (isCjsAnnotated(node)) {
    return;
  }
  t.addComment(node, "leading", CJS_ANNOTATION);
}

type PackageType = "normal" | "ts-twisted";
function applicableSourceType(
  source: string,
  options: Options,
): PackageType | undefined {
  const { packages = [], packagesT = [] } = options;

  const sourcePackage = getPackageName(source);
  if (sourcePackage === undefined) return undefined;

  if (packages.includes(sourcePackage)) {
    return "normal";
  } else if (packagesT.includes(sourcePackage)) {
    return "ts-twisted";
  }
  return undefined;
}

function replaceIdentifier(
  t: typeof Babel.types,
  path: Babel.NodePath<Identifier> | Babel.NodePath<JSXIdentifier>,
  replacement: Expression,
) {
  if (path.isJSXIdentifier()) {
    path.replaceWith(toJSXReference(t, replacement));
    return;
  }

  if (
    (path.parentPath.isCallExpression({ callee: path.node }) ||
      path.parentPath.isOptionalCallExpression({ callee: path.node }) ||
      path.parentPath.isTaggedTemplateExpression({ tag: path.node })) &&
    t.isMemberExpression(replacement)
  ) {
    path.replaceWith(t.sequenceExpression([t.numericLiteral(0), replacement]));
  } else {
    path.replaceWith(replacement);
  }
}

function toJSXReference(
  t: typeof Babel.types,
  expr: Expression,
): JSXIdentifier | JSXMemberExpression {
  if (t.isIdentifier(expr)) {
    return t.inherits(t.jsxIdentifier(expr.name), expr);
  } else if (t.isMemberExpression(expr)) {
    if (!t.isIdentifier(expr.property) || expr.computed)
      throw new Error("Not an identifier reference");
    const property = t.inherits(
      t.jsxIdentifier(expr.property.name),
      expr.property,
    );
    return t.inherits(
      t.jsxMemberExpression(toJSXReference(t, expr.object), property),
      expr,
    );
  } else {
    throw new Error("Not a chain of identifiers");
  }
}

function isReferencedValueIdentifier<T>(
  path: Babel.NodePath<T>,
): path is Babel.NodePath<T> & Babel.NodePath<Identifier | JSXIdentifier> {
  if (!path.isReferencedIdentifier()) return false;

  const { node, parent } = path;

  switch (parent.type) {
    // Most usages in types fall into this category.
    case "TSTypeReference":
      return false;

    // no: type T = typeof NODE;
    case "TSTypeQuery":
      return false;

    // no: type T = NODE.T;
    // no: type T = T.NODE;
    case "TSQualifiedName":
      return false;

    // no: type T = (NODE) => void
    // no: type T = new (NODE) => void
    // no: type T = { (NODE): void; }
    // no: type T = { new (NODE): void; }
    case "TSFunctionType":
    case "TSConstructorType":
    case "TSCallSignatureDeclaration":
    case "TSConstructSignatureDeclaration":
      return false;

    // no: type T = { NODE(): void; };
    // perhaps: type T = { [NODE](): void; };
    // perhaps: type T = { foo(NODE): void; };
    case "TSMethodSignature":
      return false;

    // no: type T = { NODE };
    // perhaps: type T = { [NODE] };
    case "TSPropertySignature":
      return false;

    // Equivalent to FunctionDeclaration
    // no: declare function NODE();
    // no: declare function foo(NODE);
    case "TSDeclareFunction":
      return false;

    // Equivalent to ClassMethod
    // no: class C { NODE(); }
    // perhaps: class C { [NODE](); }
    // no: class C { foo(NODE); }
    case "TSDeclareMethod":
      return false;

    // no: function foo(x): NODE is T;
    case "TSTypePredicate":
      return false;

    // no: class C { constructor(readonly NODE) {} }
    case "TSParameterProperty":
      return false;

    // no: type T = [NODE: T];
    case "TSNamedTupleMember":
      return false;

    // no: interface I extends NODE {}
    case "TSExpressionWithTypeArguments":
      return false;

    // no: import NODE = require("foo");
    case "TSImportEqualsDeclaration":
      return false;

    // no: export as namespace NODE;
    case "TSNamespaceExportDeclaration":
      return false;

    // no: type T = { [NODE: string]: T };
    case "TSIndexSignature":
      return false;

    // no: type NODE = {};
    case "TSTypeAliasDeclaration":
      return false;

    // no: interface NODE {}
    case "TSInterfaceDeclaration":
      return false;

    // no: namespace NODE {}
    case "TSModuleDeclaration":
      return false;

    // no: enum NODE {}
    case "TSEnumDeclaration":
      return false;

    // no: enum E { NODE }
    // yes: enum E { A = NODE }
    case "TSEnumMember":
      return parent.initializer === node;
  }
  return true;
}
