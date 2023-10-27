/** See {@link SortedArray.EqualityFunction}. */
export type SortedArrayEqualityFunction<T> = (a: T, b: T) => unknown;

/** See {@link SortedArray.ComparatorFunction}. */
export type SortedArrayComparatorFunction<T> = (a: T, b: T) => number;

/** See {@link SortedArray.DefaultEqualityFunction}. */
export const SortedArrayDefaultEqualityFunction: SortedArrayEqualityFunction<unknown> = (
    (a: unknown, b: unknown) => (a === b || (a !== a && b !== b))
);

/** See {@link SortedArray.DefaultComparatorFunction}. */
export const SortedArrayDefaultComparatorFunction: SortedArrayComparatorFunction<unknown> = (
    (a: any, b: any) => (a < b ? -1 : (a > b ? +1 : 0))
);

/** See {@link SortedArray.ElementCallback}. */
export type SortedArrayElementCallback<This, T, U> = (
    (this: This, value: T, index: number, array: SortedArray<T>) => U
);

/**
 * Check if a value is iterable.
 * @private
 */
function isIterable<T>(value: unknown): value is Iterable<T> {
    return !!(value && typeof(value) === "object" && (
        typeof((<any> value)[Symbol.iterator]) === "function"
    ));
}

/**
 * Check if a value satisfies the ArrayLike interface.
 * @private
 */
function isArrayLike<T>(value: unknown): value is ArrayLike<T> {
    if(value && typeof(value) === "object" &&
        Number.isFinite(typeof((<any> value).length))
    ) {
        try {
            (<any> value)[0];
            return true;
        }
        catch(error) {
            return false;
        }
    }
    else {
        return false;
    }
}

// TODO: remove
export type IterableArrayLike<T> = Iterable<T> & ArrayLike<T>;
function isIterableArrayLike<T>(value: unknown): value is IterableArrayLike<T> {
    return isArrayLike<T>(value) && (
        typeof((<any> value)[Symbol.iterator]) === "function"
    );
}

/**
 * The SortedArray type is a subclass of the base JavaScript Array
 * type whose elements are kept in a sorted order.
 * 
 * Methods like {@link SortedArray.insert} are provided as an
 * alternative to the typical array `push` method for inserting
 * new elements in sorted order.
 * 
 * Some methods, such as {@link SortedArray.indexOf} provide
 * optimized implementations of Array methods, which may operate
 * more efficiently upon sorted lists.
 * 
 * **Warning:** The SortedArray type does not stop you
 * from still calling methods like `push`, `shift`, or `splice`,
 * which may invalidate the assumptions that SortedArray methods
 * make about array contents being correctly sorted.
 * These methods should be used with care, if they are used at all.
 * Invalidating the sort order of a SortedArray will cause many
 * operations to behave in unexpected ways.
 */
export class SortedArray<T> extends Array<T> {
    /** Equality function used by the SortedArray. */
    equalityFunc: SortedArrayEqualityFunction<T>;
    /** Comparator function used by the SortedArray. */
    compareFunc: SortedArrayComparatorFunction<T>;
    /** May refer to a reversed version of the SortedArray's comparator function. */
    reversedCompareFunc: SortedArrayComparatorFunction<T> | undefined;
    
