require("source-map-support").install();

import {strict as assert} from "node:assert";

import CanaryTest from "canary-test";

import SortedArray from "../src/index";

function ints(upTo: number): Ints {
    return new Ints(upTo);
}

class Ints {
    upTo: number;
    exceptFor: number[];
    
    constructor(upTo: number) {
        this.upTo = upTo;
        this.exceptFor = [];
    }
    
    except(...n: number[]) {
        this.exceptFor.push(...n);
        return this;
    }
    
    *[Symbol.iterator]() {
        for(let i: number = 0; i < this.upTo; i++) {
            if(this.exceptFor.indexOf(i) < 0) {
                yield i;
            }
        }
    }
}

const canary = CanaryTest.Group("SortedArray");

function assertArray(actual: any[], expected: Iterable<any>) {
    if(!(actual instanceof SortedArray)) {
        throw new Error("Expected a SortedArray.");
    }
    function fail() {throw new Error(
        `Arrays not equal:\n` +
        `Expected: ${JSON.stringify(expected, null, " ")}\n` +
        `Actual: ${JSON.stringify(actual, null, " ")}`
    );}
    const expectedArray = (Array.isArray(expected) ?
        expected : Array.from(expected)
    );
    if(actual.length !== expectedArray.length) {
        fail();
    }
    for(let i = 0; i < expectedArray.length; i++) {
        if(actual[i] !== expectedArray[i]) {
            fail();
        }
    }
}

canary.group("construction", function() {
    this.test("no arguments", function() {
        const array = new SortedArray();
        assert.equal(array.length, 0);
        assert.equal(array[0], undefined);
    });
    this.test("comparator only", function() {
        const array = new SortedArray<number>((a, b) => b - a);
        assert.equal(array.length, 0);
        assert.equal(array[0], undefined);
    });
    this.test("values only", function() {
        const array = new SortedArray([4, 3, 1, 2]);
        assertArray(array, [1, 2, 3, 4]);
    });
    this.test("values and comparator", function() {
        const array = new SortedArray([4, 3, 1, 2], (a, b) => b - a);
        assertArray(array, [4, 3, 2, 1]);
    });
    this.test("comparator and equality functions", function() {
        const array = new SortedArray<number>(
            (a, b) => a - b,
            (a, b) => a === b
        );
        assertArray(array, []);
    });
    this.test("values and comparator and equality function", function() {
        const array = new SortedArray([4, 3, 1, 2],
            (a, b) => b - a,
            (a, b) => a === b
        );
        assertArray(array, [4, 3, 2, 1]);
    });
    this.test("values as string", function() {
        const array = new SortedArray("hello");
        assertArray(array, ["e", "h", "l", "l", "o"]);
    });
    this.test("values from generator", function() {
        const generator = function*() {yield 2; yield 1; yield 3;};
        const array = new SortedArray(generator());
        assert.equal(array.length, 3);
        assertArray(array, [1, 2, 3]);
    });
    this.test("values from \"arguments\" array-like object", function() {
        const func = function(...i: number[]) {
            return new SortedArray(arguments);
        };
        assertArray(func(3, 1, 4, 2), [1, 2, 3, 4]);
    });
    this.test("values from array-like object", function() {
        const array = new SortedArray({length: 3, 0: 1, 1: 2, 2: 3});
        assertArray(array, [1, 2, 3]);
    });
    this.test("values from other SortedArray", function() {
        const a = new SortedArray([1, 2, 3, 4]);
        assertArray(new SortedArray(a), [1, 2, 3, 4]);
        assertArray(new SortedArray(a, (a, b) => b - a), [4, 3, 2, 1]);
        // Verify that elements are not reordered when the comparator
        // for the old and new SortedArray are identical.
        // You should not actually use SortedArray like this!
        const dont = SortedArray.ofSorted(3, 1, 2);
        assertArray(new SortedArray(dont), [3, 1, 2]);
    });
    this.test("values from SortedArray with equality function", function() {
        const cmp = (a: any, b: any) => +a - +b;
        const original = new SortedArray([1, 3, "2", "4"],
            cmp, (a, b) => a == b
        );
        const differentSort = new SortedArray(original, (a, b) => +b - +a);
        assertArray(differentSort, ["4", 3, "2", 1]);
        const sameSort = new SortedArray(original, cmp);
        assertArray(sameSort, [1, "2", 3, "4"]);
        const unspecifiedSort = new SortedArray(original);
        assertArray(unspecifiedSort, [1, "2", 3, "4"]);
        const differentEquality = new SortedArray(original,
            cmp, (a, b) => a === b
        );
        assertArray(differentEquality, [1, "2", 3, "4"]);
    });
    this.test("invalid arguments", function() {
        assert.throws(() => new SortedArray([], <any> "nope"),
            TypeError, "Comparator argument is not a function."
        );
        assert.throws(() => new SortedArray([], () => 0, <any> "nope"),
            TypeError, "Equality argument is not a function."
        );
        assert.throws(() => new SortedArray(<any> true),
            TypeError, "Values argument is not iterable or array-like."
        );
        for(let invalidLength of [-1, +1.5, Infinity, NaN]) {
            assert.throws(() => new SortedArray(invalidLength),
                RangeError, "Invalid array length."
            );
        }
    });
    this.test("of", function() {
        assertArray(SortedArray.of(), []);
        assertArray(SortedArray.of(1, 2, 4, 3), [1, 2, 3, 4]);
    });
    this.test("ofSorted", function() {
        assertArray(SortedArray.ofSorted(), []);
        assertArray(SortedArray.ofSorted(1, 2, 3, 4), [1, 2, 3, 4]);
        // Verify that elements are not reordered
        // You should not actually use SortedArray like this!
        assertArray(SortedArray.ofSorted(2, 3, 1), [2, 3, 1]);
    });
    this.test("from", function() {
        assertArray(SortedArray.from([2, 3, 1]), [1, 2, 3]);
        assertArray(SortedArray.from([2, 3, 1], (a, b) => b - a), [3, 2, 1]);
    });
    this.test("fromSorted", function() {
        assertArray(SortedArray.fromSorted([]), []);
        assertArray(SortedArray.fromSorted([1, 2, 3]), [1, 2, 3]);
        // Verify that elements are not reordered
        // You should not actually use SortedArray like this!
        assertArray(SortedArray.fromSorted([2, 3, 1]), [2, 3, 1]);
    });
    this.test("fromSorted generator", function() {
        const generator = function*() {yield 1; yield 2; yield 3;};
        assertArray(SortedArray.fromSorted(generator()), [1, 2, 3]);
    });
    this.test("fromSorted array-like object", function() {
        const arrayLike = {length: 3, 0: 1, 1: 2, 2: 3};
        assertArray(SortedArray.fromSorted(arrayLike), [1, 2, 3]);
    });
});

