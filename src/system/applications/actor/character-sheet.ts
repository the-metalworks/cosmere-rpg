import './components';

import { ItemType } from '@system/types/cosmere';
import { CharacterActor } from '@system/documents';
import { SYSTEM_ID } from '@src/system/constants';

// Base
import { BaseActorSheet } from './base';
import { TEMPLATES } from '@src/system/utils/templates';

const enum CharacterSheetTab {
    Details = 'details',
    Goals = 'goals',
}

export class CharacterSheet extends BaseActorSheet {
    declare actor: CharacterActor;

    private static readonly MIN_WIDTH = 800;
    private static readonly MAX_WIDTH = 800;
    private static readonly MIN_HEIGHT = 728;
    private static readonly MAX_HEIGHT = 900;

    private isApplyingPositionConstraint = false;

    static DEFAULT_OPTIONS = {
        classes: [SYSTEM_ID, 'sheet', 'actor', 'character'] as string[],
        window: {
            positioned: true,
            resizable: true,
        },
        position: {
            width: CharacterSheet.MIN_WIDTH,
            height: Math.max(
                Math.min(CharacterSheet.MAX_HEIGHT, window.innerHeight),
                CharacterSheet.MIN_HEIGHT,
            ),
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            header: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_HEADER}`,
            },
            content: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_CHARACTER_CONTENT}`,
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

    /* --- Context --- */

    public async _prepareContext(
        options: Partial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        // Find the ancestry
        const ancestryItem = this.actor.items.find((item) => item.isAncestry());

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

    /* --- Lifecycle --- */

    protected override _onPosition(options: unknown): void {
        super._onPosition(options);

        if (this.isApplyingPositionConstraint) return;

        const width = this.position.width as number;
        const height = this.position.height as number;

        const clampedWidth = Math.min(
            Math.max(width, CharacterSheet.MIN_WIDTH),
            CharacterSheet.MAX_WIDTH,
        );
        const clampedHeight = Math.min(
            Math.max(height, CharacterSheet.MIN_HEIGHT),
            CharacterSheet.MAX_HEIGHT,
        );

        if (width === clampedWidth && height === clampedHeight) return;

        // Since we are setting the position, this will set off the _onPosition event. We ensure this code wont loop forever.
        this.isApplyingPositionConstraint = true;
        this.setPosition({
            width: clampedWidth,
            height: clampedHeight,
        });
        this.isApplyingPositionConstraint = false;
    }
}
