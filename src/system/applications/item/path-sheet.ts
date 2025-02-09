import { PathItem } from '@system/documents/item';
import { DeepPartial } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';

// Base
import { BaseItemSheet } from './base';

export class PathItemSheet extends BaseItemSheet {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            classes: [SYSTEM_ID, 'sheet', 'item', 'path'],
            position: {
                width: 550,
            },
            window: {
                resizable: true,
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
            'sheet-content': {
                template:
                    'systems/cosmere-rpg/templates/item/path/parts/sheet-content.hbs',
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