canary.group("insertion", function() {
    this.test("insert", function() {
        const array = new SortedArray();
        assert.equal(array.insert(1), 1);
        assertArray(array, [1]);
        assert.equal(array.insert(4), 2);
        assertArray(array, [1, 4]);
        assert.equal(array.insert(3), 3);
        assertArray(array, [1, 3, 4]);
        assert.equal(array.insert(0), 4);
        assertArray(array, [0, 1, 3, 4]);
        assert.equal(array.insert(0), 5);
        assertArray(array, [0, 0, 1, 3, 4]);
    });
    this.test("insert into large array", function() {
        const reference = Array.from(ints(60));
        const array = SortedArray.fromSorted(reference);
        array.insert(21);
        reference.splice(21, 0, 21);
        assertArray(array, reference);
        array.insert(60);
        reference.push(60);
        assertArray(array, reference);
        array.insert(0);
        reference.unshift(0);
        assertArray(array, reference);
    });
    this.test("insertSorted", function() {
        const array = new SortedArray([10, 20, 30, 40]);
        const newLength = array.insertSorted([5, 15, 25, 45]);
        assertArray(array, [5, 10, 15, 20, 25, 30, 40, 45]);
        assert.equal(newLength, array.length);
        assert.equal(array.length, 8);
    });
    this.test("insertSorted empty input", function() {
        const array = new SortedArray([1, 2, 3]);
        // Empty array
        assert.equal(array.insertSorted([]), 3);
        assertArray(array, [1, 2, 3]);
        // Empty generator
        assert.equal(array.insertSorted(function*() {}()), 3);
        assertArray(array, [1, 2, 3]);
        // Empty array-like object
        assert.equal(array.insertSorted({length: 0}), 3);
        assertArray(array, [1, 2, 3]);
    });
    this.test("insertSorted duplicate values", function() {
        const array = new SortedArray([1, 2, 3]);
        array.insertSorted([1, 2, 2, 3]);
        assertArray(array, [1, 1, 2, 2, 2, 3, 3]);
    });
    this.test("insertSorted generator", function() {
        const gen = function*() {yield 3; yield 5;};
        const array = new SortedArray([1, 2, 4]);
        array.insertSorted(gen());
        assertArray(array, [1, 2, 3, 4, 5]);
    });
    this.test("insertSorted \"arguments\" array-like object", function() {
        const array = new SortedArray([1, 2, 4]);
        const insertArgs = function(...i: number[]) {
            array.insertSorted(arguments)
        };
        insertArgs(3, 5);
        assertArray(array, [1, 2, 3, 4, 5]);
    });
    this.test("insertSorted array-like object", function() {
        const array = new SortedArray([1, 2, 4]);
        array.insertSorted({length: 2, 0: 3, 1: 5});
        assertArray(array, [1, 2, 3, 4, 5]);
    });
    this.test("insertSorted non-iterable", function() {
        assert.throws(() => new SortedArray().insertSorted(<any> NaN),
            TypeError, "Values argument is not iterable or array-like."
        );
    });
    this.test("insertSorted all prepended", function() {
        const array = new SortedArray([4, 5, 6]);
        assert.equal(array.insertSorted([1, 2, 3]), 6);
        assertArray(array, [1, 2, 3, 4, 5, 6]);
    });
    this.test("insertSorted all appended", function() {
        const array = new SortedArray([1, 2, 3]);
        assert.equal(array.insertSorted([4, 5, 6]), 6);
        assertArray(array, [1, 2, 3, 4, 5, 6]);
    });
    this.test("insertSorted contiguous sub-array", function() {
        const array = new SortedArray([1, 2, 6, 7]);
        assert.equal(array.insertSorted([3, 4, 5]), 7);
        assertArray(array, [1, 2, 3, 4, 5, 6, 7]);
    });
    this.test("insertSorted prepend and append", function() {
        const array = new SortedArray([3, 4]);
        assert.equal(array.insertSorted([1, 2, 5, 6, 7]), 7);
        assertArray(array, [1, 2, 3, 4, 5, 6, 7]);
    });
    this.test("insertSorted array-like object all prepended", function() {
        const arrayLike = {length: 3, 0: 1, 1: 2, 2: 3};
        const array = new SortedArray([4, 5, 6]);
        assert.equal(array.insertSorted(arrayLike), 6);
        assertArray(array, [1, 2, 3, 4, 5, 6]);
    });
    this.test("insertSorted array-like object all appended", function() {
        const arrayLike = {length: 3, 0: 4, 1: 5, 2: 6};
        const array = new SortedArray([1, 2, 3]);
        assert.equal(array.insertSorted(arrayLike), 6);
        assertArray(array, [1, 2, 3, 4, 5, 6]);
    });
    this.test("insertSorted array-like object contiguous sub-array", function() {
        const arrayLike = {length: 3, 0: 3, 1: 4, 2: 5};
        const array = new SortedArray([1, 2, 6, 7]);
        assert.equal(array.insertSorted(arrayLike), 7);
        assertArray(array, [1, 2, 3, 4, 5, 6, 7]);
    });
    this.test("insertSorted array-like object prepend and append", function() {
        const arrayLike = {length: 5, 0: 1, 1: 2, 2: 5, 3: 6, 4: 7};
        const array = new SortedArray([3, 4]);
        assert.equal(array.insertSorted(arrayLike), 7);
        assertArray(array, [1, 2, 3, 4, 5, 6, 7]);
    });
    this.test("insert sorting stability", function() {
        const array = new SortedArray<{str: string, n: number}>((a, b) => a.n - b.n);
        array.insert({str: "a", n: 1});
        array.insert({str: "e", n: 2});
        array.insert({str: "b", n: 1});
        array.insert({str: "c", n: 1});
        array.insert({str: "d", n: 1});
        assert.deepEqual(array.map(i => i.str).join(""), "abcde");
        array.insertSorted([
            {str: "e", n: 1},
            {str: "a", n: 2},
            {str: "b", n: 2},
            {str: "c", n: 2},
            {str: "d", n: 3},
        ]);
        assert.deepEqual(array.map(i => i.str).join(""), "abcdeeabcd");
    });
});

