export function getRawDocumentSources(documentType: string): unknown[] {
    const collection = game.collections?.get(documentType);
    if (!collection) {
        throw new Error(`Failed to retrieve "${documentType}" collection`);
    }

    return collection._source;
}

export default {
    getRawDocumentSources,
};
