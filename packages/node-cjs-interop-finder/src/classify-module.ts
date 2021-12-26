import { isAssignmentExpression, isCallExpression, isExpressionStatement, isIdentifier, isMemberExpression, CallExpression, Expression, Node, isStringLiteral, isObjectExpression, isObjectProperty, isExpression, isBooleanLiteral } from "@babel/types";
import { parse } from "@babel/parser";

export type ModuleType = "commonjs" | "commonjs-babel" | "module";

export function classifyModule(code: string): ModuleType {
  const ast = parse(code, { sourceType: "unambiguous" });
  if (ast.program.sourceType === "module") return "module";

  for (const stmt of ast.program.body) {
    if (isExpressionStatement(stmt)) {
      const expr = stmt.expression;
      if (isCallToDefineProperty(expr) && expr.arguments.length === 3) {
        // Object.defineProperty(...)
        if (
          isExportsObject(expr.arguments[0]) &&
          isStringLiteral(expr.arguments[1], { value: "__esModule" })
        ) {
          const value = getValueExpression(expr.arguments[2]);
          // Object.defineProperty(exports, "__esModule", { value: true });
          if (isBooleanLiteral(value, { value: true })) return "commonjs-babel";
        }
      } else if (isAssignmentExpression(expr)) {
        if (
          isMemberExpression(expr.left, { computed: false }) &&
          isExportsObject(expr.left.object) &&
          isIdentifier(expr.left.property, { name: "__esModule" }) &&
          isBooleanLiteral(expr.right, { value: true })
        ) {
          // exports.__esModule = true;
          return "commonjs-babel";
        }
      }
    }
  }

  return "commonjs";
}

/** `exports` or `module.exports` */
function isExportsObject(expr: Node): boolean {
  return (
    isIdentifier(expr, { name: "exports" })
  ) || (
    isMemberExpression(expr, { computed: false }) &&
    isIdentifier(expr.object, { name: "module" }) &&
    isIdentifier(expr.property, { name: "exports" })
  );
}

/** `Object.defineProperty(...)` */
function isCallToDefineProperty(expr: Expression): expr is CallExpression {
  return (
    isCallExpression(expr) &&
    isDefineProperty(expr.callee)
  );
}

/** `Object.defineProperty` */
function isDefineProperty(expr: Node): boolean {
  return (
    isMemberExpression(expr, { computed: false }) &&
    isIdentifier(expr.object, { name: "Object" }) &&
    isIdentifier(expr.property, { name: "defineProperty" })
  );
}

/** Extract `{ value: ... }` */
function getValueExpression(expr: Node): Expression | undefined {
  if (isObjectExpression(expr)) {
    for (const property of expr.properties) {
      if (
        isObjectProperty(property, { computed: false }) &&
        isIdentifier(property.key, { name: "value" }) &&
        isExpression(property.value)
      ) {
        return property.value;
      }
    }
  }
  return undefined;
}
