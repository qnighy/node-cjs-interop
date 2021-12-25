export function getPackageName(modulePath: string): string | undefined {
  if (modulePath.length === 0) return undefined;

  const first = modulePath.charAt(0);
  if (first === "/" || first === ".") {
    return undefined;
  }

  if (first === "@") {
    const index1 = modulePath.indexOf("/");
    if (index1 === -1) return undefined;

    const index2 = modulePath.indexOf("/", index1 + 1);
    if (index2 === -1) {
      return modulePath;
    } else {
      return modulePath.substring(0, index2);
    }
  } else {
    const index = modulePath.indexOf("/");
    if (index === -1) {
      return modulePath;
    } else {
      return modulePath.substring(0, index);
    }
  }
}