    /**
     * Construct a new empty SortedArray, using the default comparator
     * and equality functions.
     */
    constructor();
    /**
     * Construct a new SortedArray with the given length.
     */
    constructor(length: number);
    /**
     * Construct a new empty SortedArray, optionally specifying a
     * custom comparator function or a custom equality function.
     * 
     * The SortedArray implementation assumes that any values `a` and `b`
     * for which `equalityFunc(a, b) === true`,
     * it is also the case that `compareFunc(a, b) === 0`.
     * 
     * @param compareFunc A custom comparator function, to use instead of
     * {@link SortedArray.DefaultComparatorFunction}.
     * The comparator function determines the sort order of items in
     * the array.
     * @param equalityFunc A custom equality function, to use instead of
     * {@link SortedArray.DefaultEqualityFunction}.
     */
    constructor(
        compareFunc?: SortedArrayComparatorFunction<T>,
        equalityFunc?: SortedArrayEqualityFunction<T>,
    );
    /**
     * Construct a new SortedArray from the given items, which will
     * be sorted using the Array `sort` function.
     * [(This is not guaranteed to be stable in all cases.)]
     * (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#sort_stability)
     * 
     * The SortedArray implementation assumes that any values `a` and `b`
     * for which `equalityFunc(a, b) === true`,
     * it is also the case that `compareFunc(a, b) === 0`.
     * 
     * @param items An iterable of items to initially insert into the
     * constructed SortedArray.
     * @param compareFunc A custom comparator function, to use instead of
     * {@link SortedArray.DefaultComparatorFunction}.
     * The comparator function determines the sort order of items in
     * the array.
     * @param equalityFunc A custom equality function, to use instead of
     * {@link SortedArray.DefaultEqualityFunction}.
     */
    constructor(
        items: Iterable<T> | ArrayLike<T>,
        compareFunc?: SortedArrayComparatorFunction<T>,
        equalityFunc?: SortedArrayEqualityFunction<T>,
    );
    
    constructor() {
        let values = undefined;
        let equalityFunc = undefined;
        let compareFunc = undefined;
        let reversedCompareFunc = undefined;
        // new SortedArray(compareFunc)
        if(arguments.length === 1 &&
            typeof(arguments[0]) === "function"
        ) {
            compareFunc = arguments[0];
        }
        // new SortedArray(compareFunc, equalityFunc)
        else if(arguments.length === 2 &&
            typeof(arguments[0]) === "function" &&
            typeof(arguments[1]) === "function"
        ) {
            compareFunc = arguments[0];
            equalityFunc = arguments[1];
        }
        // new SortedArray(values, compareFunc?, equalityFunc?)
        else {
            values = arguments[0];
            compareFunc = arguments[1];
            equalityFunc = arguments[2];
        }
        if(compareFunc && typeof(compareFunc) !== "function") {
            throw new TypeError("Comparator argument is not a function.");
        }
        if(equalityFunc && typeof(equalityFunc) !== "function") {
            throw new TypeError("Equality argument is not a function.");
        }
        // new SortedArray(length, cmp?, eq?) - needed by some inherited methods
        if(typeof(values) === "number") {
            if(!Number.isInteger(values) || values < 0) {
                throw new RangeError("Invalid array length.");
            }
            super(values);
        }
        // new SortedArray(SortedArray, cmp?, eq?) - same or unspecified compareFunc
        else if(values instanceof SortedArray && (
            !compareFunc || values.compareFunc === compareFunc
        )) {
            super();
            super.push(...values);
            compareFunc = values.compareFunc;
            reversedCompareFunc = values.reversedCompareFunc;
            if(!equalityFunc) {
                equalityFunc = values.equalityFunc;
            }
        }
        // new SortedArray(Array, cmp?, eq?)
        else if(Array.isArray(values)) {
            super();
            super.push(...values);
            super.sort(compareFunc || SortedArrayDefaultComparatorFunction);
            if(values instanceof SortedArray && !equalityFunc) {
                equalityFunc = values.equalityFunc;
            }
        }
        // new SortedArray(iterable, cmp?, eq?)
        else if(values && typeof(values[Symbol.iterator]) === "function") {
            super();
            for(let value of values) {
                super.push(value);
            }
            super.sort(compareFunc || SortedArrayDefaultComparatorFunction);
        }
        // new SortedArray(object with length, cmp?, eq?) - e.g. `arguments`
        // TODO: ?
        else if(values && typeof(values) === "object" &&
            Number.isFinite(values.length)
        ) {
            super();
            for(let i: number = 0; i < values.length; i++) {
                super.push(values[i]);
            }
            super.sort(compareFunc || SortedArrayDefaultComparatorFunction);
        // new SortedArray()
        // new SortedArray(compareFunc)
        // new SortedArray(compareFunc, equalityFunc)
        }
        else if(!values) {
            super();
        }
        // new SortedArray(???)
        else {
            throw new TypeError("Values argument is not iterable or array-like.");
        }
        this.equalityFunc = equalityFunc || SortedArrayDefaultEqualityFunction;
        this.compareFunc = compareFunc || SortedArrayDefaultComparatorFunction;
        this.reversedCompareFunc = reversedCompareFunc;
    }
    
