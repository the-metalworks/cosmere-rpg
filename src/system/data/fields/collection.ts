export type CollectionFieldOptions = foundry.data.fields.DataFieldOptions;

/**
 * A collection that is backed by a record object instead of a Map.
 * This allows us to persit it properly and update items easily,
 * while still having the convenience of a collection.
 */
export class RecordCollection<T> implements Collection<T> {
    /**
     * NOTE: Must use `any` here as we need the RecordCollection
     * to be backing record object itself. This ensures its stored
     * properly.
     */
    /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
    constructor(entries?: [string, T][]) {
        if (entries) {
            entries.forEach(([key, value]) => {
                (this as any)[key] = value;
            });
        }
    }

    get contents(): T[] {
        return Object.entries(this).map(([key, value]) => ({
            ...value,
            _id: key,
        }));
    }

    public find<S extends T>(
        condition: (e: T, index: number, collection: Collection<T>) => e is S,
    ): S | undefined;
    public find(
        condition: (e: T, index: number, collection: Collection<T>) => boolean,
    ): T | undefined;
    public find(
        condition: (e: T, index: number, collection: Collection<T>) => boolean,
    ): T | undefined {
        return Object.entries(this).find(([key, value], index) =>
            condition({ ...value, _id: key }, index, this),
        )?.[1];
    }

    public filter<S extends T>(
        condition: (e: T, index: number, collection: Collection<T>) => e is S,
    ): S[];
    public filter(
        condition: (e: T, index: number, collection: Collection<T>) => boolean,
    ): T[];
    public filter(
        condition: (e: T, index: number, collection: Collection<T>) => boolean,
    ): T[] {
        return Object.entries(this)
            .filter(([key, value], index) =>
                condition({ ...value, _id: key }, index, this),
            )
            .map(([key, value]) => value);
    }

    public has(key: string): boolean {
        return key in this;
    }

    public get(key: string, options: { strict: true }): T;
    public get(key: string, options?: { strict: false }): T | undefined;
    public get(
        key: string,
        options: { strict: boolean } = { strict: false },
    ): T | undefined {
        if (!this.has(key)) {
            if (options.strict) throw new Error(`key ${key} not found`);
            return undefined;
        }
        return (this as any)[key];
    }

    public getName(name: string, options: { strict: true }): T;
    public getName(name: string, options?: { strict: false }): T | undefined;
    public getName(
        name: string,
        options: { strict: boolean } = { strict: false },
    ): T | undefined {
        const record = this.contents.find(
            (value) =>
                value &&
                typeof value === 'object' &&
                'name' in value &&
                value.name === name,
        );
        if (!record) {
            if (options.strict) throw new Error(`name ${name} not found`);
            return undefined;
        }
        return record;
    }

    public map<M>(
        transformer: (entity: T, index: number, collection: Collection<T>) => M,
    ): M[] {
        return Object.entries(this).map(([key, value], index) =>
            transformer({ ...value, _id: key }, index, this),
        );
    }

    public reduce<A>(
        evaluator: (
            accumulator: A,
            value: T,
            index: number,
            collection: Collection<T>,
        ) => A,
        initialValue: A,
    ): A {
        return Object.entries(this).reduce(
            (accumulator, [key, value], index) =>
                evaluator(accumulator, { ...value, _id: key }, index, this),
            initialValue,
        );
    }

    public some(
        condition: (
            value: T,
            index: number,
            collection: Collection<T>,
        ) => boolean,
    ): boolean {
        return Object.entries(this).some(([key, value], index) =>
            condition({ ...value, _id: key }, index, this),
        );
    }

    public set(key: string, value: T): this {
        (this as any)[key] = value;
        return this;
    }

    public delete(key: string): boolean {
        if (!this.has(key)) return false;
        delete (this as any)[key];
        return true;
    }

    public clear(): void {
        Object.keys(this).forEach((key) => delete (this as any)[key]);
    }

    public get size(): number {
        return Object.keys(this).length;
    }

    public entries(): IterableIterator<[string, T]> {
        return Object.entries(this) as unknown as IterableIterator<[string, T]>;
    }

    public keys(): IterableIterator<string> {
        return Object.keys(this)[Symbol.iterator]();
    }

    public values(): IterableIterator<T> {
        return Object.keys(this)
            .map((key) => ({
                ...this.get(key)!,
                _id: key,
            }))
            [Symbol.iterator]();
    }

