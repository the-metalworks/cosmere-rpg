import { ArmorItem } from '@system/documents/item';
import { DeepPartial } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Base
import { BaseItemSheet } from './base';

export class ArmorItemSheet extends BaseItemSheet {
    declare item: ArmorItem;

    static DEFAULT_OPTIONS = {
        classes: [SYSTEM_ID, 'sheet', 'item', 'armor'],
        position: {
            width: 550,
        },
        window: {
            resizable: false,
            positioned: true,
        },
    };

    static TABS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.TABS),
        {
            details: {
                label: 'COSMERE.Item.Sheet.Tabs.Details',
                icon: '<i class="fa-solid fa-circle-info"></i>',
                sortIndex: 15,
            },
            actions: {
                label: 'COSMERE.Item.Sheet.Tabs.Actions',
                icon: '<i class="cosmere-icon">3</i>',
                sortIndex: 19,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            content: {
                template: `${TEMPLATES.DIRECTORY}${TEMPLATES.ITEM_ARMOR_CONTENT}`,
            },
        },
    );

    /* --- Context --- */

    public async _prepareContext(
        options: DeepPartial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        return {
            ...(await super._prepareContext(options)),
        };
    }
}
