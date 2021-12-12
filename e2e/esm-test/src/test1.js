import value, { A } from "test-pkg1";

if (value === "default-value" && A === "A") {
  console.log("OK");
} else {
  console.log("Failed");
  // console.log("value =", value);
}
