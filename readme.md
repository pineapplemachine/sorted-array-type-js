# SortedArray

[![MIT License][license-image]][license] [![Build Status][travis-image]][travis-url] [![NPM version][npm-version-image]][npm-url]

This package implements a **SortedArray** type, which is an array
whose contents are always sorted.
It supports all standard ES6 Array methods and it provides
additional methods relating to keeping elements in a sorted order.
It fully supports indexing, enumeration, and a length property.

The package is licensed according to the permissive
[zlib/libpng license](LICENSE).

Note that the SortedArray type uses the native `Array.sort`
method for some functionality, meaning that sort stability
will depend on the platform.
If `Array.sort` is stable, however, then all SortedArray sort
and insertion operations will also be stable.

``` js
const sortedArray = new SortedArray(["alice", "carl", "bob"]);
sortedArray.length; // 3
sortedArray[1]; // "bob"
sortedArray.insert("beatrice"); // ["alice", "beatrice", "bob", "carl"]
sortedArray.indexOf("bob"); // 2 (uses binary search)
sortedArray.pop(); // "carl"
sortedArray.slice(0, 2); // SortedArray(["alice", "beatrice"])
```

[license-image]: https://img.shields.io/badge/License-Zlib-lightgrey.svg
[license]: https://github.com/pineapplemachine/sorted-array-type-js/blob/master/LICENSE

[travis-url]: https://travis-ci.org/pineapplemachine/sorted-array-type-js
[travis-image]: https://travis-ci.org/pineapplemachine/sorted-array-type-js.svg?branch=master

[npm-url]: https://www.npmjs.com/package/sorted-array-type
[npm-version-image]: https://badge.fury.io/js/sorted-array-type.svg

## Installation

You can add SortedArray to your JavaScript project by using a
package manager to install the `sorted-array-type` package. For example:

``` text
npm install --save sorted-array-type
```

## Usage

You can create a SortedArray object using the constructor or
using the `of` and `from` class methods.