    /**
     * Construct a new SortedArray and insert the given values.
     * 
     * @param values The values that should be inserted and sorted in
     * the newly constructed SortedArray.
     * 
     * @returns the newly constructed SortedArray, containing the given
     * values in sorted order.
     */
    static of<T>(...values: T[]): SortedArray<T> {
        return new SortedArray<T>(values);
    }
    
    /**
     * Construct a new SortedArray, initializing it with some values
     * that are already provided in sorted order.
     * 
     * @param values The values that should be inserted in the newly
     * constructed SortedArray. They must be sorted according to
     * {@link SortedArray.DefaultComparatorFunction}, otherwise the
     * returned SortedArray may behave unexpectedly.
     * 
     * @returns the newly constructed SortedArray, containing the given
     * assumed-sorted values.
     */
    static ofSorted<T>(...values: T[]): SortedArray<T> {
        const array = new SortedArray<T>();
        Array.prototype.push.apply(array, values); // TODO: array.push?
        return array;
    }
    
    /**
     * Construct a new SortedArray and insert the values in an iterable
     * or array-like object.
     * 
     * @param values The values that should be inserted and sorted in
     * the newly constructed SortedArray.
     * @param compareFunc A custom comparator function, to use instead of
     * {@link SortedArray.DefaultComparatorFunction}.
     * @param equalityFunc A custom equality function, to use instead of
     * {@link SortedArray.DefaultEqualityFunction}.
     * 
     * @returns the newly constructed SortedArray, containing the given
     * values in sorted order.
     */
    static from<T>(
        values: Iterable<T> | ArrayLike<T>,
        compareFunc?: SortedArrayComparatorFunction<T>,
        equalityFunc?: SortedArrayEqualityFunction<T>,
    ): SortedArray<T> {
        return new SortedArray<T>(values, compareFunc, equalityFunc);
    }
    
    /**
     * Construct a new SortedArray, initializing it with some values
     * in an iterable or array-like object that are already provided
     * in sorted order.
     * 
     * @param values The values that should be inserted in the newly
     * constructed SortedArray. They must be sorted according to
     * the used comparator function, otherwise the returned SortedArray
     * may behave unexpectedly.
     * @param compareFunc A custom comparator function, to use instead of
     * {@link SortedArray.DefaultComparatorFunction}.
     * @param equalityFunc A custom equality function, to use instead of
     * {@link SortedArray.DefaultEqualityFunction}.
     * 
     * @returns the newly constructed SortedArray, containing the given
     * assumed-sorted values.
     */
    static fromSorted<T>(
        values: Iterable<T> | ArrayLike<T>,
        compareFunc?: SortedArrayComparatorFunction<T>,
        equalityFunc?: SortedArrayEqualityFunction<T>,
    ): SortedArray<T> {
        const array = new SortedArray<T>(compareFunc, equalityFunc);
        if(Array.isArray(values)) {
            Array.prototype.push.apply(array, values);
        }
        else if(isIterable<T>(values)) {
            for(let value of values) {
                Array.prototype.push.call(array, value);
            }
        }
        else {
            for(let i: number = 0; i < values.length; i++) {
                Array.prototype.push.call(array, values[i]);
            }
        }
        return array;
    }
    
    /**
     * Insert a value into the array, maintaining sort order.
     * 
     * @param value The value to insert into the array.
     * 
     * @returns the new length of the array.
     */
    insert(value: T): number {
        const index = this.lastInsertionIndexOf(value);
        this.splice(index, 0, value);
        return this.length;
    }
    
