import { PowerItem } from '@system/documents/item';
import { DeepPartial } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

// Base
import { BaseItemSheet } from './base';

// Mixins
import { TalentsTabMixin } from './mixins/talents-tab';

export class PowerItemSheet extends TalentsTabMixin(BaseItemSheet) {
    declare item: PowerItem;

    static DEFAULT_OPTIONS = {
        classes: [SYSTEM_ID, 'sheet', 'item', 'power'],
        position: {
            width: 625,
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
                template: `${TEMPLATES.DIRECTORY}${TEMPLATES.ITEM_POWER_CONTENT}`,
            },
        },
    );

    /* --- Context --- */

    public async _prepareContext(
        options: DeepPartial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        // Check if the power has a talent tree set
        const hasTalentTree = this.item.system.talentTree !== null;

        // Enable the talents tab if the power has a talent tree set
        this.tabs.talents.enabled = hasTalentTree;
        return {
            ...(await super._prepareContext(options)),
        };
    }
}
