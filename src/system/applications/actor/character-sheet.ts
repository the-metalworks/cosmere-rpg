import './components';

import { ItemType } from '@system/types/cosmere';
import { CharacterActor } from '@system/documents';
import { SYSTEM_ID } from '@src/system/constants';

// Base
import { BaseActorSheet } from './base';

const enum CharacterSheetTab {
    Details = 'details',
    Goals = 'goals',
}

export class CharacterSheet extends BaseActorSheet {
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            classes: [SYSTEM_ID, 'sheet', 'actor', 'character'],
            position: {
                width: 850,
                height: 1000,
            },
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            header: {
                template:
                    'systems/cosmere-rpg/templates/actors/character/parts/header.hbs',
            },
            'sheet-content': {
                template:
                    'systems/cosmere-rpg/templates/actors/character/parts/sheet-content.hbs',
                scrollable: ['.tab-body'],
            },
        },
    );

    static TABS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.TABS),
        {
            [CharacterSheetTab.Details]: {
                label: 'COSMERE.Actor.Sheet.Tabs.Details',
                icon: '<i class="fa-solid fa-feather-pointed"></i>',
                sortIndex: 0,
            },

            [CharacterSheetTab.Goals]: {
                label: 'COSMERE.Actor.Sheet.Tabs.Goals',
                icon: '<i class="fa-solid fa-list"></i>',
                sortIndex: 25,
            },
        },
    );

    get actor(): CharacterActor {
        return super.document;
    }

    /* --- Context --- */

    public async _prepareContext(
        options: Partial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        // Find the ancestry
        const ancestryItem = this.actor.items.find(
            (item) => item.type === ItemType.Ancestry,
        );

        // Find all paths
        const pathItems = this.actor.items.filter((item) => item.isPath());

        // Split paths by type
        const pathTypes = pathItems
            .map((item) => item.system.type)
            .filter((v, i, self) => self.indexOf(v) === i); // Filter out duplicates

        return {
            ...(await super._prepareContext(options)),

            pathTypes: pathTypes.map((type) => ({
                type,
                typeLabel: CONFIG.COSMERE.paths.types[type].label,
                paths: pathItems.filter((i) => i.system.type === type),
            })),

            ancestryLabel:
                ancestryItem?.name ??
                game.i18n?.localize('COSMERE.Item.Type.Ancestry.label'),
        };
    }
}
