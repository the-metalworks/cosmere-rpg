/* eslint-disable @typescript-eslint/no-explicit-any */
declare class AnyConstructableDocument extends foundry.abstract.Document<
    foundry.abstract.Document.Type,
    {},
    foundry.abstract.Document.Any | null
> {
    constructor(...args: any[]);
    _source: object;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export namespace Document {
    export namespace Constructable {
        export type AnyConstructor = typeof AnyConstructableDocument;

        export type SystemConstructor = AnyConstructor & {
            metadata: { name: foundry.abstract.Document.SystemType };
        };
    }
}
