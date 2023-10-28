/**
 * Test and demonstrate importing SortedArray as a commonjs module.
 */

const assert = require("node:assert").strict;
const {SortedArray} = require("../dist/src/index");

const array = new SortedArray([1, 5, 4, 3, 6, 2]);
assert.equal(array.length, 6);
assert.equal(array[0], 1);
assert.equal(array[1], 2);
assert.equal(array[2], 3);
assert.equal(array[3], 4);
assert.equal(array[4], 5);
assert.equal(array[5], 6);

console.log("OK");