canary.group("removal", function() {
    this.test("remove", function() {
        const array = SortedArray.ofSorted(1, 2, 3, 4);
        assert.equal(array.remove(2), true);
        assertArray(array, [1, 3, 4]);
        assert.equal(array.remove(4), true);
        assertArray(array, [1, 3]);
        assert.equal(array.remove(1), true);
        assertArray(array, [3]);
        assert.equal(array.remove(0), false);
        assertArray(array, [3]);
        assert.equal(array.remove(3), true);
        assertArray(array, []);
        assert.equal(array.remove(1), false);
        assertArray(array, []);
    });
    this.test("remove NaN", function() {
        const array = SortedArray.ofSorted(NaN);
        assert.equal(array.remove(NaN), true);
        assert.equal(array.length, 0);
    });
    this.test("remove signed zero", function() {
        const array = SortedArray.ofSorted(+0);
        assert.equal(array.remove(-0), true);
        assert.equal(array.length, 0);
    });
    this.test("remove doesn't coerce", function() {
        const cmp = (a: any, b: any) => +a - +b;
        const array = SortedArray.of<number | string>(1, "2", 3, "4");
        assertArray(array, [1, "2", 3, "4"]);
        assert.equal(array.remove("1"), false);
        assert.equal(array.remove(2), false);
        assert.equal(array.remove("4"), true);
        assertArray(array, [1, "2", 3]);
    });
    this.test("remove until empty", function() {
        const array = SortedArray.ofSorted(1, 2, 3, 4, 5, 6, 7, 8);
        while(array.length) array.remove(array[0]);
    });
    this.test("remove from large array", function() {
        const array = SortedArray.fromSorted(ints(60));
        assert.equal(array.length, 60);
        assert.equal(array.remove(<any> "nope"), false);
        assert.equal(array.remove(2), true);
        assertArray(array, ints(60).except(2));
        assert.equal(array.remove(59), true);
        assertArray(array, ints(60).except(2, 59));
        assert.equal(array.remove(1), true);
        assertArray(array, ints(60).except(1, 2, 59));
        assert.equal(array.length, 57);
    });
    this.test("remove values with the same sort order", function() {
        const array = new SortedArray<{str: string, n: number}>((a, b) => a.n - b.n);
        const objects = [
            {str: "a", n: 1},
            {str: "b", n: 1},
            {str: "c", n: 1},
            {str: "d", n: 2},
            {str: "e", n: 2},
            {str: "f", n: 2},
        ];
        array.insertSorted(objects);
        assert.deepEqual(array.map(i => i), objects);
        array.remove(objects[2]);
        assert.deepEqual(array.map(i => i.str).join(""), "abdef");
        array.remove(objects[4]);
        assert.deepEqual(array.map(i => i.str).join(""), "abdf");
        array.remove(objects[0]);
        assert.deepEqual(array.map(i => i.str).join(""), "bdf");
    });
    this.test("removeLast", function() {
        const array = SortedArray.ofSorted(1, 2, 3);
        assert.equal(array.removeLast(1), true);
        assertArray(array, [2, 3]);
        assert.equal(array.removeLast(3), true);
        assertArray(array, [2]);
        assert.equal(array.removeLast(3), false);
        assertArray(array, [2]);
        assert.equal(array.removeLast(4), false);
        assertArray(array, [2]);
        assert.equal(array.removeLast(2), true);
        assertArray(array, []);
    });
    this.test("removeLast NaN", function() {
        const array = SortedArray.ofSorted(NaN);
        assert.equal(array.removeLast(NaN), true);
        assertArray(array, []);
    });
    this.test("removeLast signed zero", function() {
        const array = SortedArray.ofSorted(+0);
        assert.equal(array.removeLast(-0), true);
        assertArray(array, []);
    });
    this.test("removeAll", function() {
        const array = SortedArray.ofSorted(1, 1, 1, 2, 3);
        assert.equal(array.removeAll(2), 1);
        assertArray(array, [1, 1, 1, 3]);
        assert.equal(array.removeAll(1), 3);
        assertArray(array, [3]);
        assert.equal(array.removeAll(4), 0);
        assertArray(array, [3]);
        assert.equal(array.removeAll(3), 1);
        assertArray(array, []);
    });
    this.test("removeAll NaN", function() {
        const array = SortedArray.ofSorted(NaN, NaN, NaN);
        const removedCount = array.removeAll(NaN);
        assert.equal(removedCount, 3);
        assertArray(array, []);
    });
    this.test("removeAll signed zero", function() {
        const array = SortedArray.ofSorted(+0, -0);
        const removedCount = array.removeAll(0);
        assertArray(array, []);
        assert.equal(removedCount, 2);
    });
    this.test("removeAll with non-contiguous elements", function() {
        const cmp = (a: any, b: any) => (
            a[0].toLowerCase().codePointAt(0) -
            b[0].toLowerCase().codePointAt(0)
        );
        const array = SortedArray.fromSorted(
            ["able", "apple", "ABLE", "ace", "Able", "bear"], cmp,
            (a, b) => a.toLowerCase() === b.toLowerCase()
        );
        const removedCount = array.removeAll("able");
        assertArray(array, ["apple", "ace", "bear"]);
        assert.equal(removedCount, 3);
    });
    this.test("getRemoveAll", function() {
        const array = SortedArray.ofSorted(1, 1, 1, 2, 3);
        assertArray(array.getRemoveAll(2), [2]);
        assertArray(array, [1, 1, 1, 3]);
        assertArray(array.getRemoveAll(1), [1, 1, 1]);
        assertArray(array, [3]);
        assertArray(array.getRemoveAll(4), []);
        assertArray(array, [3]);
        assertArray(array.getRemoveAll(3), [3]);
        assertArray(array, []);
    });
    this.test("getRemoveAll NaN", function() {
        const array = SortedArray.ofSorted(NaN, NaN, NaN);
        const removed = array.getRemoveAll(NaN);
        assert.equal(removed.length, 3);
        assertArray(array, []);
        assert.equal(removed.length, 3);
        assert(removed[0] !== removed[0]);
        assert(removed[1] !== removed[1]);
        assert(removed[2] !== removed[2]);
    });
    this.test("getRemoveAll signed zero", function() {
        const array = SortedArray.ofSorted(+0, -0);
        const removed = array.getRemoveAll(0);
        assertArray(array, []);
        assert.equal(1 / removed[0], +Infinity);
        assert.equal(1 / removed[1], -Infinity);
    });
    this.test("getRemoveAll returns a sorted array", function() {
        const array = SortedArray.fromSorted([1, "1", 1, "2"],
            (a, b) => +a - +b,
            (a, b) => a == b
        );
        const removed = array.getRemoveAll(1);
        assertArray(removed, [1, "1", 1]);
        removed.insert("2");
        assertArray(removed, [1, "1", 1, "2"]);
        removed.insert("+1");
        assertArray(removed, [1, "1", 1, "+1", "2"]);
    });
    this.test("getRemoveAll with non-contiguous elements", function() {
        const cmp = (a: any, b: any) => (
            a[0].toLowerCase().codePointAt(0) -
            b[0].toLowerCase().codePointAt(0)
        );
        const array = SortedArray.fromSorted(
            ["able", "apple", "ABLE", "ace", "Able", "bear"], cmp,
            (a, b) => a.toLowerCase() === b.toLowerCase()
        );
        const removed = array.getRemoveAll("able");
        assertArray(array, ["apple", "ace", "bear"]);
        assertArray(removed, ["able", "ABLE", "Able"]);
    });
});

