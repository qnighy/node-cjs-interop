/// <reference types="@babel/helper-plugin-utils" />

import type * as Babel from "@babel/core";
import type { Expression, Identifier, Node, Program } from "@babel/types";
import { declare } from "@babel/helper-plugin-utils";

const statePrefix = "import-interop";

export type Options = {
  modulePrefixes?: string[];
};

export default declare<Options, Babel.PluginObj>((api, options) => {
  api.assertVersion("^7.0.0 || ^8.0.0");
  const { types: t } = api;

  return {
    visitor: {
      ImportDeclaration(path, state) {
        if (!hasApplicableSource(path.node.source.value, options)) return;
        // Should have been removed by transform-typescript. Just in case.
        if (path.node.importKind === "type") return;
        if (isCjsAnnotated(path.node)) return;
        if (path.node.specifiers.length === 0) return;

        const replaceMap = new Map<string, Replacement>();

        const existingNsImport = path.node.specifiers.find((specifier) => specifier.type === "ImportNamespaceSpecifier")?.local;

        const nsImport = existingNsImport ?? path.scope.generateUidIdentifier("ns");

        for (const specifier of path.node.specifiers) {
          let expr: Expression;
          if (specifier.type === "ImportDefaultSpecifier") {
            // ns.defalut
            expr = t.memberExpression(t.cloneNode(nsImport), t.identifier("default"));
          } else if (specifier.type === "ImportSpecifier") {
            if (specifier.imported.type === "StringLiteral") {
              // ns["named"]
              expr = t.memberExpression(t.cloneNode(nsImport), t.cloneNode(specifier.imported), true);
            } else {
              // ns.named
              expr = t.memberExpression(t.cloneNode(nsImport), t.cloneNode(specifier.imported));
            }
          } else if (specifier.type === "ImportNamespaceSpecifier") {
            // No need to replace
            continue;
          } else {
            const { type }: never = specifier;
            throw new Error(`Unknown specifier type: ${type}`);
          }
          replaceMap.set(specifier.local.name, { scope: path.scope, expr })
        }

        const importHelper = getImportHelper(t, path, state);

        // import ... from "source";
        // ->
        // import * as moduleOrig from "source";
        // const module = _interopImportCJSNamespace(moduleOrig);
        const importOriginalName = path.scope.generateUidIdentifier("nsOrig");
        const program = path.scope.getProgramParent().path as Babel.NodePath<Program>;
        program.unshiftContainer(
          "body",
          t.variableDeclaration(
            "const",
            [
              t.variableDeclarator(nsImport, t.callExpression(t.cloneNode(importHelper), [t.cloneNode(importOriginalName)])),
            ],
          ),
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

              if (!path.isReferencedIdentifier()) return;

              const binding = path.scope.getBinding(path.node.name);
              if (!binding || binding.scope === replacement.scope) {
                path.replaceWith(t.cloneNode(replacement.expr));
              }
            },
          });
        }
      },
    },
  };
});

type Replacement = {
  scope: Babel.NodePath["scope"],
  expr: Expression,
};

function getImportHelper(t: typeof Babel.types, path: Babel.NodePath, state: Babel.PluginPass): Identifier {
  const key = `${statePrefix}/importHelper`;
  let helper: Identifier | undefined = state.get(key);
  if (helper) return helper;

  const scope = path.scope.getProgramParent();
  helper = scope.generateUidIdentifier("interopImportCJSNamespace");
  const ns = t.identifier("ns");
  const nsDefault = t.memberExpression(t.cloneNode(ns), t.identifier("default"));
  // function interopImportCJSNamespace(ns) {
  //   return ns.default && ns.default.__esModule ? ns.default : ns;
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
              t.memberExpression(t.cloneNode(nsDefault), t.identifier("__esModule")),
            ),
            t.cloneNode(nsDefault),
            t.cloneNode(ns),
          ),
        ),
      ]),
    ),
  );
  state.set(key, helper);
  return helper;
}

const CJS_ANNOTATION = "#__CJS__";

const isCjsAnnotated = ({ leadingComments }: Node): boolean =>
  !!leadingComments &&
  leadingComments.some(comment => /#__CJS__/.test(comment.value));

function annotateAsCjs(
  t: typeof Babel.types,
  node: Node,
): void {
  if (isCjsAnnotated(node)) {
    return;
  }
  t.addComment(node, "leading", CJS_ANNOTATION);
}

function hasApplicableSource(source: string, options: Options): boolean {
  if (!options.modulePrefixes) return true;

  for (const allowedPrefix of options.modulePrefixes) {
    if (source === allowedPrefix) return true;
  }

  const sourceSlash = `${source}/`;
  for (const allowedPrefix of options.modulePrefixes) {
    const allowedPrefixSlash = allowedPrefix.endsWith("/") ? allowedPrefix : `${allowedPrefix}/`;
    if (sourceSlash.startsWith(allowedPrefixSlash)) return true;
  }

  return false;
}