    public forEach(
        callbackfn: (value: T, key: string, map: this) => void,
        thisArg?: any,
    ): void {
        Object.entries(this).forEach(([key, value]) =>
            callbackfn.call(thisArg, value, key, this),
        );
    }

    [Symbol.iterator](): IterableIterator<T> {
        return this.values();
    }

    // NOTE: This is implicitly readonly as we don't have a way to set it.
    // eslint-disable-next-line @typescript-eslint/class-literal-property-style
    get [Symbol.toStringTag]() {
        return 'RecordCollection';
    }

    public toJSON() {
        return this.contents.reduce((acc, value) => {
            if (value && typeof value === 'object' && 'toJSON' in value) {
                value = { ...(value as any).toJSON(), _id: (value as any)._id };
            }
            return { ...acc, [(value as any)._id]: value };
        }, {} as any);
    }
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
}

export class CollectionField<
    ElementField extends
        foundry.data.fields.DataField = foundry.data.fields.DataField,
> extends foundry.data.fields.ObjectField {
    constructor(
        public readonly model: ElementField,
        options: CollectionFieldOptions = {},
        context?: foundry.data.fields.DataFieldContext,
        private CollectionClass: typeof RecordCollection = RecordCollection,
    ) {
        super(options, context);
    }

    protected override _cleanType(
        value: RecordCollection<unknown>,
        options?: object,
    ) {
        Array.from(value.entries()).forEach(([id, v]) => {
            value.set(id, this.model.clean(v, options));
        });

        return value;
    }

    protected override _validateType(
        value: unknown,
        options?: foundry.data.fields.DataFieldValidationOptions,
    ): boolean | foundry.data.fields.DataModelValidationFailure | void {
        if (!(value instanceof this.CollectionClass))
            throw new Error('must be a RecordCollection');
        const errors = this._validateValues(value, options);
        if (!foundry.utils.isEmpty(errors)) {
            // Create validatior failure
            const failure =
                new foundry.data.validation.DataModelValidationFailure();

            // Set fields
            failure.fields = errors;

            // Throw error
            throw new foundry.data.validation.DataModelValidationError(failure);
        }
    }

    protected _validateValues(
        value: RecordCollection<unknown>,
        options?: foundry.data.fields.DataFieldValidationOptions,
    ) {
        const errors: Record<
            string,
            foundry.data.validation.DataModelValidationFailure
        > = {};
        Array.from(value.entries()).forEach(([id, v]) => {
            const error = this.model.validate(
                v,
                options,
            ) as foundry.data.validation.DataModelValidationFailure | null;
            if (error) {
                errors[id] = error;
            }
        });

        return errors;
    }

    protected override _cast(value: object) {
        const result =
            value instanceof this.CollectionClass
                ? value
                : foundry.utils.getType(value) === 'Map'
                  ? new this.CollectionClass(
                        Array.from((value as Map<string, unknown>).entries()),
                    )
                  : foundry.utils.getType(value) === 'Object'
                    ? new this.CollectionClass(Object.entries(value))
                    : foundry.utils.getType(value) === 'Array'
                      ? new this.CollectionClass(
                            (value as { _id?: string; id?: string }[]).map(
                                (v, i) => [v._id ?? v.id ?? i.toString(), v],
                            ),
                        )
                      : new this.CollectionClass();

        return result;
    }

    public override getInitialValue() {
        return new this.CollectionClass();
    }

    public override initialize(
        value: RecordCollection<unknown>,
        model: object,
        options?: object,
    ) {
        if (!value) return new this.CollectionClass();
        value = foundry.utils.deepClone(value);

        Array.from(value.entries()).forEach(([id, v]) => {
            value.set(id, this.model.initialize(v, model, options));
        });

        return value;
    }

    public override toObject(value: RecordCollection<unknown>) {
        const result = Array.from(value.entries()).reduce(
            (acc, [id, v]) => ({
                ...acc,
                [id]: this.model.toObject(v) as unknown,
            }),
            {},
        );
        return result;
    }

    public override _getField(path: string[]): foundry.data.fields.DataField {
        if (path.length === 0) return this;
        else if (path.length === 1) return this.model;

        path.shift();
        return this.model._getField(path);
    }
}
