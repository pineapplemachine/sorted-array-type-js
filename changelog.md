# v1.2.1

Sixth release. 18 July 2018.

- Add `getEqualVaues` and `removeAll` methods.

# v1.2.0

Fifth release. 18 July 2018.

- Remove files except `index.js`, `LICENSE`, and `readme.md` from publication.
- Add the option to use a value equality function other than SameValueZero.
- Add optional value equality function argument to the SortedArray constructor.
- Add optional value equality function argument to `SortedArray.from`.
- Add optional value equality function argument to `SortedArray.fromSorted`.
- Add `removeLast` method.

# v1.1.0

Fourth release. 13 July 2018.

- Renamed `insertionIndexOf` to `firstInsertionIndexOf`.
- Add `new SortedArray(comparator)` constructor.
- More optimized `insertSorted` implementation.
- Stable `Array.sort` should now guarantee SortedArray stability.
- Achieve 100% test coverage.

# v1.0.2

Third release. 12 July 2018.

- Improved test coverage and documentation.

# v1.0.1

Second release. 12 July 2018.

- Fix SortedArray returned by `splice` not having the correct comparator.

# v1.0.0

First release. 12 July 2018.