canary.group("includes", function() {
    this.test("includes", function() {
        const array = new SortedArray([1, 2, 3]);
        assert.equal(array.includes(1), true);
        assert.equal(array.includes(2), true);
        assert.equal(array.includes(3), true);
        assert.equal(array.includes(0), false);
        assert.equal(array.includes(4), false);
        assert.equal(array.includes(<any> "1"), false);
        assert.equal(array.includes(NaN), false);
    });
    this.test("includes NaN", function() {
        const array = new SortedArray([NaN]);
        assert.equal(array.includes(1), false);
        assert.equal(array.includes(Infinity), false);
        assert.equal(array.includes(<any> "NaN"), false);
        assert.equal(array.includes(NaN), true);
    });
    this.test("includes signed zero", function() {
        const array = new SortedArray([+0]);
        assert.equal(array.includes(-0), true);
    });
    this.test("includes with start index", function() {
        const array = new SortedArray([1, 2, 3]);
        assert.equal(array.includes(1, 0), true);
        assert.equal(array.includes(1, NaN), true);
        assert.equal(array.includes(1, 2), false);
        assert.equal(array.includes(1, -3), true);
        assert.equal(array.includes(1, -10), true);
        assert.equal(array.includes(1, -1), false);
    });
});

canary.group("indexOf", function() {
    this.test("indexOf", function() {
        const array = new SortedArray([1, 1, 2, 3]);
        assert.equal(array.indexOf(1), 0);
        assert.equal(array.indexOf(2), 2);
        assert.equal(array.indexOf(3), 3);
        assert.equal(array.indexOf(4), -1);
        assert.equal(array.indexOf(0), -1);
        assert.equal(array.indexOf(<any> "3"), -1);
    });
    this.test("indexOf NaN", function() {
        const array = new SortedArray([NaN]);
        assert.equal(array.indexOf(NaN), 0);
    });
    this.test("indexOf signed zero", function() {
        const array = new SortedArray([+0]);
        assert.equal(array.indexOf(-0), 0);
    });
    this.test("indexOf with start index", function() {
        const array = new SortedArray([1, 2, 2, 3]);
        assert.equal(array.indexOf(2, 0), 1);
        assert.equal(array.indexOf(2, NaN), 1);
        assert.equal(array.indexOf(2, 2), 2);
        assert.equal(array.indexOf(2, -2), 2);
        assert.equal(array.indexOf(2, -3), 1);
        assert.equal(array.indexOf(2, -10), 1);
    });
    this.test("indexOf values with the same sort order", function() {
        const array = new SortedArray<{str: string, n: number}>((a, b) => a.n - b.n);
        const objects = [
            {str: "a", n: 1},
            {str: "b", n: 1},
            {str: "c", n: 1},
            {str: "d", n: 2},
            {str: "e", n: 2},
            {str: "f", n: 2},
        ];
        array.insertSorted(objects);
        assert.deepEqual(array.map(i => i), objects);
        assert.equal(array.indexOf(objects[0]), 0);
        assert.equal(array.indexOf(objects[1]), 1);
        assert.equal(array.indexOf(objects[2]), 2);
        assert.equal(array.indexOf(objects[3]), 3);
        assert.equal(array.indexOf(objects[4]), 4);
        assert.equal(array.indexOf(objects[5]), 5);
    });
    this.test("indexOf parity with Array.indexOf", function() {
        const arrayPlain = [0, 0, 0, 1, 1, 2, 2, 2];
        const arraySorted = SortedArray.from(arrayPlain);
        function assertIndexOfEqual(
            index: number, value: any, fromIndex: number | undefined,
        ) {
            const indexOfSorted = arraySorted.indexOf(value, fromIndex);
            const indexOfPlain = arrayPlain.indexOf(value, fromIndex);
            assert.equal(indexOfSorted, index);
            assert.equal(indexOfSorted, indexOfPlain);
        }
        assertIndexOfEqual(0, 0, undefined);
        assertIndexOfEqual(3, 1, undefined);
        assertIndexOfEqual(5, 2, undefined);
        assertIndexOfEqual(0, 0, 0);
        assertIndexOfEqual(1, 0, 1);
        assertIndexOfEqual(2, 0, 2);
        assertIndexOfEqual(-1, 0, 3);
        assertIndexOfEqual(-1, 0, 4);
        assertIndexOfEqual(-1, 0, 5);
        assertIndexOfEqual(-1, 0, 6);
        assertIndexOfEqual(-1, 0, 7);
        assertIndexOfEqual(0, 0, -8);
        assertIndexOfEqual(1, 0, -7);
        assertIndexOfEqual(2, 0, -6);
        assertIndexOfEqual(-1, 0, -5);
        assertIndexOfEqual(-1, 0, -4);
        assertIndexOfEqual(-1, 0, -3);
        assertIndexOfEqual(-1, 0, -2);
        assertIndexOfEqual(-1, 0, -1);
    });
    this.test("indexOfRange", function() {
        const array = new SortedArray([0, 0, 0, 1, 1, 2, 2, 2]);
        assert.equal(array.indexOfRange(0), 0);
        assert.equal(array.indexOfRange(1), 3);
        assert.equal(array.indexOfRange(2), 5);
        assert.equal(array.indexOfRange(4), -1);
        assert.equal(array.indexOfRange(<any> "3"), -1);
        assert.equal(array.indexOfRange(0, 0), 0);
        assert.equal(array.indexOfRange(0, 1), 1);
        assert.equal(array.indexOfRange(0, 2), 2);
        assert.equal(array.indexOfRange(0, 3), -1);
        assert.equal(array.indexOfRange(2, 0, 7), 5);
        assert.equal(array.indexOfRange(2, 0, 6), 5);
        assert.equal(array.indexOfRange(2, 0, 5), 5);
        assert.equal(array.indexOfRange(2, 0, 4), -1);
        assert.equal(array.indexOfRange(2, 0, -1), 5);
        assert.equal(array.indexOfRange(2, 0, -2), 5);
        assert.equal(array.indexOfRange(2, 0, -3), 5);
        assert.equal(array.indexOfRange(2, 0, -4), -1);
    });
});

