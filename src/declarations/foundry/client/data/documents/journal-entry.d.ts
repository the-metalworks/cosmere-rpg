declare class JournalEntry extends _ClientDocumentMixin(
    foundry.documents.BaseJournalEntry,
) {
    name: string;
    pages: Collection<JournalEntryPage>;
}
