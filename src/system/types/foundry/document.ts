/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */
declare class AnyConstructableDocument extends foundry.abstract.Document<
    foundry.abstract.Document.Type,
    {},
    foundry.abstract.Document.Any | null
> {
    constructor(...args: any[]);
    _source: object;
}
/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type */

export namespace Document {
    export namespace Constructable {
        export type AnyConstructor = typeof AnyConstructableDocument;

        export type SystemConstructor = AnyConstructor & {
            metadata: { name: foundry.abstract.Document.SystemType };
        };
    }
}