canary.group("lastIndexOf", function() {
    this.test("lastIndexOf", function() {
        const array = new SortedArray([1, 1, 2, 3]);
        assert.equal(array.lastIndexOf(1), 1);
        assert.equal(array.lastIndexOf(2), 2);
        assert.equal(array.lastIndexOf(3), 3);
        assert.equal(array.lastIndexOf(4), -1);
        assert.equal(array.lastIndexOf(0), -1);
        assert.equal(array.lastIndexOf(<any> "3"), -1);
    });
    this.test("lastIndexOf NaN", function() {
        const array = new SortedArray([NaN]);
        assert.equal(array.lastIndexOf(NaN), 0);
        array.insert(NaN);
        assert.equal(array.lastIndexOf(NaN, 1), 1);
    });
    this.test("lastIndexOf signed zero", function() {
        const array = new SortedArray([+0]);
        assert.equal(array.lastIndexOf(-0), 0);
    });
    this.test("lastIndexOf in large array", function() {
        const array = SortedArray.fromSorted(ints(60));
        assert.equal(array.lastIndexOf(0), 0);
        assert.equal(array.lastIndexOf(3), 3);
        assert.equal(array.lastIndexOf(50), 50);
        assert.equal(array.lastIndexOf(59), 59);
        assert.equal(array.lastIndexOf(<any> "nope"), -1);
    });
    this.test("lastIndexOf with start index", function() {
        const array = new SortedArray([1, 2, 2, 3]);
        assert.equal(array.lastIndexOf(2), 2);
        assert.equal(array.lastIndexOf(2, NaN), 2);
        assert.equal(array.lastIndexOf(2, 1), 1);
        assert.equal(array.lastIndexOf(2, -1), 2);
        assert.equal(array.lastIndexOf(2, -3), 1);
        assert.equal(array.lastIndexOf(2, -4), -1);
        assert.equal(array.lastIndexOf(2, -10), -1);
    });
    this.test("lastIndexOf values with the same sort order", function() {
        const array = new SortedArray<{str: string, n: number}>((a, b) => a.n - b.n);
        const objects = [
            {str: "a", n: 1},
            {str: "b", n: 1},
            {str: "c", n: 1},
            {str: "d", n: 2},
            {str: "e", n: 2},
            {str: "f", n: 2},
        ];
        array.insertSorted(objects);
        assert.deepEqual(array.map(i => i), objects);
        assert.equal(array.lastIndexOf(objects[0]), 0);
        assert.equal(array.lastIndexOf(objects[1]), 1);
        assert.equal(array.lastIndexOf(objects[2]), 2);
        assert.equal(array.lastIndexOf(objects[3]), 3);
        assert.equal(array.lastIndexOf(objects[4]), 4);
        assert.equal(array.lastIndexOf(objects[5]), 5);
    });
    this.test("lastIndexOf parity with Array.lastIndexOf", function() {
        const arrayPlain = [0, 0, 0, 1, 1, 2, 2, 2];
        const arraySorted = SortedArray.from(arrayPlain);
        function assertLastIndexOfEqual(
            index: number, value: any, fromIndex: number | undefined,
        ) {
            const indexOfSorted = arraySorted.lastIndexOf(value, fromIndex);
            const indexOfPlain = arrayPlain.lastIndexOf(value, fromIndex);
            assert.equal(indexOfSorted, index);
            assert.equal(indexOfSorted, indexOfPlain);
        }
        // Questionable whether it is a good idea to retain this
        // behavior of Array.lastIndexOf...
        // assertLastIndexOfEqual(0, 0, undefined);
        // assertLastIndexOfEqual(-1, 1, undefined);
        // assertLastIndexOfEqual(-1, 2, undefined);
        assertLastIndexOfEqual(-1, 2, 0);
        assertLastIndexOfEqual(-1, 2, 1);
        assertLastIndexOfEqual(-1, 2, 2);
        assertLastIndexOfEqual(-1, 2, 3);
        assertLastIndexOfEqual(-1, 2, 4);
        assertLastIndexOfEqual(5, 2, 5);
        assertLastIndexOfEqual(6, 2, 6);
        assertLastIndexOfEqual(7, 2, 7);
        assertLastIndexOfEqual(-1, 2, -8);
        assertLastIndexOfEqual(-1, 2, -7);
        assertLastIndexOfEqual(-1, 2, -6);
        assertLastIndexOfEqual(-1, 2, -5);
        assertLastIndexOfEqual(-1, 2, -4);
        assertLastIndexOfEqual(5, 2, -3);
        assertLastIndexOfEqual(6, 2, -2);
        assertLastIndexOfEqual(7, 2, -1);
    });
    this.test("lastIndexOfRange", function() {
        const array = new SortedArray([0, 0, 0, 1, 1, 2, 2, 2]);
        assert.equal(array.lastIndexOfRange(0), 2);
        assert.equal(array.lastIndexOfRange(1), 4);
        assert.equal(array.lastIndexOfRange(2), 7);
        assert.equal(array.lastIndexOfRange(4), -1);
        assert.equal(array.lastIndexOfRange(<any> "3"), -1);
        assert.equal(array.lastIndexOfRange(2, 0, 7), 7);
        assert.equal(array.lastIndexOfRange(2, 0, 6), 6);
        assert.equal(array.lastIndexOfRange(2, 0, 5), 5);
        assert.equal(array.lastIndexOfRange(2, 0, 4), -1);
        assert.equal(array.lastIndexOfRange(2, 0, -1), 7);
        assert.equal(array.lastIndexOfRange(2, 0, -2), 6);
        assert.equal(array.lastIndexOfRange(2, 0, -3), 5);
        assert.equal(array.lastIndexOfRange(2, 0, -4), -1);
        assert.equal(array.lastIndexOfRange(0, 0), 2);
        assert.equal(array.lastIndexOfRange(0, 1), 2);
        assert.equal(array.lastIndexOfRange(0, 2), 2);
        assert.equal(array.lastIndexOfRange(0, 3), -1);
    });
});

