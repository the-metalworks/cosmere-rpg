declare namespace JournalEntryPage {
    interface BuildTOCOptions {
        /**
         * Include references to the heading DOM elements in the returned ToC.
         * @default true
         */
        includeElement?: boolean;
    }
}

declare interface JournalEntryPageHeading {
    text: string;
    level: number;
    slug: string;
    children: JournalEntryPageHeading[];
    element?: HTMLElement;
}

declare class JournalEntryPage extends _ClientDocumentMixin(
    foundry.documents.BaseJournalEntryPage,
) {
    /**
     * Build a table of contents for the given HTML content.
     * @param html                     The HTML content to generate a ToC outline for.
     * @param options                  Additional options to configure ToC generation.
     */
    static buildTOC(
        html: HTMLElement[],
        options?: JournalEntryPage.BuildTOCOptions,
    ): Record<string, JournalEntryPageHeading>;

    text: {
        content: string;
        format: number;
        type: string;
    };
}
