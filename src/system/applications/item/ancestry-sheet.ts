import { AncestryItem } from '@system/documents/item';
import { DeepPartial } from '@system/types/utils';
import { Talent } from '@system/types/item';

// Base
import { BaseItemSheet } from './base';

// Mixins
import { TalentsTabMixin } from './mixins/talents-tab';

// Constants
import { SYSTEM_ID } from '@src/system/constants';
import { TEMPLATES } from '@src/system/utils/templates';

export class AncestrySheet extends TalentsTabMixin(BaseItemSheet) {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            classes: [SYSTEM_ID, 'sheet', 'item', 'ancestry'],
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
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.ITEM_ANCESTRY_CONTENT}`,
            },
        },
    );

    get item(): AncestryItem {
        return super.document;
    }

    /* --- Context --- */

    public async _prepareContext(
        options: DeepPartial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        // Check if the ancestry has a talent tree set
        const hasTalentTree = this.item.system.talentTree !== null;

        // Enable the talents tab if the ancestry has a talent tree set
        this.tabs.talents.enabled = hasTalentTree;

        return {
            ...(await super._prepareContext(options)),
        };
    }
}
