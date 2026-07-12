import { AdversaryActor } from '@system/documents';
import { SYSTEM_ID } from '@src/system/constants';

// Components
import { SearchBarInputEvent } from './components';

// Base
import { BaseActorSheet, BaseActorSheetRenderContext } from './base';
import { TEMPLATES } from '@src/system/utils/templates';

export type AdversarySheetRenderContext = Omit<
    BaseActorSheetRenderContext,
    'actor'
> & {
    actor: AdversaryActor;
};

export class AdversarySheet extends BaseActorSheet<AdversarySheetRenderContext> {
    declare actor: AdversaryActor;

    private static readonly MIN_MARGIN = 40;
    private static readonly MIN_WIDTH = 800;
    private static readonly DEFAULT_WIDTH = 850;
    private static readonly MIN_HEIGHT = 675;
    private static readonly DEFAULT_HEIGHT = 850;
    
    private isApplyingPositionConstraint = false;

    static DEFAULT_OPTIONS = {
        classes: [SYSTEM_ID, 'sheet', 'actor', 'adversary'],
        window: {
            positioned: true,
            resizable: true
        },
        position: {
            width: Math.min(Math.max(AdversarySheet.MIN_WIDTH, window.innerWidth - AdversarySheet.MIN_MARGIN), AdversarySheet.DEFAULT_WIDTH),
            height: Math.min(Math.max(AdversarySheet.MIN_HEIGHT, window.innerHeight - AdversarySheet.MIN_MARGIN), AdversarySheet.DEFAULT_HEIGHT),
        },
        dragDrop: [
            {
                dropSelector: '*',
            },
        ],
        actions: {},
    };

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            content: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_ADVERSARY_CONTENT}`,
            },
        },
    );

    get areSkillsCollapsed(): boolean {
        return this.actor.getFlag(SYSTEM_ID, 'sheet.skillsCollapsed') ?? false;
    }

    get hideUnrankedSkills(): boolean {
        return this.actor.getFlag(SYSTEM_ID, 'sheet.hideUnranked') ?? false;
    }

    /* --- Event handlers --- */

    protected onActionsSearchChange(event: SearchBarInputEvent) {
        this.actionsSearchText = event.detail.text;
        this.actionsSearchSort = event.detail.sort;

        void this.render({
            parts: [],
            components: ['app-adversary-actions-list'],
        });
    }

    /* --- Context --- */

    public async _prepareContext(
        options: Partial<foundry.applications.api.ApplicationV2.RenderOptions>,
    ) {
        return {
            ...(await super._prepareContext(options)),

            skillsCollapsed: this.areSkillsCollapsed,
            hideUnrankedSkills: this.hideUnrankedSkills,
        };
    }

    /* --- Lifecycle --- */
    
    protected override _onPosition(options: unknown): void {
        super._onPosition(options);

        if (this.isApplyingPositionConstraint) return;

        const width = this.position.width as number;
        const height = this.position.height as number;

        const curMaxWidth = window.innerWidth - AdversarySheet.MIN_MARGIN;
        const curMaxHeight = window.innerHeight - AdversarySheet.MIN_MARGIN;

        const clampedWidth = Math.max(Math.min(width, curMaxWidth), AdversarySheet.MIN_WIDTH);
        const clampedHeight = Math.max(Math.min(height, curMaxHeight), AdversarySheet.MIN_HEIGHT);

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
