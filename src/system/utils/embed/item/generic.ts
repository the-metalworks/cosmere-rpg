import { CosmereItem } from '@system/documents/item';

// Constants
import { TEMPLATES, renderSystemTemplate } from '@system/utils/templates';
const ITEM_EMBED_TEMPLATES: Record<string, string | undefined> = {
    talent: TEMPLATES.ITEM_TALENT_EMBED,
    culture: TEMPLATES.ITEM_CULTURE_EMBED,
    action: TEMPLATES.ITEM_ACTION_EMBED,
    path: TEMPLATES.ITEM_PATH_EMBED,
};

export async function buildEmbedHTML(
    item: CosmereItem,
    config: DocumentHTMLEmbedConfig,
    options?: TextEditor.EnrichmentOptions,
): Promise<HTMLElement | HTMLCollection | null> {
    if (!ITEM_EMBED_TEMPLATES[item.type]) return null;

    // Create the link data string
    const linkDataStr = getLinkDataStr(item);

    // Enrich the description
    let description = null;
    if (item.hasDescription())
        description = await TextEditor.enrichHTML(
            item.system.description?.value ??
                item.system.description?.short ??
                '',
            options,
        );

    // Render template
    const html = await renderSystemTemplate(ITEM_EMBED_TEMPLATES[item.type]!, {
        item,
        config,
        options,
        linkDataStr,
        description,
    });

    // Get elements
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content.children;
}

export function createInlineEmbed(
    item: Item,
    content: HTMLElement | HTMLCollection,
    config: DocumentHTMLEmbedConfig,
    options?: TextEditor.EnrichmentOptions,
): Promise<HTMLElement | null> {
    const section = document.createElement('section');
    if (content instanceof HTMLCollection) section.append(...content);
    else section.append(content);

    section.classList.add('item-embed', item.type);

    // Parse the uuid
    const { id, uuid, collection } = foundry.utils.parseUuid(item.uuid);

    // Set attributes
    section.setAttribute('draggable', 'true');
    section.setAttribute('data-link', '');
    section.dataset.uuid = uuid;
    section.dataset.id = id;
    section.dataset.type = item.documentName;

    if (collection instanceof CompendiumCollection)
        section.dataset.pack = collection.collection as string;

    return Promise.resolve(section);
}

export function getLinkDataStr(
    item: Item,
    dataset?: Record<string, string>,
): string {
    // Generate content link
    const link = item.toAnchor({ dataset });

    // Get the dataset
    const outputDataset = link.dataset;

    // Create data string
    return Object.entries(outputDataset)
        .map(([key, value]) => `data-${key}="${value}"`)
        .join(' ');
}
