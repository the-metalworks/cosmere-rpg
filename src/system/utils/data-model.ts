export function getAncestorDocument(
    model?: foundry.abstract.DataModel.Any,
): foundry.abstract.Document.Any | null {
    if (!model) return null;
    if (model instanceof foundry.abstract.Document) return model;
    return getAncestorDocument(model);
}

export default {
    getAncestorDocument,
};
