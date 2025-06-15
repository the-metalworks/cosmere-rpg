import { AnyObject } from '@system/types/utils';

export interface CollectionFieldOptions<T = AnyObject>
    extends foundry.data.fields.DataFieldOptions {
    /**
     * The field to draw the item key from.
     * Alternatively, you can use a function to generate the key.
     *
     * @default "id"
     */
    key?: keyof T | ((item: T) => string);
}

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
        return Object.entries(this).map(([key, value]) =>
            'id' in value ? value : { ...value, _id: key },
        );
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
            condition(
                'id' in value ? value : { ...value, _id: key },
                index,
                this,
            ),
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
                condition(
                    'id' in value ? value : { ...value, _id: key },
                    index,
                    this,
                ),
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
            transformer(
                'id' in value ? value : { ...value, _id: key },
                index,
                this,
            ),
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
                evaluator(
                    accumulator,
                    'id' in value ? value : { ...value, _id: key },
                    index,
                    this,
                ),
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
            condition(
                'id' in value ? value : { ...value, _id: key },
                index,
                this,
            ),
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
        return Object.entries(this)
            .map(([key, value]) =>
                'id' in value ? value : { ...value, _id: key },
            )
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
        return Array.from(this.entries()).reduce((acc, [key, value]) => {
            if (value && typeof value === 'object' && 'toJSON' in value) {
                value = (value as any).toJSON();
            }
            return { ...acc, [key]: value };
        }, {} as any);
    }
    /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
}

export class CollectionField<
    ElementField extends
        foundry.data.fields.DataField = foundry.data.fields.DataField,
    T = AnyObject,
> extends foundry.data.fields.ObjectField {
    declare options: CollectionFieldOptions<T>;

    constructor(
        public readonly model: ElementField,
        options: CollectionFieldOptions<T> = {},
        context?: foundry.data.fields.DataFieldContext,
        private CollectionClass: typeof RecordCollection = RecordCollection,
    ) {
        super(options, context);
    }

    protected override _cleanType(
        value: Record<string, unknown>,
        options?: object,
    ) {
        Array.from(Object.entries(value)).forEach(([key, v]) => {
            const cleaned = this.model.clean(v, options) as T & {
                id?: string;
                _id?: string;
            };

            if (key.startsWith('-=')) {
                value[key] = cleaned;
            } else {
                // Determine the key
                const prevKey = key;
                key = this.getItemKey(cleaned) ?? key;

                if (key !== prevKey) delete value[prevKey];

                value[key] = cleaned;
            }
        });

        return value;
    }

    protected override _validateType(
        value: unknown,
        options?: foundry.data.fields.DataFieldValidationOptions,
    ): boolean | foundry.data.fields.DataModelValidationFailure | void {
        if (foundry.utils.getType(value) !== 'Object')
            throw new Error('must be a RecordCollection object');

        const errors = this._validateValues(
            value as Record<string, unknown>,
            options,
        );
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
        value: Record<string, unknown>,
        options?: foundry.data.fields.DataFieldValidationOptions,
    ) {
        const errors: Record<
            string,
            foundry.data.validation.DataModelValidationFailure
        > = {};
        Object.entries(value).forEach(([id, v]) => {
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
        // Get entries
        const entries =
            value instanceof this.CollectionClass
                ? Array.from<[string, unknown]>(value.entries())
                : foundry.utils.getType(value) === 'Map'
                  ? Array.from((value as Map<string, unknown>).entries())
                  : foundry.utils.getType(value) === 'Object'
                    ? (Object.entries(value) as [string, unknown][])
                    : foundry.utils.getType(value) === 'Array'
                      ? (value as ({ _id?: string; id?: string } & T)[]).map(
                            (v, i) =>
                                [this.getItemKey(v) ?? i, v] as [
                                    string,
                                    unknown,
                                ],
                        )
                      : [];

        // Reduce entries to Record<string, unknown>
        return entries.reduce(
            (acc, [key, value]) => ({
                ...acc,
                [key]: value,
            }),
            {} as Record<string, unknown>,
        );
    }

    public override getInitialValue() {
        return new this.CollectionClass();
    }

    public override initialize(
        value: Record<string, unknown>,
        model: object,
        options?: object,
    ) {
        if (!value) return new this.CollectionClass();
        value = foundry.utils.deepClone(value);
        const collection = new this.CollectionClass(Object.entries(value));

        Array.from(collection.entries()).forEach(([id, v]) => {
            collection.set(id, this.model.initialize(v, model, options));
        });

        return collection;
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

    private getItemKey(
        item: T & { id?: string; _id?: string },
    ): string | undefined {
        return typeof this.options.key === 'function'
            ? this.options.key(item)
            : ((item[this.options.key ?? 'id'] as string | undefined) ??
                  item._id ??
                  undefined);
    }
}
