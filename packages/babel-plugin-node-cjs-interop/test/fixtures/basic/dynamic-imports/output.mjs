function _interopImportCJSNamespace(ns, loose) {
  return (loose || ns.__esModule) && ns.default && ns.default.__esModule ? ns.default : ns;
}
const M = _interopImportCJSNamespace( /*#__CJS__*/await import("mod"));
console.log(M);
( /*#__CJS__*/import("mod")).then(ns => _interopImportCJSNamespace(ns)).then(M2 => {
  console.log(M2);
});
export {};
