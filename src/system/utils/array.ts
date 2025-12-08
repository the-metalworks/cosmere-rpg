/**
 * Applies a mapping function to an array in place, modifying the original array.
 * The function returns the modified array, now typed to reflect the result of the mapping.
 */
export function inPlaceMap<T, K>(
    array: T[],
    mapFn: (element: T, index: number, array: T[]) => K,
): K[] {
    array.forEach((element, index, arr) => {
        arr[index] = mapFn(element, index, arr) as unknown as T;
    });
    return array as unknown as K[];
}
