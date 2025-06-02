interface JournalEntryPageTextFromUuidOptions {
    /**
     * Whether or not to enrich the html content.
     * @default false
     */
    enrich?: boolean;

    /**
     * Whether or not to include the heading in the returned text.
     * @default true
     */
    includeHeading?: boolean;
}

export async function journalEntryPageTextFromUuid(
    uuid: string,
    options: JournalEntryPageTextFromUuidOptions = {},
): Promise<string | null> {
    // Default options
    options.includeHeading = options.includeHeading ?? true;

    // Parse the UUID
    const { collection, documentId, id, type } = foundry.utils.parseUuid(uuid);
    if (!collection || !documentId || !id) return null;
    if (type !== 'JournalEntryPage') return null;

    // Load the journal entry
    const journal =
        collection instanceof CompendiumCollection
            ? ((await collection.getDocument(documentId)) as JournalEntry)
            : (collection.get(documentId) as JournalEntry);
    if (!journal) return null;

    const [pageId, target] = id.split('#') as [string, string | undefined];

    // Get the page
    const page = journal.pages.get(pageId);
    if (!page) return null;

    // Get the text content of the page
    const text = getPageTextContent(page, target, options.includeHeading);
    if (!text) return null;

    // Enrich the text if requested
    return options.enrich
        ? await TextEditor.enrichHTML(text, {
              relativeTo: page as unknown as foundry.abstract.Document.Any,
          })
        : text;
}

function getPageTextContent(
    page: JournalEntryPage,
    target: string | undefined,
    includeHeading = true,
): string | null {
    if (!target) return page.text.content;

    const renderTarget = document.createElement('template');
    renderTarget.innerHTML = page.text.content;
    const toc = JournalEntryPage.buildTOC(
        Array.from(renderTarget.content.children) as HTMLElement[],
    );

    const validTargets = Object.keys(toc);

    // Check if the target exists in the ToC
    if (!validTargets.includes(target)) return null;

    // Get the target heading
    const heading = toc[target].element;
    if (!heading) return null;

    const headingIndex = validTargets.indexOf(target);
    const nextHeading =
        headingIndex + 1 < validTargets.length
            ? toc[validTargets[headingIndex + 1]].element
            : null;

    // Get the text between the heading and the next heading
    const els = $(heading)
        .nextUntil(nextHeading ?? '')
        .filter((_, el) => $(el).text().trim() !== '');

    // Return the text content of the elements and the heading
    return [
        includeHeading ? heading.outerHTML : '',
        ...els.toArray().map((el) => el.outerHTML),
    ].join('');
}