    /**
     * Insert an iterable of assumed-sorted values into the array.
     * 
     * This should typically be more efficient than calling
     * {@link SortedArray.insert} in a loop.
     * 
     * @param values An iterable of values to be sorted into the
     * array, which are already sorted according to this SortedArray's
     * same comparator.
     * 
     * @returns The new length of the array.
     * 
     * @throws TypeError if the input was not iterable.
     */
    insertSorted(values: Iterable<T> | ArrayLike<T>): number {
        // Optimized implementation for arrays and iterable array-like objects
        if(isArrayLike<T>(values)) {
            // Exit immediately if the values array is empty
            if(values.length === 0) {
                return this.length;
            }
            // If the last element in the input precedes the first element
            // in the array, the input can be prepended in one go.
            const lastInsertionIndex = this.lastInsertionIndexOf(
                values[values.length - 1]
            );
            if(lastInsertionIndex === 0) {
                if(isIterable<T>(values)) {
                    Array.prototype.unshift.call(this, ...values);
                }
                else {
                    Array.prototype.unshift.apply(
                        this, new Array(values.length)
                    );
                    for(let i: number = 0; i < values.length; i++) {
                        this[i] = values[i];
                    }
                }
                return this.length;
            }
            // If the first element would go in the same place in the array
            // as the last element, then it can be spliced in all at once.
            const firstInsertionIndex =  this.lastInsertionIndexOf(values[0]);
            if(firstInsertionIndex === lastInsertionIndex) {
                if(isIterable<T>(values)) {
                    Array.prototype.splice.call(
                        this, firstInsertionIndex, 0, ...values
                    );
                }
                else {
                    Array.prototype.splice.call(
                        this, firstInsertionIndex, 0, new Array(values.length)
                    );
                    for(let i: number = 0; i < values.length; i++) {
                        this[i + firstInsertionIndex] = values[i];
                    }
                }
                return this.length;
            }
            // Array contents must be interlaced
            let insertIndex = 0;
            for(let valIndex = 0; valIndex < values.length; valIndex++) {
                const value = values[valIndex];
                insertIndex = this.lastInsertionIndexOf(value, insertIndex);
                // If this element was at the end of the array, then every other
                // element of the input is too and they can be appended at once.
                if(insertIndex === this.length && valIndex < values.length - 1) {
                    if(Array.isArray(values)) {
                        this.push(...values.slice(valIndex));
                    }
                    else {
                        for(let i: number = valIndex; i < values.length; i++) {
                            this.push(values[i]);
                        }
                    }
                    return this.length;
                }
                else {
                    this.splice(insertIndex++, 0, value);
                }
            }
            return this.length;
        }
        // Generalized implementation for any iterable
        else if(isIterable<T>(values)) {
            let insertIndex = 0;
            for(let value of values) {
                insertIndex = this.lastInsertionIndexOf(value, insertIndex);
                this.splice(insertIndex++, 0, value);
            }
            return this.length;
        }
        // Produce an error if the input isn't an acceptable type.
        else {
            throw new TypeError("Values argument is not iterable or array-like.");
        }
    }
    
    /**
     * Remove the first equal value from the array.
     * 
     * Equality is determined using the SortedArray's equality function,
     * which is {@link SortedArray.DefaultEqualityFunction} when not
     * otherwise specified.
     * 
     * @param value Remove the first item in the array that is equal
     * to this input value.
     * 
     * @returns `true` if a matching element was found and removed,
     * or `false` if no matching element was found.
     */
    remove(value: T): boolean {
        const index = this.indexOf(value);
        if(index >= 0) {
            super.splice(index, 1);
            return true;
        }
        else {
            return false;
        }
    }
    
    /**
     * Remove the last equal value from the array.
     * 
     * Equality is determined using the SortedArray's equality function,
     * which is {@link SortedArray.DefaultEqualityFunction} when not
     * otherwise specified.
     * 
     * @param value Remove the last item in the array that is equal
     * to this input value.
     * 
     * @returns `true` if a matching element was found and removed,
     * or `false` if no matching element was found.
     */
    removeLast(value: T): boolean {
        const index = this.lastIndexOf(value);
        if(index >= 0) {
            super.splice(index, 1);
            return true;
        }
        else {
            return false;
        }
    }
    
