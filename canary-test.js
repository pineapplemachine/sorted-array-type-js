if(typeof(Array.prototype.flat) !== "function"){
    require('array.prototype.flat').shim();
}
if(typeof(Array.prototype.flatMap) !== "function"){
    require('array.prototype.flatmap').shim();
}
if(typeof(Array.prototype.values) !== "function"){
    Array.prototype.values = function* values(){
        for(let element of this) yield element;
    };
}

function ints(upTo){
    return new Ints(upTo);
}
class Ints{
    constructor(upTo){
        this.upTo = upTo;
        this.exceptFor = [];
    }
    except(...n){
        this.exceptFor = n;
        return this;
    }
    *[Symbol.iterator](){
        for(let i = 0; i < this.upTo; i++){
            if(this.exceptFor.indexOf(i) < 0) yield i;
        }
    }
}

function testSortedArray(SortedArray){
    const canary = require("canary-test").Group("sorted-array");
    const assert = require("assert").strict;
    
    function assertArray(actual, expected){
        if(!(actual instanceof SortedArray)){
            throw new Error("Expected a SortedArray.");
        }
        function fail(){throw new Error(
            `Arrays not equal:\n` +
            `Expected: ${JSON.stringify(expected, null, " ")}\n` +
            `Actual: ${JSON.stringify(actual, null, " ")}`
        );}
        expected = (Array.isArray(expected) ?
            expected : Array.from(expected)
        );
        if(actual.length !== expected.length){
            fail();
        }
        for(let i = 0; i < expected.length; i++){
            if(actual[i] !== expected[i]) fail();
        }
    }
    
    canary.group("construction", function(){
        this.test("no arguments", function(){
            const array = new SortedArray();
            assert.equal(array.length, 0);
            assert.equal(array[0], undefined);
        });
        this.test("comparator only", function(){
            const array = new SortedArray(null, (a, b) => b - a);
            assert.equal(array.length, 0);
            assert.equal(array[0], undefined);
        });
        this.test("values only", function(){
            const array = new SortedArray([4, 3, 1, 2]);
            assertArray(array, [1, 2, 3, 4]);
        });
        this.test("values and comparator", function(){
            const array = new SortedArray([4, 3, 1, 2], (a, b) => b - a);
            assertArray(array, [4, 3, 2, 1]);
        });
        this.test("values and string", function(){
            const array = new SortedArray("hello");
            assertArray(array, ["e", "h", "l", "l", "o"]);
        });
        this.test("values from generator", function(){
            const generator = function*(){yield 2; yield 1; yield 3;};
            const array = new SortedArray(generator());
            assert.equal(array.length, 3);
            assertArray(array, [1, 2, 3]);
        });
        this.test("values from array-like object", function(){
            const func = function(){return new SortedArray(arguments);};
            assertArray(func(3, 1, 4, 2), [1, 2, 3, 4]);
        });
        this.test("values from other SortedList", function(){
            const a = new SortedArray([1, 2, 3, 4]);
            assertArray(new SortedArray(a), [1, 2, 3, 4]);
            assertArray(new SortedArray(a, (a, b) => b - a), [4, 3, 2, 1]);
            // Verify that elements are not reordered when the comparator
            // for the old and new SortedArray are identical.
            // You should not actually use SortedArray like this!
            const b = SortedArray.ofSorted(3, 1, 2);
            assertArray(new SortedArray(b), [3, 1, 2]);
        });
        this.test("invalid arguments", function(){
            assert.throws(() => new SortedArray([], "nope"),
                TypeError, "Comparator must be a function."
            );
            assert.throws(() => new SortedArray(true),
                TypeError, "Unhandled input type. Expected an iterable."
            );
        });
        this.test("of", function(){
            assertArray(SortedArray.of(), []);
            assertArray(SortedArray.of(1, 2, 4, 3), [1, 2, 3, 4]);
        });
        this.test("ofSorted", function(){
            assertArray(SortedArray.ofSorted(), []);
            assertArray(SortedArray.ofSorted(1, 2, 3, 4), [1, 2, 3, 4]);
            // Verify that elements are not reordered
            // You should not actually use SortedArray like this!
            assertArray(SortedArray.ofSorted(2, 3, 1), [2, 3, 1]);
        });
        this.test("from", function(){
            assertArray(SortedArray.from([2, 3, 1]), [1, 2, 3]);
            assertArray(SortedArray.from([2, 3, 1], (a, b) => b - a), [3, 2, 1]);
        });
        this.test("fromSorted", function(){
            assertArray(SortedArray.fromSorted([]), []);
            assertArray(SortedArray.fromSorted([1, 2, 3]), [1, 2, 3]);
            // Verify that elements are not reordered
            // You should not actually use SortedArray like this!
            assertArray(SortedArray.fromSorted([2, 3, 1]), [2, 3, 1]);
        });
        this.test("fromSorted generator", function(){
            const generator = function*(){yield 1; yield 2; yield 3;};
            assertArray(SortedArray.fromSorted(generator()), [1, 2, 3]);
        });
    });
    
    canary.group("insertion", function(){
        this.test("insert", function(){
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
        this.test("insert into large array", function(){
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
        this.test("insertSorted", function(){
            const array = new SortedArray([10, 20, 30, 40]);
            array.insertSorted([5, 15, 25, 45]);
            assertArray(array, [5, 10, 15, 20, 25, 30, 40, 45]);
        });
        this.test("insertSorted empty input", function(){
            const array = new SortedArray([1, 2, 3]);
            array.insertSorted([]);
            assertArray(array, [1, 2, 3]);
        });
        this.test("insertSorted duplicate values", function(){
            const array = new SortedArray([1, 2, 3]);
            array.insertSorted([1, 2, 2, 3]);
            assertArray(array, [1, 1, 2, 2, 2, 3, 3]);
        });
        this.test("insertSorted generator", function(){
            const gen = function*(){yield 3; yield 5;};
            const array = new SortedArray([1, 2, 4]);
            array.insertSorted(gen());
            assertArray(array, [1, 2, 3, 4, 5]);
        });
        this.test("insertSorted array-like object", function(){
            const array = new SortedArray([1, 2, 4]);
            const insertArgs = function(){array.insertSorted(arguments)};
            insertArgs(3, 5);
            assertArray(array, [1, 2, 3, 4, 5]);
        });
        this.test("insertSorted non-iterable", function(){
            assert.throws(() => new SortedArray().insertSorted(NaN),
                TypeError, "Expected an iterable list of values."
            );
        });
        this.test("insert sorting stability", function(){
            const array = new SortedArray((a, b) => a.n - b.n);
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
    
    canary.group("removal", function(){
        this.test("remove", function(){
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
        this.test("remove NaN", function(){
            const array = SortedArray.ofSorted(NaN);
            assert.equal(array.remove(NaN), true);
            assert.equal(array.length, 0);
        });
        this.test("remove signed zero", function(){
            const array = SortedArray.ofSorted(+0);
            assert.equal(array.remove(-0), true);
            assert.equal(array.length, 0);
        });
        this.test("remove doesn't coerce", function(){
            const cmp = (a, b) => +a - +b;
            const array = SortedArray.of(1, "2", 3, "4");
            assertArray(array, [1, "2", 3, "4"]);
            assert.equal(array.remove("1"), false);
            assert.equal(array.remove(2), false);
            assert.equal(array.remove("4"), true);
            assertArray(array, [1, "2", 3]);
        });
        this.test("remove until empty", function(){
            const array = SortedArray.ofSorted(1, 2, 3, 4, 5, 6, 7, 8);
            while(array.length) array.remove(array[0]);
        });
        this.test("remove from large array", function(){
            const array = SortedArray.fromSorted(ints(60));
            assert.equal(array.length, 60);
            assert.equal(array.remove("nope"), false);
            assert.equal(array.remove(2), true);
            assertArray(array, ints(60).except(2));
            assert.equal(array.remove(59), true);
            assertArray(array, ints(60).except(2, 59));
            assert.equal(array.remove(1), true);
            assertArray(array, ints(60).except(1, 2, 59));
            assert.equal(array.length, 57);
        });
    });
    
    canary.group("includes", function(){
        this.test("includes", function(){
            const array = new SortedArray([1, 2, 3]);
            assert.equal(array.includes(1), true);
            assert.equal(array.includes(2), true);
            assert.equal(array.includes(3), true);
            assert.equal(array.includes(0), false);
            assert.equal(array.includes(4), false);
            assert.equal(array.includes("1"), false);
            assert.equal(array.includes(NaN), false);
        });
        this.test("includes NaN", function(){
            const array = new SortedArray([NaN]);
            assert.equal(array.includes(1), false);
            assert.equal(array.includes(Infinity), false);
            assert.equal(array.includes("NaN"), false);
            assert.equal(array.includes(NaN), true);
        });
        this.test("includes signed zero", function(){
            const array = new SortedArray([+0]);
            assert.equal(array.includes(-0), true);
        });
        this.test("includes with start index", function(){
            const array = new SortedArray([1, 2, 3]);
            assert.equal(array.includes(1, 0), true);
            assert.equal(array.includes(1, NaN), true);
            assert.equal(array.includes(1, 2), false);
            assert.equal(array.includes(1, -3), true);
            assert.equal(array.includes(1, -10), true);
            assert.equal(array.includes(1, -1), false);
        });
    });
    canary.group("indexOf", function(){
        this.test("indexOf", function(){
            const array = new SortedArray([1, 1, 2, 3]);
            assert.equal(array.indexOf(1), 0);
            assert.equal(array.indexOf(2), 2);
            assert.equal(array.indexOf(3), 3);
            assert.equal(array.indexOf(4), -1);
            assert.equal(array.indexOf(0), -1);
            assert.equal(array.indexOf("3"), -1);
        });
        this.test("indexOf NaN", function(){
            const array = new SortedArray([NaN]);
            assert.equal(array.indexOf(NaN), 0);
        });
        this.test("indexOf signed zero", function(){
            const array = new SortedArray([+0]);
            assert.equal(array.indexOf(-0), 0);
        });
        this.test("indexOf with start index", function(){
            const array = new SortedArray([1, 2, 2, 3]);
            assert.equal(array.indexOf(2, 0), 1);
            assert.equal(array.indexOf(2, NaN), 1);
            assert.equal(array.indexOf(2, 2), 2);
            assert.equal(array.indexOf(2, -2), 2);
            assert.equal(array.indexOf(2, -3), 1);
            assert.equal(array.indexOf(2, -10), 1);
        });
    });
    canary.group("lastIndexOf", function(){
        this.test("lastIndexOf", function(){
            const array = new SortedArray([1, 1, 2, 3]);
            assert.equal(array.lastIndexOf(1), 1);
            assert.equal(array.lastIndexOf(2), 2);
            assert.equal(array.lastIndexOf(3), 3);
            assert.equal(array.lastIndexOf(4), -1);
            assert.equal(array.lastIndexOf(0), -1);
            assert.equal(array.lastIndexOf("3"), -1);
        });
        this.test("lastIndexOf NaN", function(){
            const array = new SortedArray([NaN]);
            assert.equal(array.lastIndexOf(NaN), 0);
        });
        this.test("lastIndexOf signed zero", function(){
            const array = new SortedArray([+0]);
            assert.equal(array.lastIndexOf(-0), 0);
        });
        this.test("lastIndexOf in large array", function(){
            const array = SortedArray.fromSorted(ints(60));
            assert.equal(array.lastIndexOf(0), 0);
            assert.equal(array.lastIndexOf(3), 3);
            assert.equal(array.lastIndexOf(50), 50);
            assert.equal(array.lastIndexOf(59), 59);
            assert.equal(array.lastIndexOf("nope"), -1);
        });
        this.test("lastIndexOf with start index", function(){
            const array = new SortedArray([1, 2, 2, 3]);
            assert.equal(array.lastIndexOf(2), 2);
            assert.equal(array.lastIndexOf(2, NaN), 2);
            assert.equal(array.lastIndexOf(2, 1), 1);
            assert.equal(array.lastIndexOf(2, -1), 2);
            assert.equal(array.lastIndexOf(2, -3), 1);
            assert.equal(array.lastIndexOf(2, -4), -1);
            assert.equal(array.lastIndexOf(2, -10), -1);
        });
    });
    
    canary.test("firstInsertionIndexOf", function(){
        const array = new SortedArray([1, 1, 2, 2, 2, 3]);
        assert.equal(array.firstInsertionIndexOf(0), 0);
        assert.equal(array.firstInsertionIndexOf(2), 2);
        assert.equal(array.firstInsertionIndexOf(3), 5);
        assert.equal(array.firstInsertionIndexOf(4), 6);
        assert.equal(array.firstInsertionIndexOf(2, 3), 3);
        assert.equal(array.firstInsertionIndexOf(2, 4), 4);
        assert.equal(array.firstInsertionIndexOf(0, 2, 4), 2);
    });
    canary.test("lastInsertionIndexOf", function(){
        const array = new SortedArray([1, 1, 2, 2, 2, 3]);
        assert.equal(array.lastInsertionIndexOf(0), 0);
        assert.equal(array.lastInsertionIndexOf(2), 5);
        assert.equal(array.lastInsertionIndexOf(3), 6);
        assert.equal(array.lastInsertionIndexOf(4), 6);
        assert.equal(array.lastInsertionIndexOf(2, 0, 4), 4);
        assert.equal(array.lastInsertionIndexOf(2, 0, 3), 3);
        assert.equal(array.lastInsertionIndexOf(0, 2, 3), 2);
    });
    
    canary.test("length", function(){
        const array = new SortedArray([1, 2, 3]);
        assert.equal(array.length, 3);
        array.length = 4;
        assert.equal(array.length, 4);
        let count = 0;
        for(let element of array) count++;
        assert.equal(count, 4);
    });
    canary.test("indexing", function(){
        const array = new SortedArray([1, 2, 3]);
        assert.equal(array[0], 1);
        assert.equal(array[1], 2);
        assert.equal(array[2], 3);
        assert.equal(array[3], undefined);
        array[0] = 0;
        assertArray(array, [0, 2, 3]);
    });
    canary.test("species", function(){
        assert.equal(SortedArray[Symbol.species], SortedArray);
    });
    
    canary.test("concat", function(){
        const array = new SortedArray([1, 2, 3]);
        const concat = array.concat([10, 9, 8]);
        assert(!(concat instanceof SortedArray));
        assert.deepEqual(concat, [1, 2, 3, 10, 9, 8]);
    });
    canary.test("copyWithin", function(){
        // Should not normally be used!
        const array = new SortedArray([1, 2, 3, 4]);
        assert.equal(array.copyWithin(0, 1, 2), array);
        assertArray(array, [2, 2, 3, 4]);
    });
    canary.test("entries", function(){
        const array = new SortedArray([0, 1, 2]);
        let count = 0;
        for(let entry of array.entries()){
            assert.equal(entry[0], count);
            assert.equal(entry[1], entry[0]);
            count++;
        }
        assert.equal(count, 3);
    });
    canary.test("every", function(){
        const array = new SortedArray([0, 1, 2]);
        assert.equal(array.every(n => n < 3), true);
        assert.equal(array.every(n => n === 0), false);
    });
    canary.test("fill", function(){
        // Should not normally be used!
        const array = new SortedArray([0, 1, 2]);
        array.fill(0);
        assertArray(array, [0, 0, 0]);
    });
    canary.test("filter", function(){
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
    });
    canary.test("find", function(){
        const array = new SortedArray([1, 2, 3, 4]);
        assert.equal(2, array.find(n => n % 2 === 0));
        assert.equal(undefined, array.find(n => n < 0));
    });
    canary.test("findIndex", function(){
        const array = new SortedArray([1, 2, 3, 4]);
        assert.equal(1, array.findIndex(n => n % 2 === 0));
        assert.equal(-1, array.findIndex(n => n < 0));
    });
    canary.test("flat", function(){
        const array = new SortedArray([[1, 2], [3, 4]]);
        const flat = array.flat();
        assert(!(flat instanceof SortedArray));
        assert.deepEqual(flat, [1, 2, 3, 4]);
    });
    canary.test("flatMap", function(){
        const array = new SortedArray([1, 2, 3]);
        const flat = array.flatMap(n => [n, n]);
        assert(!(flat instanceof SortedArray));
        assert.deepEqual(flat, [1, 1, 2, 2, 3, 3]);
    });
    canary.test("forEach", function(){
        const array = new SortedArray([0, 1, 2, 3]);
        let count = 0;
        array.forEach((n, i, a) => {
            assert.equal(n, i);
            assert.equal(a, array);
            count++;
        });
        assert.equal(count, 4);
    });
    canary.test("join", function(){
        const array = new SortedArray([1, 2, 3]);
        assert.equal(array.join(","), "1,2,3");
    });
    canary.test("keys", function(){
        const array = new SortedArray([0, 1, 2]);
        let count = 0;
        for(let key of array.keys()){
            assert.equal(key, count);
            count++;
        }
        assert.equal(count, 3);
    });
    canary.test("map", function(){
        const array = new SortedArray([1, 2, 3, 4]);
        const bits = array.map(n => n % 2);
        assert(!(bits instanceof SortedArray));
        assert.deepEqual(bits, [1, 0, 1, 0]);
    });
    canary.test("pop", function(){
        const array = new SortedArray([1, 2, 3]);
        assert.equal(array.pop(), 3);
        assert.equal(array.pop(), 2);
        assert.equal(array.pop(), 1);
        assert.equal(array.pop(), undefined);
        assert.equal(array.length, 0);
    });
    canary.test("push", function(){
        const array = new SortedArray([1, 2, 3]);
        assert.equal(array.push(4, 5, 6), 6);
        assertArray(array, [1, 2, 3, 4, 5, 6]);
    });
    canary.test("reduce", function(){
        const array = new SortedArray(["a", "b", "c"]);
        assert.equal(array.reduce((acc, next) => acc + next), "abc");
    });
    canary.test("reduceRight", function(){
        const array = new SortedArray(["a", "b", "c"]);
        assert.equal(array.reduceRight((acc, next) => acc + next), "cba");
    });
    canary.test("reverse", function(){
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
    canary.test("shift", function(){
        const array = new SortedArray([1, 2, 3]);
        assert.equal(array.shift(), 1);
        assert.equal(array.shift(), 2);
        assert.equal(array.shift(), 3);
        assert.equal(array.shift(), undefined);
        assert.equal(array.length, 0);
    });
    canary.test("slice", function(){
        const array = new SortedArray([4, 3, 2, 1], (a, b) => b - a);
        const slice = array.slice(1, 3);
        assert(slice instanceof SortedArray);
        assertArray(slice, [3, 2]);
        slice.insert(6);
        assertArray(slice, [6, 3, 2]);
    });
    canary.test("some", function(){
        const array = new SortedArray([1, 2, 3, 4]);
        assert.equal(array.some(n => n === 2), true);
        assert.equal(array.some(n => n > 4), false);
    });
    canary.test("sort", function(){
        const array = new SortedArray([1, 2, 3, 4, 5]);
        array.sort((a, b) => b - a);
        assertArray(array, [5, 4, 3, 2, 1]);
        array.insert(6);
        assertArray(array, [6, 5, 4, 3, 2, 1]);
    });
    canary.test("splice", function(){
        const array = new SortedArray([4, 3, 2, 1], (a, b) => b - a);
        const splice = array.splice(1, 2);
        assert(splice instanceof SortedArray);
        assertArray(splice, [3, 2]);
        splice.insert(6);
        assertArray(splice, [6, 3, 2]);
    });
    canary.test("toLocaleString", function(){
        const array = new SortedArray([1, 2, 3]);
        assert.equal(array.toLocaleString("en"), "1,2,3");
    });
    canary.test("toString", function(){
        const array = new SortedArray([1, 2, 3]);
        assert.equal(array.toString(), "1,2,3");
    });
    canary.test("unshift", function(){
        const array = new SortedArray([1, 2, 3]);
        assert.equal(array.unshift(0), 4);
        assertArray(array, [0, 1, 2, 3]);
    });
    canary.test("values", function(){
        const array = new SortedArray([0, 1, 2]);
        let count = 0;
        for(let value of array.values()){
            assert.equal(value, count);
            count++;
        }
        assert.equal(count, 3);
    });
    
    canary.test("valueOf", function(){
        const array = new SortedArray([3, 1, 2]);
        assert.equal(array.valueOf(), array);
    });
    canary.test("JSON.stringify", function(){
        const array = new SortedArray([3, 1, 2]);
        assert.equal(JSON.stringify(array), "[1,2,3]");
    });
    canary.test("isArray", function(){
        const array = new SortedArray([3, 1, 2]);
        assert.equal(true, Array.isArray(array));
    });
    
    return canary;
}

testSortedArray(require("./index")).doReport();
