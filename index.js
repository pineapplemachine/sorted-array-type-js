// Default value equality comparison
const SameValueZero = ((a, b) => (
    a === b || (a !== a && b !== b)
));

// Comparator function used by SortedArray when none is passed explicitly
const DefaultComparator = ((a, b) => (
    a < b ? -1 : (a > b ? +1 : 0)
));

// Array type with sorted insertion methods and optimized
// implementations of some Array methods.
// SortedArray does not stop you from pushing, shifting,
// splicing, or assigning values at an index.
// However, if these things are not done judiciously, then
// the array will no longer be sorted and its methods will
// no longer function correctly.
class SortedArray extends Array{
    // Construct a new SortedArray. Uses Array.sort to sort
    // the input collection, if any; the sort may be unstable.
    constructor(){
        let values = null;
        let valuesEqual = null;
        let comparator = null;
        let reversedComparator = null;
        // new SortedArray(comparator)
        if(arguments.length === 1 &&
            typeof(arguments[0]) === "function"
        ){
            comparator = arguments[0];
        // new SortedArray(comparator, valuesEqual)
        }else if(arguments.length === 2 &&
            typeof(arguments[0]) === "function" &&
            typeof(arguments[1]) === "function"
        ){
            comparator = arguments[0];
            valuesEqual = arguments[1];
        // new SortedArray(values, comparator?, valuesEqual?)
        }else{
            values = arguments[0];
            comparator = arguments[1];
            valuesEqual = arguments[2];
        }
        if(comparator && typeof(comparator) !== "function"){
            // Verify comparator input
            throw new TypeError("Comparator argument must be a function.");
        }
        if(valuesEqual && typeof(valuesEqual) !== "function"){
            // Verify comparator input
            throw new TypeError("Value equality argument must be a function.");
        }
        // new SortedArray(length, cmp?, eq?) - needed by some inherited methods
        if(typeof(values) === "number"){
            if(!Number.isInteger(values) || values < 0){
                throw new RangeError("Invalid array length");
            }
            super(values);
        // new SortedArray(SortedArray, cmp?, eq?) - same or unspecified comparator
        }else if(values instanceof SortedArray && (
            !comparator || values.comparator === comparator
        )){
            super();
            super.push(...values);
            comparator = values.comparator;
            reversedComparator = values.reversedComparator;
            if(!valuesEqual) valuesEqual = values.valuesEqual;
        // new SortedArray(Array, cmp?, eq?)
        }else if(Array.isArray(values)){
            super();
            super.push(...values);
            super.sort(comparator || DefaultComparator);
            if(values instanceof SortedArray && !valuesEqual){
                valuesEqual = values.valuesEqual;
            }
        // new SortedArray(iterable, cmp?, eq?)
        }else if(values && typeof(values[Symbol.iterator]) === "function"){
            super();
            for(let value of values) super.push(value);
            super.sort(comparator || DefaultComparator);
        // new SortedArray(object with length, cmp?, eq?) - e.g. `arguments`
        }else if(values && typeof(values) === "object" &&
            Number.isFinite(values.length)
        ){
            super();
            for(let i = 0; i < values.length; i++) super.push(values[i]);
            super.sort(comparator || DefaultComparator);
        // new SortedArray()
        // new SortedArray(comparator)
        // new SortedArray(comparator, valuesEqual)
        }else if(!values){
            super();
        // new SortedArray(???)
        }else{
            throw new TypeError(
                "Unhandled values input type. Expected an iterable."
            );
        }
        this.valuesEqual = valuesEqual || SameValueZero;
        this.comparator = comparator || DefaultComparator;
        this.reversedComparator = reversedComparator;
    }
    // Construct a SortedArray with elements given as arguments.
    static of(...values){
        return new SortedArray(values);
    }
    // Construct a SortedArray from assumed-sorted arguments.
    static ofSorted(...values){
        const array = new SortedArray();
        Array.prototype.push.apply(array, values);
        return array;
    }
    // Construct a SortedArray from the given inputs.
    static from(values, comparator, valuesEqual){
        return new SortedArray(values, comparator, valuesEqual);
    }
    // Construct a SortedArray from assumed-sorted values.
    static fromSorted(values, comparator, valuesEqual){
        const array = new SortedArray(null, comparator, valuesEqual);
        if(Array.isArray(values)){
            Array.prototype.push.apply(array, values);
        }else{
            for(let value of values) Array.prototype.push.call(array, value);
        }
        return array;
    }
    