    /**
     * Remove all equal values from the array.
     * 
     * Equality is determined using the SortedArray's equality function,
     * which is {@link SortedArray.DefaultEqualityFunction} when not
     * otherwise specified.
     * 
     * @param value Remove all items in the array that are equal
     * to this input value.
     * 
     * @returns the number of removed array items.
     */
    removeAll(value: T): number {
        let index = this.firstInsertionIndexOf(value);
        let removedCount: number = 0;
        while(index < this.length &&
            this.compareFunc(this[index], value) === 0
        ) {
            if(this.equalityFunc(this[index], value)) {
                removedCount++;
                super.splice(index, 1);
            }
            else {
                index++;
            }
        }
        return removedCount;
    }
    
    /**
     * Remove all equal values from the array and return those removed
     * values as a new SortedArray.
     * 
     * Equality is determined using the SortedArray's equality function,
     * which is {@link SortedArray.DefaultEqualityFunction} when not
     * otherwise specified.
     * 
     * @param value Remove the last item in the array that is equal
     * to this input value.
     * 
     * @returns the removed elements as a new SortedArray.
     */
    getRemoveAll(value: T): SortedArray<T> {
        let index = this.firstInsertionIndexOf(value);
        const removed = new SortedArray<T>(this.compareFunc, this.equalityFunc);
        removed.reversedCompareFunc = this.reversedCompareFunc;
        while(index < this.length &&
            this.compareFunc(this[index], value) === 0
        ) {
            if(this.equalityFunc(this[index], value)) {
                Array.prototype.push.call(removed, this[index]);
                super.splice(index, 1);
            }
            else {
                index++;
            }
        }
        return removed;
    }
    
    /**
     * Get all equal values in the array and return them as a new
     * SortedArray.
     * 
     * Equality is determined using the SortedArray's equality function,
     * which is {@link SortedArray.DefaultEqualityFunction} when not
     * otherwise specified.
     * 
     * @param value Return values in the array that are equal to this one.
     * 
     * @returns the equivalent elements as a new SortedArray.
     */
    getEqualValues(value: T): SortedArray<T> {
        let index = this.firstInsertionIndexOf(value);
        const equal = new SortedArray<T>(this.compareFunc, this.equalityFunc);
        equal.reversedCompareFunc = this.reversedCompareFunc;
        while(index < this.length &&
            this.compareFunc(this[index], value) === 0
        ) {
            if(this.equalityFunc(this[index], value)) {
                Array.prototype.push.call(equal, this[index]);
            }
            index++;
        }
        return equal;
    }
    
    /**
     * Returns the first index at which a new value could be inserted
     * into the array and maintain its sort order.
     * This index will be before any other values with an equivalent sort
     * order, if there are any such values in the array.
     * 
     * @param value The value to check for insertion index.
     * @param fromIndex Start comparing items at this index, inclusive.
     * Defaults to `0`, i.e. the beginning of the array.
     * @param endIndex Stop comparing items at this index, exclusive.
     * Defaults to the length of the array.
     * 
     * @returns The first valid insertion index for a new value.
     */
    firstInsertionIndexOf(
        value: T,
        fromIndex?: number,
        endIndex?: number,
    ): number {
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
        while(1 + min < max) {
            const mid = min + Math.floor((max - min) / 2);
            const cmp = this.compareFunc(value, this[mid]);
            if(cmp > 0) {
                min = mid;
            }
            else {
                max = mid;
            }
        }
        return max;
    }
    
    /**
     * Returns the last index at which a new value could be inserted
     * into the array and maintain its sort order.
     * This index will be after any other values with an equivalent sort
     * order, if there are any such values in the array.
     * 
     * @param value The value to check for insertion index.
     * @param fromIndex Start comparing items at this index, inclusive.
     * Defaults to `0`, i.e. the beginning of the array.
     * @param endIndex Stop comparing items at this index, exclusive.
     * Defaults to the length of the array.
     * 
     * @returns The last valid insertion index for a new value.
     */
    lastInsertionIndexOf(
        value: T,
        fromIndex?: number,
        endIndex?: number,
    ): number {
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
        while(1 + min < max) {
            const mid = min + Math.floor((max - min) / 2);
            const cmp = this.compareFunc(value, this[mid]);
            if(cmp >= 0) {
                min = mid;
            }
            else {
                max = mid;
            }
        }
        return max;
    }
    
