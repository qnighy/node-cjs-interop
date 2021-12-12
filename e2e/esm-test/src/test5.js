import value, { A } from "test-pkg3";

if (value() === "default-function" && A === "A") {
  console.log("OK");
} else {
  console.log("Failed");
  // console.log("value =", value);
}
