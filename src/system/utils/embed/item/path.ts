// Documents
import { PathItem, TalentTreeItem } from '@system/documents/item';

// Talent tree embed
import {
    buildEmbedHTML as buildTalentTreeEmbedHTML,
    createInlineEmbed as createTalentTreeInlineEmbed,
} from './talent-tree';

// Generics
import {
    buildEmbedHTML as buildGenericEmbedHTML,
    createInlineEmbed as createGenericInlineEmbed,
} from './generic';

export async function buildEmbedHTML(
    item: PathItem,
    config: DocumentHTMLEmbedConfig,
    options?: TextEditor.EnrichmentOptions,
): Promise<HTMLElement | HTMLCollection | null> {
    if (!(options?.relativeTo instanceof JournalEntryPage)) return null;

    if (config.values?.includes('talents') && item.system.talentTree) {
        // Get the talent tree item
        const tree = (await fromUuid(
            item.system.talentTree,
        )) as unknown as TalentTreeItem;

        // Build the talent tree embed HTML
        return buildTalentTreeEmbedHTML(
            tree,
            foundry.utils.mergeObject(config, {
                link: item.uuid,
            }),
            options,
        );
    } else {
        return buildGenericEmbedHTML(item, config, options);
    }
}

export async function createInlineEmbed(
    item: PathItem,
    content: HTMLElement | HTMLCollection,
    config: DocumentHTMLEmbedConfig,
    options?: TextEditor.EnrichmentOptions,
): Promise<HTMLElement | null> {
    if (config.values?.includes('talents') && item.system.talentTree) {
        // Get the talent tree item
        const tree = (await fromUuid(
            item.system.talentTree,
        )) as unknown as TalentTreeItem;

        // Create the inline embed for the talent tree
        return createTalentTreeInlineEmbed(
            tree,
            content,
            foundry.utils.mergeObject(config, {
                link: item.uuid,
            }),
            options,
        );
    } else {
        // Create the inline embed for the generic item
        return createGenericInlineEmbed(item, content, config, options);
    }
}

export default {
    buildEmbedHTML,
    createInlineEmbed,
};
