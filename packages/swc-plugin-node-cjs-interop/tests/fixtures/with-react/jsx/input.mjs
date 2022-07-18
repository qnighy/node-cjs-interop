import { Component, Foo } from "mod";
import * as ns from "mod2";

console.log(<Component />);
console.log(<Foo.Component />);
console.log(<ns.Component />);
