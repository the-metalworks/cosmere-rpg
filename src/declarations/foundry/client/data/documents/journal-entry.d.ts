declare class JournalEntry extends _ClientDocumentMixin(
    foundry.documents.BaseJournalEntry,
) {
    pages: Collection<JournalEntryPage>;
}
