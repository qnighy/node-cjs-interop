/// <reference types="@babel/helper-plugin-utils" />

import type * as Babel from "@babel/core";
import type { Identifier, ImportDeclaration, Program, StringLiteral } from "@babel/types";
import { declare } from "@babel/helper-plugin-utils";

export default declare<{}, Babel.PluginObj>((api) => {
  return {
    visitor: {
      ImportDeclaration(path) {
        if (path.node.importKind === "type") return;
        for (const specifier of path.get("specifiers")) {
          if (specifier.isImportDefaultSpecifier()) {
            wrapImportInterop(api.types, path, specifier.node.local.name, false);
          } else if (specifier.isImportSpecifier()) {
            if (importName(specifier.node.imported) !== "default") return;
            if (specifier.node.importKind === "type") continue;
            wrapImportInterop(api.types, path, specifier.node.local.name, false);
          } else if (specifier.isImportNamespaceSpecifier()) {
            wrapImportInterop(api.types, path, specifier.node.local.name, true);
          }
        }
      },
    },
  };
});

function wrapImportInterop(t: typeof Babel.types, path: Babel.NodePath<ImportDeclaration>, name: string, wildcard: boolean) {
  const wrapper = path.scope.generateUidIdentifier(name);
  const program = path.scope.getProgramParent().path as Babel.NodePath<Program>;
  const localBinding = program.scope.getBinding(name);
  const helper: Identifier = path.scope.hub.addHelper(wildcard ? "interopRequireWildcard" : "interopRequireDefault");
  program.traverse({
    Identifier(path) {
      if (!path.isReferencedIdentifier()) return;
      const referencedBinding = path.scope.getBinding(path.node.name);
      if (referencedBinding === localBinding || (!referencedBinding && path.node.name === name)) {
        if (wildcard) {
          path.replaceWith(t.cloneNode(wrapper));
        } else {
          path.replaceWith(t.memberExpression(t.cloneNode(wrapper), t.identifier("default")));
        }
      }
    },
  });
  program.unshiftContainer("body", t.variableDeclaration("const", [t.variableDeclarator(wrapper, t.callExpression(t.cloneNode(helper), [t.identifier(name)]))]));
}

function importName(node: Identifier | StringLiteral) {
  if (node.type === "StringLiteral") return node.value;
  return node.name;
}
