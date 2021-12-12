import * as ns from "test-pkg2";

if (ns.default === "default-value" && ns.A === "A") {
  console.log("OK");
} else {
  console.log("Failed");
  // console.log("ns =", ns);
}
