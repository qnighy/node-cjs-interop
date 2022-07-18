// @ts-nocheck
import type { T } from "mod";
import { x, type T2 } from "mod";
import * as ns from "mod";
import * as ns2 from "mod";

export type Foo = T & T2 & ns2.T;

console.log({ x, ns });