    /**
     * Get the index of the first item in the array that is equal to
     * the given value, or `-1` if there is no equal item in the array.
     * 
     * Equality is determined using the SortedArray's equality function,
     * which is {@link SortedArray.DefaultEqualityFunction} when not
     * otherwise specified.
     * 
     * @param value Find the first index of a value in the array that
     * is equal to this one.
     * @param fromIndex Start looking for items at this index, inclusive.
     * Defaults to `0`, i.e. the beginning of the array.
     * 
     * @returns the index of the first equal item, or `-1` if no equal
     * item was found.
     */
    indexOf(value: T, fromIndex?: number): number {
        return this.indexOfRange(value, fromIndex);
    }
    
    /**
     * Get the index of the first item in the array that is equal to
     * the given value, or `-1` if there is no equal item in the array.
     * 
     * Equality is determined using the SortedArray's equality function,
     * which is {@link SortedArray.DefaultEqualityFunction} when not
     * otherwise specified.
     * 
     * @param value Find the first index of a value in the array that
     * is equal to this one.
     * @param fromIndex Start looking for items at this index, inclusive.
     * Defaults to `0`, i.e. the beginning of the array.
     * @param endIndex Stop looking for items at this index, exclusive.
     * Defaults to the length of the array.
     * 
     * @returns the index of the first equal item, or `-1` if no equal
     * item was found.
     */
    indexOfRange(value: T, fromIndex?: number, endIndex?: number): number {
        let index: number = this.firstInsertionIndexOf(
            value, fromIndex, endIndex
        );
        if(index >= 0 && index < this.length &&
            this.equalityFunc(this[index], value)
        ) {
            return index;
        }
        while(++index < this.length &&
            this.compareFunc(value, this[index]) === 0
        ) {
            if(this.equalityFunc(this[index], value)) {
                return index;
            }
        }
        return -1;
    }
    
    /**
     * Get the index of the last item in the array that is equal to
     * the given value, or `-1` if there is no equal item in the array.
     * 
     * Equality is determined using the SortedArray's equality function,
     * which is {@link SortedArray.DefaultEqualityFunction} when not
     * otherwise specified.
     * 
     * @param value Find the last index of a value in the array that
     * is equal to this one.
     * @param endIndex Stop looking for items at this index.
     * Defaults to the end of the array.
     * 
     * @returns the index of the last equal item, or `-1` if no equal
     * item was found.
     */
    lastIndexOf(value: T, endIndex?: number): number {
        // TODO: tests, endIndex handling might be off by one
        return this.lastIndexOfRange(value, 0, endIndex);
    }
    
    /**
     * Get the index of the last item in the array that is equal to
     * the given value, or `-1` if there is no equal item in the array.
     * 
     * Equality is determined using the SortedArray's equality function,
     * which is {@link SortedArray.DefaultEqualityFunction} when not
     * otherwise specified.
     * 
     * @param value Find the last index of a value in the array that
     * is equal to this one.
     * @param fromIndex Start looking for items at this index, inclusive.
     * Defaults to `0`, i.e. the beginning of the array.
     * @param endIndex Stop looking for items at this index, exclusive.
     * Defaults to the length of the array.
     * 
     * @returns the index of the last equal item, or `-1` if no equal
     * item was found.
     */
    lastIndexOfRange(value: T, fromIndex?: number, endIndex?: number): number {
        let index = this.lastInsertionIndexOf(value, fromIndex, endIndex);
        if(index >= 0 && index < this.length &&
            this.equalityFunc(this[index], value)
        ) {
            return index;
        }
        while(--index >= 0 &&
            this.compareFunc(value, this[index]) === 0
        ) {
            if(this.equalityFunc(this[index], value)) {
                return index;
            }
        }
        return -1;
    }
    
    /**
     * Check whether any item in the array is equal to the given value.
     * 
     * Equality is determined using the SortedArray's equality function,
     * which is {@link SortedArray.DefaultEqualityFunction} when not
     * otherwise specified.
     * 
     * @param value Check whether there is any value in the array that
     * is equal to this one.
     * @param fromIndex Start looking for items at this index, inclusive.
     * Defaults to `0`, i.e. the beginning of the array.
     * 
     * @returns `true` if an equal item was found in the array, or `false`
     * if not.
     */
    includes(value: T, fromIndex?: number): boolean {
        return this.indexOf(value, fromIndex) >= 0;
    }
    
