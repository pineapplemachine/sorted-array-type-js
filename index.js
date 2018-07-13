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
    constructor(values, comparator){
        let useComparator = comparator || DefaultComparator;
        let useReversedComparator = null;
        if(typeof(useComparator) !== "function"){
            // Verify comparator input
            throw new TypeError("Comparator must be a function.");
        }
        // new SortedArray(length, cmp?) - needed by some inherited methods
        if(Number.isInteger(values) && values >= 0){
            super(values);
        // new SortedArray(SortedArray, cmp?) - same or unspecified comparator
        }else if(values instanceof SortedArray && (
            !comparator || values.comparator === useComparator
        )){
            super();
            super.push(...values);
            useComparator = values.comparator;
            useReversedComparator = values.reversedComparator;
        // new SortedArray(Array, cmp?)
        }else if(Array.isArray(values)){
            super();
            super.push(...values);
            super.sort(useComparator);
        // new SortedArray(iterable, cmp?)
        }else if(values && typeof(values[Symbol.iterator]) === "function"){
            super();
            for(let value of values) super.push(value);
            super.sort(useComparator);
        // new SortedArray(comparator)
        }else if(typeof(values) === "function" && arguments.length === 1){
            super();
            useComparator = values;
        // new SortedArray(object with length, cmp?) - support e.g. `arguments`
        }else if(values && typeof(values) === "object" &&
            Number.isFinite(values.length)
        ){
            super();
            for(let i = 0; i < values.length; i++) super.push(values[i]);
            super.sort(useComparator);
        // new SortedArray(???)
        }else if(values){
            throw new TypeError("Unhandled input type. Expected an iterable.");
        // new SortedArray()
        }else{
            super();
        }
        this.comparator = useComparator;
        this.reversedComparator = useReversedComparator;
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
    static from(values, comparator){
        return new SortedArray(values, comparator);
    }
    // Construct a SortedArray from assumed-sorted values.
    static fromSorted(values, comparator){
        const array = new SortedArray(null, comparator);
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
        if(!values || !typeof(values[Symbol.iterator]) === "function"){
            throw new TypeError("Expected an iterable list of values.");
        }
        if(values.length === 0){
            return;
        }
        let index = 0;
        for(let value of values){
            index = this.lastInsertionIndexOf(value, index);
            this.splice(index++, 0, value);
        }
    }
    // Remove the first exactly matching value,
    // as determined by sameValueZero.
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
    // there is no equal element. Uses SameValueZero.
    indexOf(value, fromIndex){
        let index = this.firstInsertionIndexOf(value, fromIndex);
        if(index >= 0 && index < this.length && (this[index] === value ||
            (value !== value && this[index] !== this[index])
        )){
            return index;
        }
        while(++index < this.length &&
            this.comparator(value, this[index]) === 0
        ){
            if(this[index] === value || 
                (value !== value && this[index] !== this[index])
            ){
                return index;
            }
        }
        return -1;
    }
    // Returns the index of the last equal element, or -1 if
    // there is no equal element. Uses SameValueZero.
    lastIndexOf(value, fromIndex){
        let index = this.lastInsertionIndexOf(value, 0, fromIndex);
        if(index >= 0 && index < this.length && (this[index] === value ||
            (value !== value && this[index] !== this[index])
        )){
            return index;
        }
        while(--index >= 0 &&
            this.comparator(value, this[index]) === 0
        ){
            if(this[index] === value || 
                (value !== value && this[index] !== this[index])
            ){
                return index;
            }
        }
        return -1;
    }
    
    // Returns true when the value is contained within the
    // array, as determined by SameValueZero.
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
