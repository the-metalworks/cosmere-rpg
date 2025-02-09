import { CultureItem } from '@system/documents/item';
import { DeepPartial } from '@system/types/utils';
import { SYSTEM_ID } from '@src/system/constants';

// Base
import { BaseItemSheet } from './base';

export class CultureItemSheet extends BaseItemSheet {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            classes: [SYSTEM_ID, 'sheet', 'item', 'culture'],
            position: {
                width: 550,
            },
            window: {
                resizable: true,
                positioned: true,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            'sheet-content': {
                template:
                    'systems/cosmere-rpg/templates/item/parts/sheet-content.hbs',
            },
        },
    );

    get item(): CultureItem {
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