    /**
     * Get a new SortedArray containing only those items which satisfy
     * a given predicate function.
     * 
     * @params predicate A callback function which is invoked for each
     * item in the array. The returned array will contain only those
     * items for which the callback returned a truthy value.
     * @params thisArg An optional `this` argument which the predicate
     * function should be called with.
     * 
     * @returns a new SortedArray containing only those values which
     * satisfied the predicate function.
     */
    filter<This = undefined>(
        predicate: SortedArrayElementCallback<This, T, unknown>,
        thisArg?: This,
    ): SortedArray<T> {
        if(typeof(predicate) !== "function") {
            throw new TypeError("Predicate is not a function.");
        }
        let index: number = 0;
        const array = new SortedArray(this.compareFunc, this.equalityFunc);
        array.reversedCompareFunc = this.reversedCompareFunc;
        for(let element of this) {
            if(predicate.call(<any> thisArg, element, index++, this)) {
                Array.prototype.push.call(array, element);
            }
        }
        return array;
    }
    
    /**
     * Reverse the items in the array, and update the array's comparator
     * function to account for this new reversed sort order.
     * Later insertions into this SortedArray will respect the reversed
     * sort order.
     * 
     * @returns this SortedArray.
     */
    reverse(): this {
        super.reverse();
        if(this.reversedCompareFunc) {
            const t = this.compareFunc;
            this.compareFunc = this.reversedCompareFunc;
            this.reversedCompareFunc = t;
        }
        else {
            const t = this.compareFunc;
            this.reversedCompareFunc = this.compareFunc;
            this.compareFunc = (a, b) => t(b, a);
        }
        return this;
    }
    
    /**
     * Get the items in the array from a start to an end index as a new
     * SortedArray.
     * 
     * @param start Get items starting at this index, inclusive.
     * Defaults to `0`, i.e. the beginning of the array.
     * @param end Get items ending at this index, exclusive.
     * Defaults to the length of the array.
     * 
     * @returns a new SortedArray containing the given array slice.
     */
    slice(start?: number, end?: number): SortedArray<T> {
        const slice = <SortedArray<T>> Array.prototype.slice.call(
            this, start, end
        );
        slice.equalityFunc = this.equalityFunc;
        slice.compareFunc = this.compareFunc;
        slice.reversedCompareFunc = this.reversedCompareFunc;
        return slice;
    }
    
    /**
     * Re-sort the list and assign a new comparator function.
     * 
     * The array items will be sorted using the Array `sort` function.
     * [(This is not guaranteed to be stable in all cases.)]
     * (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort#sort_stability)
     * 
     * @param compareFunc The new comparator function to use for
     * this SortedArray.
     * Uses {@link SortedArray.DefaultComparatorFunction} by default,
     * if no comparator function is specified.
     * 
     * @returns this SortedArray.
     */
    // @ts-ignore
    sort(compareFunc?: SortedArrayComparatorFunction<T>): this {
        compareFunc = compareFunc || SortedArrayDefaultComparatorFunction;
        if(compareFunc === this.compareFunc) {
            return this;
        }
        this.compareFunc = compareFunc;
        this.reversedCompareFunc = undefined;
        super.sort(compareFunc);
        return this;
    }
    
    /**
     * Remove items from the array, starting at a given index.
     * 
     * @param start Start removing items from the array at this index.
     * @param deleteCount The number of items that should be removed.
     * 
     * @returns A new SortedArray containing the removed items.
     */
    splice(start: number, deleteCount?: number): SortedArray<T>;
    /**
     * Remove items from the array, starting at a given index, and
     * insert new items at that index.
     * 
     * **Warning:** If inserting the provided `items` would invalidate
     * the implementation's assumptions about array items being in sorted
     * order, then the implementation will behave in unexpected ways.
     * Use this method with caution.
     * 
     * @param start Start removing items from the array at this index.
     * @param deleteCount The number of items that should be removed.
     * @param items A list of items which should be newly inserted in place
     * of the removed items. The implementation assumes that these items
     * can be inserted without violating the sort order of the SortedArray.
     * 
     * @returns A new SortedArray containing the removed items.
     */
    splice(start: number, deleteCount: number, ...items: T[]): SortedArray<T>;
    
