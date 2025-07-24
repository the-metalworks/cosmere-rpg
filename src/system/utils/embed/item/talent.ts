import { TalentTree } from '@system/types/item';

// Documents
import { TalentItem, TalentTreeItem } from '@system/documents/item';

// Generics
import { createInlineEmbed, getLinkDataStr } from './generic';

// Constants
import { TEMPLATES, renderSystemTemplate } from '@system/utils/templates';

export async function buildEmbedHTML(
    item: TalentItem,
    config: DocumentHTMLEmbedConfig,
    options?: TextEditor.EnrichmentOptions,
): Promise<HTMLElement | HTMLCollection | null> {
    // Create the link data string
    const linkDataStr = getLinkDataStr(item);

    // Assign prerequisite based on the config
    let prerequisite = null;
    if (config.tree && typeof config.tree === 'string') {
        const tree = (await fromUuid(config.tree)) as unknown as TalentTreeItem;

        // Find the talent node in the tree (ignore nested trees)
        const node = tree.system.nodes.find(
            (n) =>
                n.type === TalentTree.Node.Type.Talent &&
                n.talentId === item.system.id,
        ) as TalentTree.TalentNode | undefined;

        if (node) {
            prerequisite = node.prerequisites;
        }
    } else if (config.prerequisite && typeof config.prerequisite === 'string') {
        prerequisite = config.prerequisite;
    }

    // Enrich the description
    const description = await TextEditor.enrichHTML(
        item.system.description?.value ?? item.system.description?.short ?? '',
        {
            relativeTo: options?.relativeTo,
            documents: options?.documents,
            links: options?.links,
            rollData: options?.rollData,
            rolls: options?.rolls,
            secrets: options?.secrets,
        },
    );

    // Render template
    const html = await renderSystemTemplate(TEMPLATES.ITEM_TALENT_EMBED, {
        item,
        config,
        options,
        linkDataStr,
        prerequisite,
        description,
    });

    // Get elements
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content.children;
}

export default {
    buildEmbedHTML,
    createInlineEmbed,
};