canary.group("getEqualValues", function() {
    this.test("contiguous results", function() {
        const array = SortedArray.fromSorted([1, "1", 1, "2"],
            (a, b) => +a - +b,
            (a, b) => a == b
        );
        assertArray(array.getEqualValues(0), []);
        assertArray(array.getEqualValues(2), ["2"]);
        const values = array.getEqualValues(1);
        assertArray(values, [1, "1", 1]);
        values.insert("2");
        assertArray(values, [1, "1", 1, "2"]);
        values.insert("+1");
        assertArray(values, [1, "1", 1, "+1", "2"]);
    });
    this.test("non-contiguous results", function() {
        const cmp = (a: any, b: any) => (
            a[0].toLowerCase().codePointAt(0) -
            b[0].toLowerCase().codePointAt(0)
        );
        const array = SortedArray.fromSorted(
            ["able", "apple", "ABLE", "ace", "Able", "bear"], cmp,
            (a, b) => a.toLowerCase() === b.toLowerCase()
        );
        const values = array.getEqualValues("able");
        assertArray(values, ["able", "ABLE", "Able"]);
    });
});

canary.test("firstInsertionIndexOf", function() {
    const array = new SortedArray([1, 1, 2, 2, 2, 3]);
    assert.equal(array.firstInsertionIndexOf(0), 0);
    assert.equal(array.firstInsertionIndexOf(2), 2);
    assert.equal(array.firstInsertionIndexOf(3), 5);
    assert.equal(array.firstInsertionIndexOf(4), 6);
    assert.equal(array.firstInsertionIndexOf(2, 3), 3);
    assert.equal(array.firstInsertionIndexOf(2, 4), 4);
    assert.equal(array.firstInsertionIndexOf(0, 2, 4), 2);
    assert.equal(array.firstInsertionIndexOf(0, 2, -2), 2);
});
canary.test("lastInsertionIndexOf", function() {
    const array = new SortedArray([1, 1, 2, 2, 2, 3]);
    assert.equal(array.lastInsertionIndexOf(0), 0);
    assert.equal(array.lastInsertionIndexOf(2), 5);
    assert.equal(array.lastInsertionIndexOf(3), 6);
    assert.equal(array.lastInsertionIndexOf(4), 6);
    assert.equal(array.lastInsertionIndexOf(2, 0, 4), 4);
    assert.equal(array.lastInsertionIndexOf(2, 0, 3), 3);
    assert.equal(array.lastInsertionIndexOf(0, 2, 3), 2);
    assert.equal(array.lastInsertionIndexOf(0, -4, 3), 2);
    assert.equal(array.lastInsertionIndexOf(0, 2, -3), 2);
});

