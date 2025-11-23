export function PseudoEmbeddableMixin<
    const ConcreteDocumentName extends
        PseudoEmbeddableMixin.ConcreteDocumentType,
>(concreteDocumentName: ConcreteDocumentName) {
    const cls = CONFIG[concreteDocumentName].documentClass;

    return class extends cls {};
}

export namespace PseudoEmbeddableMixin {
    export type ConcreteDocumentType = 'Item';
}
