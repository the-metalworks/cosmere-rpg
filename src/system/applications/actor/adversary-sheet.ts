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
    static DEFAULT_OPTIONS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.DEFAULT_OPTIONS),
        {
            classes: [SYSTEM_ID, 'sheet', 'actor', 'adversary'],
            position: {
                width: 850,
                height: 850,
            },
            dragDrop: [
                {
                    dropSelector: '*',
                },
            ],
            actions: {},
        },
    );

    static PARTS = foundry.utils.mergeObject(
        foundry.utils.deepClone(super.PARTS),
        {
            content: {
                template: `systems/${SYSTEM_ID}/templates/${TEMPLATES.ACTOR_ADVERSARY_CONTENT}`,
            },
        },
    );

    get actor(): AdversaryActor {
        return super.document;
    }

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
}
