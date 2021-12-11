/// <reference types="@babel/helper-plugin-utils" />

import type * as Babel from "@babel/core";
import type { Identifier, ImportDeclaration, Program, StringLiteral } from "@babel/types";
import { declare } from "@babel/helper-plugin-utils";

export type Options = {
  modulePrefixes?: string[];
};

export default declare<Options, Babel.PluginObj>((api, options) => {
  api.assertVersion("^7.0.0 || ^8.0.0");
  return {
    visitor: {
      ImportDeclaration(path) {
        if (path.node.importKind === "type") return;
        if (!hasApplicableSource(path.node.source.value, options)) return;
        for (const specifier of path.get("specifiers")) {
          if (specifier.isImportDefaultSpecifier()) {
            wrapImportInterop(api.types, path, specifier.node.local.name);
          } else if (specifier.isImportSpecifier()) {
            if (importName(specifier.node.imported) !== "default") return;
            if (specifier.node.importKind === "type") continue;
            wrapImportInterop(api.types, path, specifier.node.local.name);
          } else if (specifier.isImportNamespaceSpecifier()) {
            wrapImportInterop(api.types, path, specifier.node.local.name);
          }
        }
      },
    },
  };
});

function wrapImportInterop(t: typeof Babel.types, path: Babel.NodePath<ImportDeclaration>, name: string) {
  const wrapper = path.scope.generateUidIdentifier(name);
  const program = path.scope.getProgramParent().path as Babel.NodePath<Program>;
  const localBinding = program.scope.getBinding(name);
  const helper: Identifier = path.scope.hub.addHelper("interopRequireDefault");
  program.traverse({
    Identifier(path) {
      if (!path.isReferencedIdentifier()) return;
      const referencedBinding = path.scope.getBinding(path.node.name);
      if (referencedBinding === localBinding || (!referencedBinding && path.node.name === name)) {
        path.replaceWith(t.memberExpression(t.cloneNode(wrapper), t.identifier("default")));
      }
    },
  });
  program.unshiftContainer("body", t.variableDeclaration("const", [t.variableDeclarator(wrapper, t.callExpression(t.cloneNode(helper), [t.identifier(name)]))]));
}

function importName(node: Identifier | StringLiteral) {
  if (node.type === "StringLiteral") return node.value;
  return node.name;
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