    /// SortedArray methods
    
    // Insert a value into the list.
    insert(value){
        const index = this.lastInsertionIndexOf(value);
        this.splice(index, 0, value);
        return this.length;
    }
    // Insert an iterable of assumed-sorted values into the list
    // This will typically be faster than calling `insert` in a loop.
    insertSorted(values){
        // Optimized implementation for arrays and array-like objects
        if(values && typeof(values) === "object" &&
            Number.isFinite(values.length)
        ){
            // Exit immediately if the values array is empty
            if(values.length === 0){
                return this.length;
            }
            // If the last element in the input precedes the first element
            // in the array, the input can be prepended in one go.
            const lastInsertionIndex = this.lastInsertionIndexOf(
                values[values.length - 1]
            );
            if(lastInsertionIndex === 0){
                this.unshift(...values);
                return this.length;
            }
            // If the first element would go in the same place in the array
            // as the last element, then it can be spliced in all at once.
            const firstInsertionIndex =  this.lastInsertionIndexOf(values[0]);
            if(firstInsertionIndex === lastInsertionIndex){
                this.splice(firstInsertionIndex, 0, ...values);
                return this.length;
            }
            // Array contents must be interlaced
            let insertIndex = 0;
            for(let valIndex = 0; valIndex < values.length; valIndex++){
                const value = values[valIndex];
                insertIndex = this.lastInsertionIndexOf(value, insertIndex);
                // If this element was at the end of the array, then every other
                // element of the input is too and they can be appended at once.
                if(insertIndex === this.length && valIndex < values.length - 1){
                    this.push(...values.slice(valIndex));
                    return this.length;
                }else{
                    this.splice(insertIndex++, 0, value);
                }
            }
            return this.length;
        // Generalized implementation for any iterable
        }else if(values && typeof(values[Symbol.iterator]) === "function"){
            let insertIndex = 0;
            for(let value of values){
                insertIndex = this.lastInsertionIndexOf(value, insertIndex);
                this.splice(insertIndex++, 0, value);
            }
            return this.length;
        // Produce an error if the input isn't an acceptable type.
        }else{
            throw new TypeError("Expected an iterable list of values.");
        }
    }
    // Remove the first matching value.
    // Returns true if a matching element was found and removed,
    // or false if no matching element was found.
    remove(value){
        const index = this.indexOf(value);
        if(index >= 0){
            this.splice(index, 1);
            return true;
        }else{
            return false;
        }
    }
    // Remove the last matching value.
    // Returns true if a matching element was found and removed,
    // or false if no matching element was found.
    removeLast(value){
        const index = this.lastIndexOf(value);
        if(index >= 0){
            this.splice(index, 1);
            return true;
        }else{
            return false;
        }
    }
    
