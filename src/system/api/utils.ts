export function objectsEqual<A extends object, B extends A>(
    a: A,
    b: B,
    ignoreKeys: (keyof A | keyof B)[] = [],
): a is B {
    if (a === b) return true;

    // Make a copy of the object without ignored keys
    const filteredA = Object.fromEntries(
        Object.entries(a).filter(
            ([key]) => !ignoreKeys.includes(key as keyof A),
        ),
    );
    const filteredB = Object.fromEntries(
        Object.entries(b).filter(
            ([key]) => !ignoreKeys.includes(key as keyof B),
        ),
    );

    return foundry.utils.objectsEqual(filteredA, filteredB);
}