canary.test("length", function() {
    const array = new SortedArray([1, 2, 3]);
    assert.equal(array.length, 3);
    array.length = 4;
    assert.equal(array.length, 4);
    let count = 0;
    for(let element of array) count++;
    assert.equal(count, 4);
});
canary.test("indexing", function() {
    const array = new SortedArray([1, 2, 3]);
    assert.equal(array[0], 1);
    assert.equal(array[1], 2);
    assert.equal(array[2], 3);
    assert.equal(array[3], undefined);
    array[0] = 0;
    assertArray(array, [0, 2, 3]);
});
canary.test("species", function() {
    assert.equal(SortedArray[Symbol.species], SortedArray);
});

canary.test("concat", function() {
    const array = new SortedArray([1, 2, 3]);
    const concat = array.concat([10, 9, 8]);
    assert(!(concat instanceof SortedArray));
    assert.deepEqual(concat, [1, 2, 3, 10, 9, 8]);
});
canary.test("copyWithin", function() {
    // Should not normally be used!
    const array = new SortedArray([1, 2, 3, 4]);
    assert.equal(array.copyWithin(0, 1, 2), array);
    assertArray(array, [2, 2, 3, 4]);
});
canary.test("entries", function() {
    const array = new SortedArray([0, 1, 2]);
    let count = 0;
    for(let entry of array.entries()) {
        assert.equal(entry[0], count);
        assert.equal(entry[1], entry[0]);
        count++;
    }
    assert.equal(count, 3);
});
canary.test("every", function() {
    const array = new SortedArray([0, 1, 2]);
    assert.equal(array.every(n => n < 3), true);
    assert.equal(array.every(n => n === 0), false);
});
canary.test("fill", function() {
    // Should not normally be used!
    const array = new SortedArray([0, 1, 2]);
    array.fill(0);
    assertArray(array, [0, 0, 0]);
});
canary.test("filter", function() {
    // Test with a default comparator
    const array = new SortedArray([1, 2, 3, 4, 5, 6]);
    const even = array.filter(n => n % 2 === 0);
    assert(even instanceof SortedArray);
    assertArray(even, [2, 4, 6]);
    even.insert(3);
    assertArray(even, [2, 3, 4, 6]);
    // Also test with a custom comparator
    const back = new SortedArray([3, 2, 1], (a, b) => b - a);
    const odd = back.filter(n => n % 2);
    assertArray(odd, [3, 1]);
    odd.insert(0);
    assertArray(odd, [3, 1, 0]);
    // Test failure case where input is not a function
    assert.throws(() => array.filter(<any> "nope"),
        TypeError, "Predicate is not a function."
    );
});
canary.test("find", function() {
    const array = new SortedArray([1, 2, 3, 4]);
    assert.equal(2, array.find(n => n % 2 === 0));
    assert.equal(undefined, array.find(n => n < 0));
});
canary.test("findIndex", function() {
    const array = new SortedArray([1, 2, 3, 4]);
    assert.equal(1, array.findIndex(n => n % 2 === 0));
    assert.equal(-1, array.findIndex(n => n < 0));
});
canary.test("flat", function() {
    const array = new SortedArray([[1, 2], [3, 4]]);
    const flat = array.flat();
    assert(!(flat instanceof SortedArray));
    assert.deepEqual(flat, [1, 2, 3, 4]);
});
canary.test("flatMap", function() {
    const array = new SortedArray([1, 2, 3]);
    const flat = array.flatMap(n => [n, n]);
    assert(!(flat instanceof SortedArray));
    assert.deepEqual(flat, [1, 1, 2, 2, 3, 3]);
});
canary.test("forEach", function() {
    const array = new SortedArray([0, 1, 2, 3]);
    let count = 0;
    array.forEach((n, i, a) => {
        assert.equal(n, i);
        assert.equal(a, array);
        count++;
    });
    assert.equal(count, 4);
});
canary.test("join", function() {
    const array = new SortedArray([1, 2, 3]);
    assert.equal(array.join(","), "1,2,3");
});
canary.test("keys", function() {
    const array = new SortedArray([0, 1, 2]);
    let count = 0;
    for(let key of array.keys()) {
        assert.equal(key, count);
        count++;
    }
    assert.equal(count, 3);
});
canary.test("map", function() {
    const array = new SortedArray([1, 2, 3, 4]);
    const bits = array.map(n => n % 2);
    assert(!(bits instanceof SortedArray));
    assert.deepEqual(bits, [1, 0, 1, 0]);
});
canary.test("pop", function() {
    const array = new SortedArray([1, 2, 3]);
    assert.equal(array.pop(), 3);
    assert.equal(array.pop(), 2);
    assert.equal(array.pop(), 1);
    assert.equal(array.pop(), undefined);
    assert.equal(array.length, 0);
});
canary.test("push", function() {
    const array = new SortedArray([1, 2, 3]);
    assert.equal(array.push(4, 5, 6), 6);
    assertArray(array, [1, 2, 3, 4, 5, 6]);
});
canary.test("reduce", function() {
    const array = new SortedArray(["a", "b", "c"]);
    assert.equal(array.reduce((acc, next) => acc + next), "abc");
});
canary.test("reduceRight", function() {
    const array = new SortedArray(["a", "b", "c"]);
    assert.equal(array.reduceRight((acc, next) => acc + next), "cba");
});
canary.test("reverse", function() {
    const array = new SortedArray([1, 2, 3, 4, 5]);
    array.reverse();
    assertArray(array, [5, 4, 3, 2, 1]);
    array.insert(6);
    assertArray(array, [6, 5, 4, 3, 2, 1]);
    array.reverse();
    assertArray(array, [1, 2, 3, 4, 5, 6]);
    array.insert(0);
    assertArray(array, [0, 1, 2, 3, 4, 5, 6]);
});
canary.test("shift", function() {
    const array = new SortedArray([1, 2, 3]);
    assert.equal(array.shift(), 1);
    assert.equal(array.shift(), 2);
    assert.equal(array.shift(), 3);
    assert.equal(array.shift(), undefined);
    assert.equal(array.length, 0);
});
canary.test("slice", function() {
    const array = new SortedArray([4, 3, 2, 1], (a, b) => b - a);
    const slice = array.slice(1, 3);
    assert(slice instanceof SortedArray);
    assertArray(slice, [3, 2]);
    slice.insert(6);
    assertArray(slice, [6, 3, 2]);
});
canary.test("some", function() {
    const array = new SortedArray([1, 2, 3, 4]);
    assert.equal(array.some(n => n === 2), true);
    assert.equal(array.some(n => n > 4), false);
});
canary.test("sort", function() {
    const array = new SortedArray([1, 2, 3, 4, 5]);
    // Explicit comparator
    array.sort((a, b) => b - a);
    assertArray(array, [5, 4, 3, 2, 1]);
    array.insert(6);
    assertArray(array, [6, 5, 4, 3, 2, 1]);
    // Using the default comparator
    array.sort();
    assertArray(array, [1, 2, 3, 4, 5, 6]);
    array.remove(4);
    assertArray(array, [1, 2, 3, 5, 6]);
    // Using the same comparator
    array.sort();
    assertArray(array, [1, 2, 3, 5, 6]);
    array.remove(1);
    assertArray(array, [2, 3, 5, 6]);
});
canary.test("splice", function() {
    const array = new SortedArray([4, 3, 2, 1], (a, b) => b - a);
    const splice = array.splice(1, 2);
    assert(splice instanceof SortedArray);
    assertArray(splice, [3, 2]);
    splice.insert(6);
    assertArray(splice, [6, 3, 2]);
});
canary.test("toLocaleString", function() {
    const array = new SortedArray([1, 2, 3]);
    // @ts-ignore - TS does not know that toLocaleString accepts an argument
    assert.equal(array.toLocaleString("en"), "1,2,3");
});
canary.test("toString", function() {
    const array = new SortedArray([1, 2, 3]);
    assert.equal(array.toString(), "1,2,3");
});
canary.test("unshift", function() {
    const array = new SortedArray([1, 2, 3]);
    assert.equal(array.unshift(0), 4);
    assertArray(array, [0, 1, 2, 3]);
});
canary.test("values", function() {
    const array = new SortedArray([0, 1, 2]);
    let count = 0;
    for(let value of array.values()) {
        assert.equal(value, count);
        count++;
    }
    assert.equal(count, 3);
});

