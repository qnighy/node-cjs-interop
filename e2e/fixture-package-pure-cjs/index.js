module.exports = function square(x) {
  return x * x;
}
module.exports.version = "0.1.2";

module.exports.counter = 0;
module.exports.countUp = function countUp() {
  module.exports.counter++;
}

module.exports.getThis = function getThis() {
  "use strict";
  return this;
}
