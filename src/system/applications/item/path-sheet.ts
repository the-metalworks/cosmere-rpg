import { PathItem, TalentTreeItem } from '@system/documents/item';
import { CharacterActor } from '@system/documents/actor';
import { DeepPartial } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Base
import { BaseItemSheet } from './base';

// Mixins
import { TalentsTabMixin } from './mixins/talents-tab';

export class PathItemSheet extends TalentsTabMixin(BaseItemSheet) {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            classes: [SYSTEM_ID, 'sheet', 'item', 'path'],
            position: {
                width: 550,
            },
            window: {
                resizable: false,
                positioned: true,
            },
        },
    );

    static TABS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.TABS),
        {
            details: {
                label: 'COSMERE.Item.Sheet.Tabs.Details',
                icon: '<i class="fa-solid fa-circle-info"></i>',
                sortIndex: 15,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            content: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_PATH_CONTENT}`,
            },
        },
    );

    get item(): PathItem {
        return super.document;
    }

    /* --- Context --- */

    public async _prepareContext(
        options: DeepPartial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        // Get non-core (locked) skills
        const linkedSkillsOptions = Object.entries(CONFIG.COSMERE.skills)
            .filter(([key, config]) => !config.core)
            .reduce(
                (acc, [key, config]) => ({
                    ...acc,
                    [key]: config.label,
                }),
                {},
            );

        return {
            ...(await super._prepareContext(options)),

            linkedSkillsOptions,
        };
    }
}
