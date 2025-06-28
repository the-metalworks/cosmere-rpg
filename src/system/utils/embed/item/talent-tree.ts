// Documents
import { TalentTreeItem, CosmereItem } from '@system/documents/item';

// Application
import { TalentTreeEmbed } from '@system/applications/item/embeds/talent-tree-embed';

const EMBEDDED_APPS: Record<
    string,
    Record<string, Record<string, TalentTreeEmbed>>
> = {};

export async function buildEmbedHTML(
    item: TalentTreeItem,
    config: DocumentHTMLEmbedConfig,
    options?: TextEditor.EnrichmentOptions,
): Promise<HTMLElement | HTMLCollection | null> {
    if (!(options?.relativeTo instanceof JournalEntryPage)) return null;

    // Create the embedded application
    const embededApp = await getEmbedApp(item, options.relativeTo, config);

    // Return target
    return $(
        `<div class="embed-talent-tree-target" data-id="${embededApp.id}"></div>`,
    )[0];
}

export function createInlineEmbed(
    item: TalentTreeItem,
    content: HTMLElement | HTMLCollection,
    config: DocumentHTMLEmbedConfig,
    options?: TextEditor.EnrichmentOptions,
): Promise<HTMLElement | null> {
    const section = document.createElement('section');
    if (content instanceof HTMLCollection) section.append(...content);
    else section.append(content);

    section.classList.add('item-embed', 'talent-tree');

    return Promise.resolve(section);
}

async function getEmbedApp(
    item: TalentTreeItem,
    page: JournalEntryPage,
    config: DocumentHTMLEmbedConfig,
): Promise<TalentTreeEmbed> {
    const journalEntry = page.parent as unknown as JournalEntry;

    if (!EMBEDDED_APPS[journalEntry.uuid])
        EMBEDDED_APPS[journalEntry.uuid] = {};
    if (!EMBEDDED_APPS[journalEntry.uuid][page.id])
        EMBEDDED_APPS[journalEntry.uuid][page.id] = {};
    if (!EMBEDDED_APPS[journalEntry.uuid][page.id][item.id]) {
        EMBEDDED_APPS[journalEntry.uuid][page.id][item.id] =
            new TalentTreeEmbed({
                item,
                position: { width: (config.width ?? 600) as number },
            });
    }

    const app = EMBEDDED_APPS[journalEntry.uuid][page.id][item.id];

    if (config.x || config.y || config.zoom) {
        app.view = {};

        if (config.x) app.view.x = config.x as number;
        if (config.y) app.view.y = config.y as number;
        if (config.zoom) app.view.zoom = config.zoom as number;
    } else {
        app.view = undefined;
    }

    if (config.link) {
        app.linkedItem = (await fromUuid(
            config.link as string,
        )) as unknown as CosmereItem;
    }

    return app;
}

Hooks.on('renderJournalPageSheet', (app: JournalPageSheet, html: JQuery) => {
    const page = app.document as JournalEntryPage;
    const journalEntry = page.parent as unknown as JournalEntry;

    if (!EMBEDDED_APPS[journalEntry.uuid]?.[page.id]) return;

    // Get all embedded applications for this page
    const embedApps = Object.values(EMBEDDED_APPS[journalEntry.uuid][page.id]);

    setTimeout(() => {
        // Render each embedded application
        embedApps.forEach(async (embedApp) => {
            // Render the application
            await embedApp.render(true);

            // Find and replace the target element in the HTML
            html.find(
                `.embed-talent-tree-target[data-id="${embedApp.id}"]`,
            ).replaceWith(embedApp.element);
        });
    }, 10);
});

Hooks.on('closeJournalSheet', (app: JournalPageSheet) => {
    const journalEntry = app.document as JournalEntryPage;

    if (!EMBEDDED_APPS[journalEntry.uuid]) return;

    Object.values(EMBEDDED_APPS[journalEntry.uuid]).forEach((pageApps) => {
        Object.values(pageApps).forEach((embedApp) => {
            void embedApp.close();
        });
    });

    delete EMBEDDED_APPS[journalEntry.uuid];
});

export default {
    buildEmbedHTML,
    createInlineEmbed,
};
