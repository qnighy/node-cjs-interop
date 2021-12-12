import * as ns from "test-pkg3";

if (ns.default() === "default-function" && ns.A === "A") {
  console.log("OK");
} else {
  console.log("Failed");
  // console.log("ns =", ns);
}