The constructor and the `from` static method accept an optional
[comparator function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
as their second argument.
If no comparator was given, the created SortedArray uses
native JavaScript `<` and `>` comparisons to sort elements
in ascending order.

``` js
sortedArray = new SortedArray();                                    // []
sortedArray = new SortedArray([3, 1, 2]);                           // [1, 2, 3]
sortedArray = new SortedArray([3, 1, 2], (a, b) => b - a);          // [3, 2, 1]
sortedArray = SortedArray.of(1, 3, 2);                              // [1, 2, 3]
sortedArray = SortedArray.from([1, 3, 2]);                          // [1, 2, 3]
sortedArray = SortedArray.from([1, 3, 2], (a, b) => b - a);         // [3, 2, 1]
```

There are also `ofSorted` and `fromSorted` class methods for constructing
a SortedArray. They assume that their input is already sorted.
Passing values to these methods that are not correctly sorted will
cause the SortedArray to behave incorrectly, so use them with care!

``` js
sortedArray = SortedArray.ofSorted(1, 2, 3);                        // [1, 2, 3]
sortedArray = SortedArray.fromSorted([1, 2, 3]);                    // [1, 2, 3]
sortedArray = SortedArray.fromSorted([3, 2, 1], (a, b) => b - a);   // [3, 2, 1]
```

SortedArrays have a `length` property and can be indexed and enumerated
just like normal Arrays.

``` js
sortedArray = new SortedArray([4, 2, 3, 1]); // [1, 2, 3, 4]
sortedArray[0] // 1
sortedArray.length // 4
for(let element of sortedArray){
    // 1, 2, 3, 4
}
```

SortedArrays have `insert` and `remove` methods. They should be used
to add and remove elements.
You should not normally `push` to a SortedArray, and you should
consider using `remove` to be better practice than using `indexOf`
and `slice`, though both options will work.

There is also an `insertSorted` method, which can be used to efficiently
insert the contents of another iterable which is already sorted according
to the same comparison function.
Passing iterables to the `insertSorted` method that are not correctly sorted
will cause the SortedArray to behave incorrectly, so use it with care!

``` js
sortedArray = new SortedArray();
sortedArray.insert(1); // Insert 1. Returns the new length of the array.
sortedArray.remove(1); // Remove 1. Returns true if the value was in the array.
sortedArray.insertSorted([1, 2, 3, 4]); // Insert already-sorted values.
```

SortedArrays support all of the standard ES6 Array methods and
properties.
They are summarized briefly here, and you should refer to
[more detailed documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)
for more complete information about these methods.

- **[!]** means a method should be used with caution. (Read more below.)
- **[%]** means a method is usually faster with a SortedArray than a normal Array.

All methods not marked with a **[!]** can be used safely; they should
never invalidate a SortedArray's guarantee of correct ordering,
no matter how they are used or what inputs they are given.
This includes the `sort` and `reverse` methods, which cause later
operations to use the same new ordering.

Methods like `indexOf` or `remove` which involve comparisons for finding
an exact element in the array all use
[SameValueZero](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness)
for comparisons.

``` js
sortedArray.concat(); // Returns a new, concatenated Array.
sortedArray.copyWithin(); // Copies elements. [!]
sortedArray.entries(); // Returns an iterator of [index, value] pairs.
sortedArray.every(); // True when every element satisfies the predicate.
sortedArray.fill(); // Fill the array with values. [!]
sortedArray.filter(); // Returns a new, filtered SortedArray.
sortedArray.find(); // Get the first matching element.
sortedArray.findIndex(); // Get the index of the first matching element.
sortedArray.flat(); // Returns a flattened Array.
sortedArray.flatMap(); // Returns a flattened mapped Array.
sortedArray.forEach(); // Invokes for every element in the array.
sortedArray.includes(); // True when a value is in the array. [%]
sortedArray.indexOf(); // First index of a value, or -1 if not present. [%]
sortedArray.join(); // Join elements to produce a string.
sortedArray.keys(); // Returns an iterator of indexes in the array.
sortedArray.lastIndexOf(); // Last index of a value, or -1 if not present. [%]
sortedArray.map(); // Map elements in the array to produce a new Array.
sortedArray.pop(); // Remove and return the last element in the array.
sortedArray.push(); // Append a new element to the end of the array. [!]
sortedArray.reduce(); // Reduce the array.
sortedArray.reduceRight(); // Reduce the array, backwards.
sortedArray.reverse(); // Reverse and permanently invert sort order.
sortedArray.shift(); // Remove and return the first element in the array.
sortedArray.slice(); // Get a slice as another SortedArray.
sortedArray.some(); // True if any element matches a predicate.
sortedArray.sort(); // Re-sort and update the array with a different comparator.
sortedArray.splice(); // Remove and/or insert elements in the array. [!]
sortedArray.toLocaleString(); // Get a localized string representation.
sortedArray.toString(); // Get a string representation of the array.
sortedArray.unshift(); // Prepend a value to the beginning of the array. [!]
sortedArray.values(); // Returns an iterator of values in the array.
```

Also of interest are the `firstInsertionIndexOf` and `lastInsertionIndexOf`
methods. These return the first index and the last index, respectively,
where a value can be found or should be inserted into the array.

``` js
sortedArray.firstInsertionIndexOf(x);
sortedArray.lastInsertionIndexOf(x);
```

Some operations, if used carelessly, can cause the SortedArray's
contents to no longer be in sorted order. **DON'T DO THIS!**
Invalidating the SortedArray's assumption that its contents are
always in a sorted order will cause incorrect behavior.
Use these tools with care!

``` js
// USE WITH CAUTION!
sortedArray[0] = x;
sortedArray.length = x;
sortedArray.push(x);
sortedArray.unshift(x);
sortedArray.splice(0, 0, x);
sortedArray.fill(x, 0, 1);
sortedArray.copyWithin(0, 1, 2);
```


