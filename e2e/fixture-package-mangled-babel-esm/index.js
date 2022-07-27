"use strict";

function __define(obj, name, value) {
  Object.defineProperty(obj, name, {
    value: value
  });
}

__define(exports, "__esModule", true);
exports.countUp = countUp;
exports.counter = void 0;
exports.default = square;
exports.getThis = getThis;
exports.version = void 0;

function square(x) {
  return x * x;
}

const version = "0.1.2";
exports.version = version;
let counter = 0;
exports.counter = counter;

function countUp() {
  exports.counter = counter = counter + 1;
}

function getThis() {
  return this;
}

// export default function square(x) {
//   return x * x;
// }
// export const version = "0.1.2";
//
// export let counter = 0;
// export function countUp() {
//   counter++;
// }
//
// export function getThis() {
//   return this;
// }
