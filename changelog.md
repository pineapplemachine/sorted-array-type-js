# v1.3.0

Seventh release. 28 October 2023.

This release is a major change for the library, converting the project to
TypeScript, adding much more comprehensive documentation, and migrating to
GitHub actions to replace the now-broken Travis CI tests.
However, the release makes only minor changes to the library's API.

Note that if using `require`, the SortedArray package should now be
imported using `const {SortedArray} = require("sorted-array-type");`.

- Covert implementation and tests from JavaScript to TypeScript.
- Improve documentation and host generated API docs via GitHub pages.
- Use GitHub actions instead of Travis CI for automated tests.
- Add coveralls test coverage report.
- Fix behavior of some SortedArray methods with array-like object inputs.
- Add `indexOfRange` and `lastIndexOfRange` methods.
- Change `removeAll` to return the number of removed items instead of a list.
- Add `getRemoveAll` method which reproduces the old behavior of `removeAll`.

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
