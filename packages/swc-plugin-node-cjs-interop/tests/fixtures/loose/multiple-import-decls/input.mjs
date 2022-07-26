import f from "mod1";
import { a as x, b } from "mod2";
import "mod1";
import {} from "mod1";
import { default as f2 } from "mod1";
import * as ns2 from "mod2";
import * as ns2b from "mod2";

console.log({ f, x, b, f2, ns2, ns2b });