canary.group("custom value equality function", function() {
    this.test("indexOf and lastIndexOf", function() {
        const cmp = (a: any, b: any) => +a - +b;
        const eq = (a: any, b: any) => a == b;
        const array = new SortedArray([1, "1", 1, "2", 2], cmp, eq);
        assert.equal(array.indexOf(1), 0);
        assert.equal(array.indexOf("1"), 0);
        assert.equal(array.lastIndexOf(1), 2);
        assert.equal(array.lastIndexOf("1"), 2);
        assert.equal(array.indexOf(2), 3);
        assert.equal(array.indexOf("2"), 3);
        assert.equal(array.lastIndexOf(2), 4);
        assert.equal(array.lastIndexOf("2"), 4);
    });
    this.test("remove and removeLast", function() {
        const cmp = (a: any, b: any) => +a - +b;
        const eq = (a: any, b: any) => a == b;
        const a = new SortedArray([], cmp, eq);
        const b = SortedArray.from([], cmp, eq);
        const c = SortedArray.fromSorted([], cmp, eq);
        for(let array of [a, b, c]) {
            array.insert(1);
            array.insert("2");
            array.insert(4);
            array.insert("3");
            array.insert(2);
            array.insert("2");
            assertArray(array, [1, "2", 2, "2", "3", 4]);
            assert.equal(array.remove(1), true);
            assertArray(array, ["2", 2, "2", "3", 4]);
            assert.equal(array.remove(3), true);
            assertArray(array, ["2", 2, "2", 4]);
            assert.equal(array.remove("4"), true);
            assertArray(array, ["2", 2, "2"]);
            assert.equal(array.remove(2), true);
            assertArray(array, [2, "2"]);
            assert.equal(array.removeLast(2), true);
            assertArray(array, [2]);
            assert.equal(array.removeLast(2), true);
            assertArray(array, []);
        }
    });
    this.test("slice", function() {
        const cmp = (a: any, b: any) => +a - +b;
        const eq = (a: any, b: any) => a == b;
        const array = SortedArray.fromSorted([1, "2", 3, "4"], cmp, eq);
        const slice = array.slice(2, 4);
        assertArray(slice, [3, "4"]);
        assert.equal(slice.remove(4), true);
        assertArray(slice, [3]);
    });
    this.test("splice", function() {
        const cmp = (a: any, b: any) => +a - +b;
        const eq = (a: any, b: any) => a == b;
        const array = SortedArray.fromSorted([1, "2", 3, "4"], cmp, eq);
        const splice = array.splice(2, 2);
        assertArray(splice, [3, "4"]);
        assert.equal(splice.remove(4), true);
        assertArray(splice, [3]);
    });
});

canary.test("valueOf", function() {
    const array = new SortedArray([3, 1, 2]);
    assert.equal(array.valueOf(), array);
});
canary.test("JSON.stringify", function() {
    const array = new SortedArray([3, 1, 2]);
    assert.equal(JSON.stringify(array), "[1,2,3]");
});
canary.test("isArray", function() {
    const array = new SortedArray([3, 1, 2]);
    assert.equal(true, Array.isArray(array));
});

canary.doReport();