    // Returns the index of the first equal element,
    // or the index that such an element should
    // be inserted at if there is no equal element.
    firstInsertionIndexOf(value, fromIndex, endIndex){
        const from = (typeof(fromIndex) !== "number" || fromIndex !== fromIndex ?
            0 : (fromIndex < 0 ? Math.max(0, this.length + fromIndex) : fromIndex)
        );
        const end = (typeof(endIndex) !== "number" || endIndex !== endIndex ?
            this.length : (endIndex < 0 ? this.length + endIndex :
                Math.min(this.length, endIndex)
            )
        );
        let min = from - 1;
        let max = end;
        while(1 + min < max){
            const mid = min + Math.floor((max - min) / 2);
            const cmp = this.comparator(value, this[mid]);
            if(cmp > 0) min = mid;
            else max = mid;
        }
        return max;
    }
    // Returns the index of the last equal element,
    // or the index that such an element should
    // be inserted at if there is no equal element.
    lastInsertionIndexOf(value, fromIndex, endIndex){
        const from = (typeof(fromIndex) !== "number" || fromIndex !== fromIndex ?
            0 : (fromIndex < 0 ? Math.max(0, this.length + fromIndex) : fromIndex)
        );
        const end = (typeof(endIndex) !== "number" || endIndex !== endIndex ?
            this.length : (endIndex < 0 ? this.length + endIndex :
                Math.min(this.length, endIndex)
            )
        );
        let min = from - 1;
        let max = end;
        while(1 + min < max){
            const mid = min + Math.floor((max - min) / 2);
            const cmp = this.comparator(value, this[mid]);
            if(cmp >= 0) min = mid;
            else max = mid;
        }
        return max;
    }
    // Returns the index of the first equal element, or -1 if
    // there is no equal element.
    indexOf(value, fromIndex){
        let index = this.firstInsertionIndexOf(value, fromIndex);
        if(index >= 0 && index < this.length &&
            this.valuesEqual(this[index], value)
        ){
            return index;
        }
        while(++index < this.length &&
            this.comparator(value, this[index]) === 0
        ){
            if(this.valuesEqual(this[index], value)) return index;
        }
        return -1;
    }
    // Returns the index of the last equal element, or -1 if
    // there is no equal element.
    lastIndexOf(value, fromIndex){
        let index = this.lastInsertionIndexOf(value, 0, fromIndex);
        if(index >= 0 && index < this.length &&
            this.valuesEqual(this[index], value)
        ){
            return index;
        }
        while(--index >= 0 &&
            this.comparator(value, this[index]) === 0
        ){
            if(this.valuesEqual(this[index], value)) return index;
        }
        return -1;
    }
    
    // Returns true when the value is contained within the
    // array, and false when not.
    includes(value, fromIndex){
        return this.indexOf(value, fromIndex) >= 0;
    }
    // Get a copy of this list containing only those elements
    // which satisfy a predicate function.
    // The output is also a SortedArray.
    filter(predicate){
        if(typeof(predicate) !== "function"){
            throw new TypeError("Predicate must be a function.");
        }
        const array = new SortedArray(null, this.comparator);
        array.reversedComparator = this.reversedComparator;
        for(let element of this){
            if(predicate(element)) Array.prototype.push.call(array, element);
        }
        return array;
    }
    // Reverse the list. This method also inverts the comparator
    // function, meaning later insertions respect the new order.
    reverse(){
        super.reverse();
        if(this.reversedComparator){
            const t = this.comparator;
            this.comparator = this.reversedComparator;
            this.reversedComparator = t;
        }else{
            const t = this.comparator;
            this.reversedComparator = this.comparator;
            this.comparator = (a, b) => t(b, a);
        }
    }
    // Get a slice out of the array. Returns a SortedArray.
    slice(){
        const slice = Array.prototype.slice.apply(this, arguments);
        slice.valuesEqual = this.valuesEqual;
        slice.comparator = this.comparator;
        slice.reversedComparator = this.reversedComparator;
        return slice;
    }
    // Changes the array's comparator and re-sorts its contents.
    // Uses Array.sort, which may be unstable.
    sort(comparator){
        comparator = comparator || DefaultComparator;
        if(comparator === this.comparator) return;
        this.comparator = comparator;
        this.reversedComparator = null;
        super.sort(comparator);
    }
    // Remove and/or insert elements in the array.
    splice(){
        const splice = Array.prototype.splice.apply(this, arguments);
        splice.valuesEqual = this.valuesEqual;
        splice.comparator = this.comparator;
        splice.reversedComparator = this.reversedComparator;
        return splice;
    }
    
    // Can these be done in a less hacky way?
    concat(){
        this.constructor = Array;
        const array = Array.prototype.concat.apply(this, arguments);
        this.constructor = SortedArray;
        return array;
    }
    flat(){
        this.constructor = Array;
        const array = Array.prototype.flat.apply(this, arguments);
        this.constructor = SortedArray;
        return array;
    }
    flatMap(){
        this.constructor = Array;
        const array = Array.prototype.flatMap.apply(this, arguments);
        this.constructor = SortedArray;
        return array;
    }
    map(){
        this.constructor = Array;
        const array = Array.prototype.map.apply(this, arguments);
        this.constructor = SortedArray;
        return array;
    }
}

module.exports = SortedArray;
