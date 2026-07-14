import './components';

import { ItemType } from '@system/types/cosmere';
import { CharacterActor } from '@system/documents';
import { SYSTEM_ID } from '@src/system/constants';

// Base
import { BaseActorSheet } from './base';
import { TEMPLATES } from '@src/system/utils/templates';

const enum CharacterSheetTab {
    Details = 'details',
    Talents = 'talents',
    Goals = 'goals',
}

export class CharacterSheet extends BaseActorSheet {
    declare actor: CharacterActor;

    private static readonly MIN_MARGIN = 40;
    private static readonly MIN_WIDTH = 800; //Min width and default width are the same currently
    private static readonly MIN_HEIGHT = 675;
    private static readonly DEFAULT_HEIGHT = 900;

    private isApplyingPositionConstraint = false;

    static DEFAULT_OPTIONS = {
        classes: [SYSTEM_ID, 'sheet', 'actor', 'character'] as string[],
        window: {
            positioned: true,
            resizable: true,
        },
        //By default, we want our ideal sheet size with our max height/width
        // BUT we need to be within the viewport no matter what. Otherwise users can't use certain functions
        position: {
            width: Math.min(
                window.innerWidth - CharacterSheet.MIN_MARGIN,
                CharacterSheet.MIN_WIDTH,
            ),
            height: Math.min(
                Math.max(
                    CharacterSheet.MIN_HEIGHT,
                    window.innerHeight - CharacterSheet.MIN_MARGIN,
                ),
                CharacterSheet.DEFAULT_HEIGHT,
            ),
        },
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            header: {
                template: `${TEMPLATES.DIRECTORY}${TEMPLATES.ACTOR_CHARACTER_HEADER}`,
            },
            content: {
                template: `${TEMPLATES.DIRECTORY}${TEMPLATES.ACTOR_CHARACTER_CONTENT}`,
                scrollable: this.scrollableContent,
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

            [CharacterSheetTab.Talents]: {
                label: 'COSMERE.Actor.Sheet.Tabs.Talents',
                icon: '<i class="fa-solid fa-book"></i>',
                sortIndex: 1,
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

        const curMaxWidth = window.innerWidth - CharacterSheet.MIN_MARGIN;
        const curMaxHeight = window.innerHeight - CharacterSheet.MIN_MARGIN;

        const clampedWidth = Math.max(
            Math.min(width, curMaxWidth),
            CharacterSheet.MIN_WIDTH,
        );
        const clampedHeight = Math.max(
            Math.min(height, curMaxHeight),
            CharacterSheet.MIN_HEIGHT,
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