    splice(
        start: number,
        deleteCount: number | undefined,
        ...items: T[]
    ): SortedArray<T> {
        const splice = <SortedArray<T>> Array.prototype.splice.call(
            // @ts-ignore
            this, start, deleteCount, ...items
        );
        splice.equalityFunc = this.equalityFunc;
        splice.compareFunc = this.compareFunc;
        splice.reversedCompareFunc = this.reversedCompareFunc;
        return splice;
    }
    
    // TODO: Can these be done in a less hacky way?
    
    /* TODO: ?
    concat(...items: (T | ConcatArray<T>)[]): T[] {
        (<any> this).constructor = Array;
        // @ts-ignore
        const array = Array.prototype.concat.apply(this, items);
        (<any> this).constructor = SortedArray;
        return <T[]> array;
    }
    
    flat<This, Depth extends number = 1>(
        this: This,
        depth?: Depth,
    ): FlatArray<This, Depth>[] {
        (<any> this).constructor = Array;
        // @ts-ignore
        const array = Array.prototype.flat.call(this, depth);
        (<any> this).constructor = SortedArray;
        return <FlatArray<This, Depth>[]> array;
    }
    
    // @ts-ignore
    flatMap<U, This = undefined>(
        transform: SortedArrayElementCallback<This, T, U | ReadonlyArray<U>>,
        thisArg?: This,
    ): U[] {
        (<any> this).constructor = Array;
        // @ts-ignore
        const array = Array.prototype.flatMap.call(this, <any> transform, thisArg);
        (<any> this).constructor = SortedArray;
        return <U[]> array;
    }
    
    // @ts-ignore
    map<U, This = undefined>(
        transform: SortedArrayElementCallback<This, T, U>,
        thisArg?: This,
    ): U[] {
        (<any> this).constructor = Array;
        // @ts-ignore
        const array = Array.prototype.map.call(this, <any> transform, thisArg);
        (<any> this).constructor = SortedArray;
        return <U[]> array;
    }
    */
}

export namespace SortedArray {
    /**
     * Type of an equality function that can be used in constructing and
     * configuring a {@link SortedArray} instance.
     * 
     * Equality functions accept two inputs and return a truthy value
     * when they are identical a falsey value when they are not.
     * 
     * See also {@link SortedArray.DefaultEqualityFunction}.
     * This is the default function that is used for a {@link SortedArray}
     * when none is explicitly provided.
     */
    export type EqualityFunction<T> = SortedArrayEqualityFunction<T>;
    
    /**
     * Type of a comparison function that can be used in constructing and
     * configuring a {@link SortedArray} instance.
     * 
     * Comparator functions accept two inputs and return a negative number
     * when the first argument comes before the second argumet in a sorted
     * order, a positive number when the first argument comes after the
     * second, and zero when they have same sort order.
     * 
     * See also {@link SortedArray.DefaultComparatorFunction}.
     * This is the default function that is used for a {@link SortedArray}
     * when none is explicitly provided.
     */
    export type ComparatorFunction<T> = SortedArrayComparatorFunction<T>;
    
    /**
     * Default equality function used by {@link SortedArray} instances,
     * when no other function was provided.
     * 
     * The default equality function uses `SameValueZero` comparison,
     * i.e. strict equality using the `===` triple equals operator.
     * 
     * See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness
     */
    export const DefaultEqualityFunction = SortedArrayDefaultEqualityFunction;
    
    /**
     * Default comparator function used by {@link SortedArray} instances,
     * when no other function was provided.
     * 
     * The default comparator function returns `-1` when `a < b`,
     * `+1` when `a > b`, and `0` otherwise.
     */
    export const DefaultComparatorFunction = SortedArrayDefaultComparatorFunction;
    
    /**
     * Generic callback type used by some {@link SortedArray} methods.
     */
    export type ElementCallback<This, T, U> = SortedArrayElementCallback<This, T, U>;
}
