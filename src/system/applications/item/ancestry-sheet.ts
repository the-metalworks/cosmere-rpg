import { AncestryItem } from '@system/documents/item';
import { DeepPartial } from '@system/types/utils';

import { BaseItemSheet } from './base';

export class AncestrySheet extends BaseItemSheet {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            classes: ['cosmere-rpg', 'sheet', 'item', 'ancestry'],
            position: {
                width: 600,
                height: 550,
            },
            window: {
                resizable: true,
                positioned: true,
                title: '<i class="fas fa-timeline"></i> ' + this.name,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            'sheet-content': {
                template:
                    'systems/cosmere-rpg/templates/item/ancestry/parts/sheet-content.hbs',
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
        return {
            ...(await super._prepareContext(options)),
        };
    }
}